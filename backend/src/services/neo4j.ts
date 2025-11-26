import neo4j, { Driver, Session } from 'neo4j-driver'
import { logger } from '@utils/logger'

class Neo4jService {
  private driver: Driver | null = null
  private connected: boolean = false

  async connect(): Promise<boolean> {
    try {
      logger.info('🔌 连接Neo4j数据库...')
      
      const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://f36358f7.databases.neo4j.io'
      const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
      const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U'

      this.driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
      )

      await this.driver.verifyConnectivity()
      this.connected = true
      
      logger.info('✅ Neo4j连接成功！')
      return true
    } catch (error) {
      logger.error('❌ Neo4j连接失败:', error)
      this.connected = false
      return false
    }
  }

  isConnected(): boolean {
    return this.connected && this.driver !== null
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized')
    }
    return this.driver.session()
  }

  async getStats() {
    const session = this.getSession()
    try {
      const nodeResult = await session.run('MATCH (n) RETURN count(n) as total')
      const totalNodes = nodeResult.records[0].get('total').toNumber()

      const labelResult = await session.run(`
        MATCH (n) 
        RETURN DISTINCT labels(n) as labels, count(n) as count
      `)
      
      const labelStats = labelResult.records.map(record => ({
        label: record.get('labels')[0],
        count: record.get('count').toNumber()
      }))

      const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as total')
      const totalRelationships = relResult.records[0]?.get('total')?.toNumber() || 0

      return {
        totalNodes,
        totalRelationships,
        labelStats,
        dataCompleteness: 100
      }
    } catch (error) {
      logger.error('获取统计数据失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async getRootNodes(limit: number = 20) {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (n)
        WHERE n.classificationLevel = 1 OR n.code ENDS WITH '.'
        RETURN n.code as code, 
               COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
               n.category as category,
               n.classificationLevel as level
        ORDER BY n.code
        LIMIT $limit
      `, { limit: neo4j.int(limit) })
      
      return result.records.map(record => ({
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')?.toNumber() || 0
      }))
    } catch (error) {
      logger.error('获取根节点失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async searchNodes(query: string, category: string | null = null, limit: number = 10) {
    const session = this.getSession()
    try {
      let cypher = `
        MATCH (n)
        WHERE (n.mainTerm CONTAINS $query OR n.code CONTAINS $query OR n.节点名称 CONTAINS $query)
      `
      
      const params: any = { query, limit: neo4j.int(limit * 3) }
      
      if (category) {
        cypher += ` AND n.category = $category`
        params.category = category
      }
      
      cypher += `
        RETURN n.code as code,
               COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
               n.category as category,
               n.classificationLevel as level
        ORDER BY n.code ASC
      `
      
      const result = await session.run(cypher, params)
      
      // 去重处理（基于code）
      const seenCodes = new Map<string, any>()
      const lowerQuery = query.toLowerCase()
      
      for (const record of result.records) {
        const code = record.get('code')
        const name = record.get('name')
        
        if (!seenCodes.has(code)) {
          let relevance = 50
          
          const codeLower = (code || '').toLowerCase()
          const nameLower = (name || '').toLowerCase()
          
          if (codeLower === lowerQuery) {
            relevance = 100
          } else if (codeLower.startsWith(lowerQuery)) {
            relevance = 80
          } else if (nameLower === lowerQuery) {
            relevance = 90
          } else if (nameLower.includes(lowerQuery)) {
            relevance = 70
          } else if (codeLower.includes(lowerQuery)) {
            relevance = 60
          }
          
          seenCodes.set(code, {
            code: code,
            name: name,
            category: record.get('category'),
            level: record.get('level')?.toNumber() || 0,
            relevance: relevance
          })
        }
      }
      
      let results = Array.from(seenCodes.values())
      results.sort((a, b) => {
        if (a.relevance !== b.relevance) {
          return b.relevance - a.relevance
        }
        if (a.level !== b.level) {
          return a.level - b.level
        }
        return a.code.localeCompare(b.code, 'zh-CN')
      })
      
      results = results.slice(0, limit).map(({ relevance, ...rest }) => rest)
      
      return results
    } catch (error) {
      logger.error('搜索节点失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async getNodeDetails(code: string) {
    const session = this.getSession()
    try {
      const nodeResult = await session.run(`
        MATCH (n {code: $code})
        RETURN n.code as code,
               COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
               n.category as category,
               n.classificationLevel as level,
               n
      `, { code })
      
      if (nodeResult.records.length === 0) {
        return null
      }
      
      const record = nodeResult.records[0]
      const node = record.get('n').properties
      
      // 获取父节点
      const codeParts = code.split('.')
      const parentCodes: string[] = []
      
      for (let i = codeParts.length - 1; i > 0; i--) {
        const parentCode = codeParts.slice(0, i).join('.')
        parentCodes.push(parentCode)
        parentCodes.push(parentCode + '.')
      }
      
      let parentResult
      if (parentCodes.length > 0) {
        parentResult = await session.run(`
          MATCH (parent)
          WHERE parent.code IN $parentCodes
          RETURN DISTINCT parent.code as code,
                 COALESCE(parent.mainTerm, parent.节点名称, parent.显示名称) as name,
                 parent.category as category,
                 parent.classificationLevel as level
          ORDER BY parent.code
          LIMIT 10
        `, { parentCodes })
      } else {
        parentResult = { records: [] }
      }
      
      // 获取子节点
      const childrenResult = await session.run(`
        MATCH (child)
        WHERE child.code STARTS WITH $code + '.' 
          AND child.code <> $code
        RETURN DISTINCT child.code as code,
               COALESCE(child.mainTerm, child.节点名称, child.显示名称) as name,
               child.category as category,
               child.classificationLevel as level
        ORDER BY child.code
        LIMIT 50
      `, { code })
      
      const parents = parentResult.records.map(record => ({
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')?.toNumber() || 0
      }))
      
      const children = childrenResult.records.map(record => ({
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')?.toNumber() || 0
      }))
      
      return {
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')?.toNumber() || 0,
        properties: node,
        parents: parents,
        children: children,
        parentCount: parents.length,
        childrenCount: children.length
      }
    } catch (error) {
      logger.error('获取节点详情失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async getGraphData(rootCode?: string, depth: number = 2, limit: number = 100) {
    const session = this.getSession()
    try {
      let cypher: string
      const params: any = { limit: neo4j.int(limit) }

      if (rootCode) {
        params.rootCode = rootCode
        params.depth = depth
        
        cypher = `
          MATCH path = (root {code: $rootCode})-[*1..${depth}]->(child)
          WITH DISTINCT root, child, relationships(path) as rels
          UNWIND rels as r
          WITH DISTINCT root, child, startNode(r) as start, endNode(r) as end
          RETURN DISTINCT 
            root.code as rootCode,
            root.mainTerm as rootName,
            child.code as childCode,
            COALESCE(child.mainTerm, child.节点名称, child.显示名称) as childName,
            child.category as childCategory,
            child.classificationLevel as childLevel,
            start.code as startCode,
            end.code as endCode
          LIMIT $limit
        `
      } else {
        cypher = `
          MATCH (root)
          WHERE root.classificationLevel = 1 OR root.code ENDS WITH '.'
          WITH root
          LIMIT 20
          
          OPTIONAL MATCH (root)-[*1..1]->(child)
          WHERE child.code STARTS WITH root.code + '.'
          
          WITH DISTINCT root, child
          RETURN 
            root.code as rootCode,
            COALESCE(root.mainTerm, root.节点名称, root.显示名称) as rootName,
            root.category as rootCategory,
            root.classificationLevel as rootLevel,
            collect(DISTINCT {
              code: child.code,
              name: COALESCE(child.mainTerm, child.节点名称, child.显示名称),
              category: child.category,
              level: child.classificationLevel
            }) as children
          LIMIT $limit
        `
      }

      const result = await session.run(cypher, params)
      
      const nodes = new Map<string, any>()
      const edges: any[] = []

      if (rootCode) {
        result.records.forEach(record => {
          const rootCode = record.get('rootCode')
          const rootName = record.get('rootName')
          const childCode = record.get('childCode')
          const childName = record.get('childName')
          const childCategory = record.get('childCategory')
          const childLevel = record.get('childLevel')?.toNumber() || 0
          const startCode = record.get('startCode')
          const endCode = record.get('endCode')

          if (rootCode && !nodes.has(rootCode)) {
            nodes.set(rootCode, {
              id: rootCode,
              label: rootName || rootCode,
              code: rootCode,
              name: rootName || rootCode,
              category: '疾病类',
              level: 1
            })
          }

          if (childCode && !nodes.has(childCode)) {
            nodes.set(childCode, {
              id: childCode,
              label: childName || childCode,
              code: childCode,
              name: childName || childCode,
              category: childCategory || '疾病类',
              level: childLevel
            })
          }

          if (startCode && endCode && startCode !== endCode) {
            const edgeId = `${startCode}-${endCode}`
            if (!edges.find(e => e.id === edgeId)) {
              edges.push({
                id: edgeId,
                source: startCode,
                target: endCode,
                type: 'contains'
              })
            }
          }
        })
      } else {
        result.records.forEach(record => {
          const rootCode = record.get('rootCode')
          const rootName = record.get('rootName')
          const rootCategory = record.get('rootCategory')
          const rootLevel = record.get('rootLevel')?.toNumber() || 1
          const children = record.get('children') || []

          if (rootCode && !nodes.has(rootCode)) {
            nodes.set(rootCode, {
              id: rootCode,
              label: rootName || rootCode,
              code: rootCode,
              name: rootName || rootCode,
              category: rootCategory || '疾病类',
              level: rootLevel
            })
          }

          children.forEach((child: any) => {
            if (child.code && !nodes.has(child.code)) {
              nodes.set(child.code, {
                id: child.code,
                label: child.name || child.code,
                code: child.code,
                name: child.name || child.code,
                category: child.category || '疾病类',
                level: child.level || 0
              })

              const edgeId = `${rootCode}-${child.code}`
              if (!edges.find((e: any) => e.id === edgeId)) {
                edges.push({
                  id: edgeId,
                  source: rootCode,
                  target: child.code,
                  type: 'contains'
                })
              }
            }
          })
        })
      }

      return {
        nodes: Array.from(nodes.values()),
        edges: edges,
        nodeCount: nodes.size,
        edgeCount: edges.length
      }
    } catch (error) {
      logger.error('获取图谱数据失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.connected = false
      logger.info('🔌 Neo4j连接已关闭')
    }
  }
}

export const neo4jService = new Neo4jService()

