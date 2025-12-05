import neo4j, { Driver, Session, Integer } from 'neo4j-driver'
import { logger } from '@utils/logger.js'

/**
 * 将 Neo4j Integer 转换为普通 JavaScript 数字
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0
  }
  if (neo4j.isInt(value)) {
    return value.toNumber()
  }
  if (typeof value === 'object' && 'low' in value && 'high' in value) {
    // Neo4j Integer 对象格式 {low, high}
    return Integer.fromValue(value).toNumber()
  }
  return Number(value) || 0
}

/**
 * 递归处理对象中的 Neo4j Integer
 */
function convertNeo4jIntegers(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  if (neo4j.isInt(obj)) {
    return obj.toNumber()
  }
  if (typeof obj === 'object' && 'low' in obj && 'high' in obj) {
    return Integer.fromValue(obj).toNumber()
  }
  if (Array.isArray(obj)) {
    return obj.map(item => convertNeo4jIntegers(item))
  }
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      result[key] = convertNeo4jIntegers(obj[key])
    }
    return result
  }
  return obj
}

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

  /**
   * 获取一元知识图谱（仅实体）
   */
  async getUnaryGraph(limit: number = 1000) {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (n)
        RETURN n.code as code,
               COALESCE(n.name, n.mainTerm, n.节点名称, n.显示名称) as name,
               n.category as category,
               COALESCE(n.classificationLevel, n.level, 1) as level
        ORDER BY n.code
        LIMIT $limit
      `, { limit: neo4j.int(limit) })
      
      return result.records.map(record => ({
        id: record.get('code'),
        code: record.get('code'),
        name: record.get('name'),
        category: record.get('category'),
        level: record.get('level')?.toNumber() || 1
      }))
    } catch (error) {
      logger.error('获取一元图谱失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * 获取二元知识图谱（实体+关系）
   */
  async getBinaryGraph(rootCode?: string, depth: number = 2, limit: number = 100) {
    const session = this.getSession()
    try {
      let query = ''
      let params: any = { depth: neo4j.int(depth), limit: neo4j.int(limit) }
      
      if (rootCode) {
        query = `
          MATCH path = (root {code: $rootCode})-[*1..${depth}]-(connected)
          WITH DISTINCT nodes(path) as nodes, relationships(path) as rels
          UNWIND nodes as n
          UNWIND rels as r
          WITH DISTINCT n, r
          RETURN 
            collect(DISTINCT {
              id: n.code,
              code: n.code,
              name: COALESCE(n.name, n.mainTerm, n.节点名称, n.显示名称),
              category: n.category,
              level: COALESCE(n.classificationLevel, n.level, 1)
            }) as nodes,
            collect(DISTINCT {
              id: id(r),
              source: startNode(r).code,
              target: endNode(r).code,
              type: type(r)
            }) as edges
          LIMIT $limit
        `
        params.rootCode = rootCode
      } else {
        query = `
          MATCH (n)-[r]->(m)
          RETURN 
            collect(DISTINCT {
              id: n.code,
              code: n.code,
              name: COALESCE(n.name, n.mainTerm, n.节点名称, n.显示名称),
              category: n.category,
              level: COALESCE(n.classificationLevel, n.level, 1)
            }) + collect(DISTINCT {
              id: m.code,
              code: m.code,
              name: COALESCE(m.name, m.mainTerm, m.节点名称, m.显示名称),
              category: m.category,
              level: COALESCE(m.classificationLevel, m.level, 1)
            }) as nodes,
            collect(DISTINCT {
              id: id(r),
              source: n.code,
              target: m.code,
              type: type(r)
            }) as edges
          LIMIT $limit
        `
      }
      
      const result = await session.run(query, params)
      const record = result.records[0]
      
      // 去重节点并转换 Neo4j Integer
      const nodesMap = new Map()
      record.get('nodes').forEach((node: any) => {
        if (!nodesMap.has(node.id)) {
          nodesMap.set(node.id, convertNeo4jIntegers(node))
        }
      })

      return {
        nodes: Array.from(nodesMap.values()),
        edges: convertNeo4jIntegers(record.get('edges'))
      }
    } catch (error) {
      logger.error('获取二元图谱失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * 获取三元知识图谱（实体+关系+属性）
   */
  async getTernaryGraph(limit: number = 1000) {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (subject)-[r]->(object)
        RETURN 
          collect(DISTINCT {
            id: subject.code,
            code: subject.code,
            name: COALESCE(subject.name, subject.mainTerm, subject.节点名称, subject.显示名称),
            category: subject.category,
            level: COALESCE(subject.classificationLevel, subject.level, 1)
          }) + collect(DISTINCT {
            id: object.code,
            code: object.code,
            name: COALESCE(object.name, object.mainTerm, object.节点名称, object.显示名称),
            category: object.category,
            level: COALESCE(object.classificationLevel, object.level, 1)
          }) as nodes,
          collect(DISTINCT {
            id: id(r),
            source: subject.code,
            target: object.code,
            predicate: COALESCE(r.predicate, type(r)),
            type: type(r),
            confidence: COALESCE(r.confidence, 1.0),
            source: r.source,
            properties: properties(r)
          }) as triples
        LIMIT $limit
      `, { limit: neo4j.int(limit) })
      
      const record = result.records[0]

      // 去重节点并转换 Neo4j Integer
      const nodesMap = new Map()
      record.get('nodes').forEach((node: any) => {
        if (!nodesMap.has(node.id)) {
          nodesMap.set(node.id, convertNeo4jIntegers(node))
        }
      })

      return {
        nodes: Array.from(nodesMap.values()),
        triples: convertNeo4jIntegers(record.get('triples'))
      }
    } catch (error) {
      logger.error('获取三元图谱失败:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * 获取链式关系知识图谱（疾病→穴位→经络→症状→方剂→中药材）
   */
  async getChainGraph(diseaseCode?: string, limit: number = 200) {
    const session = this.getSession()
    try {
      let cypher: string
      const params: any = { limit: neo4j.int(limit) }

      if (diseaseCode) {
        // 从指定疾病开始查询链式关系
        params.diseaseCode = diseaseCode
        cypher = `
          // 匹配疾病节点
          MATCH (disease {code: $diseaseCode})
          WHERE disease.category = '疾病类' OR disease.category CONTAINS '疾病'
          
          // 查找疾病相关的所有节点（通过任意关系）
          OPTIONAL MATCH path1 = (disease)-[*1..2]->(n1)
          WHERE n1.category = '穴位' OR n1.category CONTAINS '穴位'
          
          // 查找穴位相关的经络
          OPTIONAL MATCH path2 = (n1)-[*1..2]->(n2)
          WHERE n2.category = '经络' OR n2.category CONTAINS '经络'
          
          // 查找经络相关的症状
          OPTIONAL MATCH path3 = (n2)-[*1..2]->(n3)
          WHERE n3.category = '症状' OR n3.category CONTAINS '症状'
          
          // 查找症状相关的方剂
          OPTIONAL MATCH path4 = (n3)-[*1..2]->(n4)
          WHERE n4.category = '方剂' OR n4.category CONTAINS '方剂'
          
          // 查找方剂相关的中药材
          OPTIONAL MATCH path5 = (n4)-[*1..2]->(n5)
          WHERE n5.category = '中药材' OR n5.category CONTAINS '中药材' OR n5.category = '中药'
          
          // 收集所有节点和边
          WITH disease, 
               collect(DISTINCT n1) as acupoints,
               collect(DISTINCT n2) as meridians,
               collect(DISTINCT n3) as symptoms,
               collect(DISTINCT n4) as formulas,
               collect(DISTINCT n5) as herbs,
               relationships(path1) as rels1,
               relationships(path2) as rels2,
               relationships(path3) as rels3,
               relationships(path4) as rels4,
               relationships(path5) as rels5
          
          // 构建节点列表
          WITH [disease] + acupoints + meridians + symptoms + formulas + herbs as allNodes,
               rels1, rels2, rels3, rels4, rels5
          
          UNWIND allNodes as node
          WHERE node IS NOT NULL
          
          // 构建边列表
          WITH collect(DISTINCT {
            id: node.code,
            code: node.code,
            name: COALESCE(node.name, node.mainTerm, node.节点名称, node.显示名称),
            category: node.category,
            level: COALESCE(node.classificationLevel, node.level, 1)
          }) as nodes,
          rels1, rels2, rels3, rels4, rels5, disease
          
          // 提取边信息
          WITH nodes, disease,
               [r IN rels1 WHERE r IS NOT NULL | {source: startNode(r).code, target: endNode(r).code, type: type(r)}] +
               [r IN rels2 WHERE r IS NOT NULL | {source: startNode(r).code, target: endNode(r).code, type: type(r)}] +
               [r IN rels3 WHERE r IS NOT NULL | {source: startNode(r).code, target: endNode(r).code, type: type(r)}] +
               [r IN rels4 WHERE r IS NOT NULL | {source: startNode(r).code, target: endNode(r).code, type: type(r)}] +
               [r IN rels5 WHERE r IS NOT NULL | {source: startNode(r).code, target: endNode(r).code, type: type(r)}] as allRels
          
          UNWIND allRels as rel
          WHERE rel.source IS NOT NULL AND rel.target IS NOT NULL
          
          RETURN nodes,
                 collect(DISTINCT {
                   id: rel.source + '-' + rel.target,
                   source: rel.source,
                   target: rel.target,
                   type: COALESCE(rel.type, '相关')
                 }) as edges
          LIMIT $limit
        `
      } else {
        // 查询所有链式关系（简化版本：查找所有相关节点）
        cypher = `
          // 查找所有疾病节点
          MATCH (disease)
          WHERE disease.category = '疾病类' OR disease.category CONTAINS '疾病'
          WITH disease
          LIMIT 50
          
          // 查找疾病相关的穴位
          OPTIONAL MATCH (disease)-[r1]->(acupoint)
          WHERE acupoint.category = '穴位' OR acupoint.category CONTAINS '穴位'
          
          // 查找穴位相关的经络
          OPTIONAL MATCH (acupoint)-[r2]->(meridian)
          WHERE meridian.category = '经络' OR meridian.category CONTAINS '经络'
          
          // 查找经络相关的症状
          OPTIONAL MATCH (meridian)-[r3]->(symptom)
          WHERE symptom.category = '症状' OR symptom.category CONTAINS '症状'
          
          // 查找症状相关的方剂
          OPTIONAL MATCH (symptom)-[r4]->(formula)
          WHERE formula.category = '方剂' OR formula.category CONTAINS '方剂'
          
          // 查找方剂相关的中药材
          OPTIONAL MATCH (formula)-[r5]->(herb)
          WHERE herb.category = '中药材' OR herb.category CONTAINS '中药材' OR herb.category = '中药'
          
          WITH disease, acupoint, meridian, symptom, formula, herb, r1, r2, r3, r4, r5
          
          RETURN 
            collect(DISTINCT {
              id: disease.code,
              code: disease.code,
              name: COALESCE(disease.name, disease.mainTerm, disease.节点名称, disease.显示名称),
              category: disease.category,
              level: COALESCE(disease.classificationLevel, disease.level, 1)
            }) + 
            collect(DISTINCT {
              id: acupoint.code,
              code: acupoint.code,
              name: COALESCE(acupoint.name, acupoint.mainTerm, acupoint.节点名称, acupoint.显示名称),
              category: acupoint.category,
              level: COALESCE(acupoint.classificationLevel, acupoint.level, 1)
            }) +
            collect(DISTINCT {
              id: meridian.code,
              code: meridian.code,
              name: COALESCE(meridian.name, meridian.mainTerm, meridian.节点名称, meridian.显示名称),
              category: meridian.category,
              level: COALESCE(meridian.classificationLevel, meridian.level, 1)
            }) +
            collect(DISTINCT {
              id: symptom.code,
              code: symptom.code,
              name: COALESCE(symptom.name, symptom.mainTerm, symptom.节点名称, symptom.显示名称),
              category: symptom.category,
              level: COALESCE(symptom.classificationLevel, symptom.level, 1)
            }) +
            collect(DISTINCT {
              id: formula.code,
              code: formula.code,
              name: COALESCE(formula.name, formula.mainTerm, formula.节点名称, formula.显示名称),
              category: formula.category,
              level: COALESCE(formula.classificationLevel, formula.level, 1)
            }) +
            collect(DISTINCT {
              id: herb.code,
              code: herb.code,
              name: COALESCE(herb.name, herb.mainTerm, herb.节点名称, herb.显示名称),
              category: herb.category,
              level: COALESCE(herb.classificationLevel, herb.level, 1)
            }) as nodes,
            collect(DISTINCT {
              id: id(r1),
              source: disease.code,
              target: acupoint.code,
              type: COALESCE(type(r1), '对应')
            }) +
            collect(DISTINCT {
              id: id(r2),
              source: acupoint.code,
              target: meridian.code,
              type: COALESCE(type(r2), '属于')
            }) +
            collect(DISTINCT {
              id: id(r3),
              source: meridian.code,
              target: symptom.code,
              type: COALESCE(type(r3), '对应')
            }) +
            collect(DISTINCT {
              id: id(r4),
              source: symptom.code,
              target: formula.code,
              type: COALESCE(type(r4), '对应')
            }) +
            collect(DISTINCT {
              id: id(r5),
              source: formula.code,
              target: herb.code,
              type: COALESCE(type(r5), '包含')
            }) as edges
          LIMIT $limit
        `
      }

      const result = await session.run(cypher, params)
      const record = result.records[0]

      if (!record) {
        return {
          nodes: [],
          edges: [],
          nodeCount: 0,
          edgeCount: 0
        }
      }

      // 去重节点并转换 Neo4j Integer
      const nodesMap = new Map()
      const nodesArray = record.get('nodes') || []
      nodesArray.forEach((node: any) => {
        if (node && node.id && !nodesMap.has(node.id)) {
          nodesMap.set(node.id, convertNeo4jIntegers(node))
        }
      })

      // 去重边并转换 Neo4j Integer
      const edgesMap = new Map()
      const edgesArray = record.get('edges') || []
      edgesArray.forEach((edge: any) => {
        if (edge && edge.source && edge.target) {
          const edgeId = edge.id || `${edge.source}-${edge.target}`
          if (!edgesMap.has(edgeId)) {
            edgesMap.set(edgeId, convertNeo4jIntegers(edge))
          }
        }
      })

      return {
        nodes: Array.from(nodesMap.values()),
        edges: Array.from(edgesMap.values()),
        nodeCount: nodesMap.size,
        edgeCount: edgesMap.size
      }
    } catch (error) {
      logger.error('获取链式关系图谱失败:', error)
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

