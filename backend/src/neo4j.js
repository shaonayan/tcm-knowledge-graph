import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'

dotenv.config()

class Neo4jService {
  constructor() {
    this.driver = null
    this.connected = false
  }

  async connect() {
    try {
      console.log('🔌 连接Neo4j数据库...')
      
      // 使用您确认的连接信息
      this.driver = neo4j.driver(
        'neo4j+s://f36358f7.databases.neo4j.io',
        neo4j.auth.basic('neo4j', 'qwertyuiop06')
      )

      // 验证连接
      await this.driver.verifyConnectivity()
      this.connected = true
      
      console.log('✅ Neo4j连接成功！')
      return true
      
    } catch (error) {
      console.error('❌ Neo4j连接失败:', error.message)
      this.connected = false
      return false
    }
  }

  async getStats() {
    const session = this.driver.session()
    try {
      // 获取统计数据
      const nodeCountResult = await session.run('MATCH (n) RETURN count(n) as total')
      const totalNodes = nodeCountResult.records[0].get('total').toNumber()

      const labelStatsResult = await session.run(`
        MATCH (n) 
        RETURN DISTINCT labels(n) as labels, count(n) as count
      `)
      
      const labelStats = labelStatsResult.records.map(record => ({
        label: record.get('labels')[0],
        count: record.get('count').toNumber()
      }))

      // 获取关系统计
      const relCountResult = await session.run('MATCH ()-[r]->() RETURN count(r) as total')
      const totalRelationships = relCountResult.records[0]?.get('total')?.toNumber() || 0

      return {
        totalNodes,
        totalRelationships,
        labelStats,
        dataCompleteness: 100
      }
      
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async getRootNodes() {
    const session = this.driver.session()
    try {
      const result = await session.run(`
        MATCH (n)
        WHERE n.classificationLevel = 1 OR n.code ENDS WITH '.'
        RETURN n.code as code, 
               COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
               n.category as category,
               n.classificationLevel as level
        ORDER BY n.code
        LIMIT 20
      `)
      
      return result.records.map(record => ({
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')
      }))
      
    } catch (error) {
      console.error('获取根节点失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async searchNodes(query, category = null, limit = 10) {
    const session = this.driver.session()
    try {
      let cypher = `
        MATCH (n)
        WHERE (n.mainTerm CONTAINS $query OR n.code CONTAINS $query OR n.节点名称 CONTAINS $query)
      `
      
      const params = { query, limit: neo4j.int(limit) }
      
      if (category) {
        cypher += ` AND n.category = $category`
        params.category = category
      }
      
      cypher += `
        RETURN n.code as code,
               COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
               n.category as category,
               n.classificationLevel as level
        ORDER BY n.code
        LIMIT $limit
      `
      
      const result = await session.run(cypher, params)
      
      return result.records.map(record => ({
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')
      }))
      
    } catch (error) {
      console.error('搜索节点失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async getNodeDetails(code) {
    const session = this.driver.session()
    try {
      const result = await session.run(`
        MATCH (n {code: $code})
        RETURN n
      `, { code })
      
      if (result.records.length === 0) {
        return null
      }
      
      const node = result.records[0].get('n').properties
      
      return {
        code: node.code,
        name: node.mainTerm || node.节点名称 || node.显示名称,
        category: node.category,
        level: node.classificationLevel,
        properties: node
      }
      
    } catch (error) {
      console.error('获取节点详情失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async close() {
    if (this.driver) {
      await this.driver.close()
      this.connected = false
      console.log('🔌 Neo4j连接已关闭')
    }
  }
}

export default new Neo4jService()
