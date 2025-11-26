import express from 'express'
import cors from 'cors'
import neo4j from 'neo4j-driver'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

// 中间�?
const corsOrigin = process.env.FRONTEND_URL || (NODE_ENV === 'production' ? '*' : 'http://localhost:3000')
app.use(cors({
  origin: corsOrigin,
  credentials: true
}))
app.use(express.json())

// 静态文件服务（生产环境�? 必须在API路由之前
if (NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../frontend/dist')
  app.use(express.static(frontendDistPath))
}

// Neo4j连接配置
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://f36358f7.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U'

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
)

let dbConnected = false

// 测试连接
async function testConnection() {
  try {
    await driver.verifyConnectivity()
    dbConnected = true
    console.log('�?Neo4j连接成功�?)
  } catch (error) {
    console.error('�?Neo4j连接失败:', error.message)
    dbConnected = false
  }
}

// 启动时测试连�?
testConnection()

// API路由

// 健康检�?
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const session = driver.session()
  try {
    // 获取节点总数
    const nodeResult = await session.run('MATCH (n) RETURN count(n) as total')
    const totalNodes = nodeResult.records[0].get('total').toNumber()

    // 获取标签统计
    const labelResult = await session.run(`
      MATCH (n) 
      RETURN DISTINCT labels(n) as labels, count(n) as count
    `)
    
    const labelStats = labelResult.records.map(record => ({
      label: record.get('labels')[0],
      count: record.get('count').toNumber()
    }))

    // 获取关系总数
    const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as total')
    const totalRelationships = relResult.records[0]?.get('total')?.toNumber() || 0

    res.json({
      success: true,
      data: {
        totalNodes,
        totalRelationships,
        labelStats,
        dataCompleteness: 100
      }
    })

  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  } finally {
    await session.close()
  }
})

// 获取根节�?
app.get('/api/nodes/roots', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const session = driver.session()
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
    
    const roots = result.records.map(record => ({
      code: record.get('code'),
      name: record.get('name'),
      category: record.get('category'),
      level: record.get('level')?.toNumber() || 0
    }))

    res.json({
      success: true,
      data: roots
    })

  } catch (error) {
    console.error('获取根节点失�?', error)
    res.status(500).json({ error: '获取根节点失�? })
  } finally {
    await session.close()
  }
})

// 搜索节点
app.get('/api/search', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { q, category, limit = 10 } = req.query
  
  if (!q) {
    return res.status(400).json({ error: '搜索关键词不能为�? })
  }

  const session = driver.session()
  try {
    // 查询结果，获取更多数据用于去重和排序
    let cypher = `
      MATCH (n)
      WHERE (n.mainTerm CONTAINS $query OR n.code CONTAINS $query OR n.节点名称 CONTAINS $query)
    `
    
    const params = { query: q, limit: neo4j.int(parseInt(limit) * 3) } // 多查询一些用于去重和排序
    
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
    
    // 去重处理（基于code）并计算相关性排�?
    const seenCodes = new Map()
    const lowerQuery = q.toLowerCase()
    
    for (const record of result.records) {
      const code = record.get('code')
      const name = record.get('name')
      
      // 如果这个code还没出现过，计算相关性并存储
      if (!seenCodes.has(code)) {
        let relevance = 50 // 默认相关�?
        
        // 计算相关性分�?
        const codeLower = (code || '').toLowerCase()
        const nameLower = (name || '').toLowerCase()
        
        if (codeLower === lowerQuery) {
          relevance = 100 // 代码完全匹配
        } else if (codeLower.startsWith(lowerQuery)) {
          relevance = 80 // 代码前缀匹配
        } else if (nameLower === lowerQuery) {
          relevance = 90 // 名称完全匹配
        } else if (nameLower.includes(lowerQuery)) {
          relevance = 70 // 名称包含匹配
        } else if (codeLower.includes(lowerQuery)) {
          relevance = 60 // 代码包含匹配
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
    
    // 转换为数组并按相关性排�?
    let results = Array.from(seenCodes.values())
    
    // 按相关性降序，然后按代码升序排�?
    results.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance
      }
      // 如果相关性相同，按层级排序（层级越小越靠前）
      if (a.level !== b.level) {
        return a.level - b.level
      }
      // 最后按代码排序
      return a.code.localeCompare(b.code, 'zh-CN')
    })
    
    // 限制结果数量，并移除relevance字段
    results = results.slice(0, parseInt(limit)).map(({ relevance, ...rest }) => rest)

    res.json({
      success: true,
      data: results,
      total: results.length
    })

  } catch (error) {
    console.error('搜索失败:', error)
    res.status(500).json({ error: '搜索失败' })
  } finally {
    await session.close()
  }
})

// 获取节点详情
app.get('/api/nodes/:code', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { code } = req.params

  const session = driver.session()
  try {
    // 获取节点基本信息
    const nodeResult = await session.run(`
      MATCH (n {code: $code})
      RETURN n.code as code,
             COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
             n.category as category,
             n.classificationLevel as level,
             n
    `, { code })
    
    if (nodeResult.records.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '节点未找�? 
      })
    }
    
    const record = nodeResult.records[0]
    const node = record.get('n').properties
    
    // 获取父节�?- 基于代码的层次关�?
    // 例如：A01.01.01 的父节点�?A01.01.
    const codeParts = code.split('.')
    let parentCodes = []
    
    // 构建所有可能的父节点代�?
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
      `, { parentCodes: parentCodes })
    } else {
      parentResult = { records: [] }
    }
    
    // 获取子节�?- 基于代码前缀匹配
    // 例如：A01.01.01 的子节点�?A01.01.01.01, A01.01.01.02 �?
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

    res.json({
      success: true,
      data: {
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
    })

  } catch (error) {
    console.error('获取节点详情失败:', error)
    res.status(500).json({ error: '获取节点详情失败' })
  } finally {
    await session.close()
  }
})

// 获取图谱数据（用于可视化�?
app.get('/api/graph', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { rootCode, depth = 2, limit = 100 } = req.query

  const session = driver.session()
  try {
    let cypher
    const params = { limit: neo4j.int(parseInt(limit)) }

    if (rootCode) {
      // 从指定根节点开始，获取指定深度的子节点
      params.rootCode = rootCode
      params.depth = parseInt(depth)
      
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
      // 获取根节点及其直接子节点
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
    
    // 构建节点和边的数据结�?
    const nodes = new Map()
    const edges = []

    if (rootCode) {
      // 处理指定根节点的查询结果
      result.records.forEach(record => {
        const rootCode = record.get('rootCode')
        const rootName = record.get('rootName')
        const childCode = record.get('childCode')
        const childName = record.get('childName')
        const childCategory = record.get('childCategory')
        const childLevel = record.get('childLevel')?.toNumber() || 0
        const startCode = record.get('startCode')
        const endCode = record.get('endCode')

        // 添加根节�?
        if (rootCode && !nodes.has(rootCode)) {
          nodes.set(rootCode, {
            id: rootCode,
            label: rootName || rootCode,
            code: rootCode,
            name: rootName || rootCode,
            category: '疾病�?,
            level: 1
          })
        }

        // 添加子节�?
        if (childCode && !nodes.has(childCode)) {
          nodes.set(childCode, {
            id: childCode,
            label: childName || childCode,
            code: childCode,
            name: childName || childCode,
            category: childCategory || '疾病�?,
            level: childLevel
          })
        }

        // 添加�?
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
      // 处理根节点查询结�?
      result.records.forEach(record => {
        const rootCode = record.get('rootCode')
        const rootName = record.get('rootName')
        const rootCategory = record.get('rootCategory')
        const rootLevel = record.get('rootLevel')?.toNumber() || 1
        const children = record.get('children') || []

        // 添加根节�?
        if (rootCode && !nodes.has(rootCode)) {
          nodes.set(rootCode, {
            id: rootCode,
            label: rootName || rootCode,
            code: rootCode,
            name: rootName || rootCode,
            category: rootCategory || '疾病�?,
            level: rootLevel
          })
        }

        // 添加子节�?
        children.forEach((child) => {
          if (child.code && !nodes.has(child.code)) {
            nodes.set(child.code, {
              id: child.code,
              label: child.name || child.code,
              code: child.code,
              name: child.name || child.code,
              category: child.category || '疾病�?,
              level: child.level || 0
            })

            // 添加�?
            const edgeId = `${rootCode}-${child.code}`
            if (!edges.find((e) => e.id === edgeId)) {
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

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodes.values()),
        edges: edges,
        nodeCount: nodes.size,
        edgeCount: edges.length
      }
    })

  } catch (error) {
    console.error('获取图谱数据失败:', error)
    res.status(500).json({ error: '获取图谱数据失败' })
  } finally {
    await session.close()
  }
})

// 根据节点代码获取子图
app.get('/api/graph/expand/:code', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { code } = req.params
  const { depth = 1, limit = 50 } = req.query

  const session = driver.session()
  try {
    // 获取节点及其子节�?
    const result = await session.run(`
      MATCH (n {code: $code})
      OPTIONAL MATCH path = (n)-[*1..${depth}]->(child)
      WHERE child.code STARTS WITH $code + '.'
      WITH n, child, relationships(path) as rels
      UNWIND rels as r
      WITH DISTINCT n, child, startNode(r) as start, endNode(r) as end
      RETURN 
        n.code as nodeCode,
        COALESCE(n.mainTerm, n.节点名称, n.显示名称) as nodeName,
        n.category as nodeCategory,
        n.classificationLevel as nodeLevel,
        collect(DISTINCT {
          code: child.code,
          name: COALESCE(child.mainTerm, child.节点名称, child.显示名称),
          category: child.category,
          level: child.classificationLevel
        }) as children,
        collect(DISTINCT {
          start: start.code,
          end: end.code
        }) as edges
      LIMIT $limit
    `, { code, limit: neo4j.int(parseInt(limit)) })

    if (result.records.length === 0) {
      return res.status(404).json({ error: '节点未找�? })
    }

    const record = result.records[0]
    const nodes = new Map()
    const edges = []

    // 添加中心节点
    const nodeCode = record.get('nodeCode')
    const nodeName = record.get('nodeName')
    const nodeCategory = record.get('nodeCategory')
    const nodeLevel = record.get('nodeLevel')?.toNumber() || 0

    nodes.set(nodeCode, {
      id: nodeCode,
      label: nodeName || nodeCode,
      code: nodeCode,
      name: nodeName || nodeCode,
      category: nodeCategory || '疾病�?,
      level: nodeLevel
    })

    // 添加子节点和�?
    const children = record.get('children') || []
    children.forEach((child) => {
      if (child.code && !nodes.has(child.code)) {
        nodes.set(child.code, {
          id: child.code,
          label: child.name || child.code,
          code: child.code,
          name: child.name || child.code,
          category: child.category || '疾病�?,
          level: child.level || 0
        })

        edges.push({
          id: `${nodeCode}-${child.code}`,
          source: nodeCode,
          target: child.code,
          type: 'contains'
        })
      }
    })

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodes.values()),
        edges: edges,
        nodeCount: nodes.size,
        edgeCount: edges.length
      }
    })

  } catch (error) {
    console.error('展开节点失败:', error)
    res.status(500).json({ error: '展开节点失败' })
  } finally {
    await session.close()
  }
})

// 获取详细分析数据
app.get('/api/analytics/overview', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const session = driver.session()
  try {
    // 按分类统�?
    const categoryResult = await session.run(`
      MATCH (n)
      WHERE n.category IS NOT NULL
      RETURN n.category as category, count(n) as count
      ORDER BY count DESC
    `)
    
    const categoryStats = categoryResult.records.map(record => ({
      category: record.get('category'),
      count: record.get('count').toNumber()
    }))

    // 按层级统�?
    const levelResult = await session.run(`
      MATCH (n)
      WHERE n.classificationLevel IS NOT NULL
      RETURN n.classificationLevel as level, count(n) as count
      ORDER BY level ASC
    `)
    
    const levelStats = levelResult.records.map(record => ({
      level: record.get('level').toNumber(),
      count: record.get('count').toNumber()
    }))

    // 每个层级的分类分�?
    const levelCategoryResult = await session.run(`
      MATCH (n)
      WHERE n.classificationLevel IS NOT NULL AND n.category IS NOT NULL
      RETURN n.classificationLevel as level, n.category as category, count(n) as count
      ORDER BY level ASC, count DESC
    `)
    
    const levelCategoryStats = {}
    levelCategoryResult.records.forEach(record => {
      const level = record.get('level').toNumber()
      const category = record.get('category')
      const count = record.get('count').toNumber()
      
      if (!levelCategoryStats[level]) {
        levelCategoryStats[level] = {}
      }
      levelCategoryStats[level][category] = count
    })

    // 根节点统�?
    const rootResult = await session.run(`
      MATCH (n)
      WHERE COUNT { (n)<-[:包含]-() } = 0
      RETURN count(n) as count
    `)
    const rootCount = rootResult.records[0]?.get('count')?.toNumber() || 0

    // 叶子节点统计
    const leafResult = await session.run(`
      MATCH (n)
      WHERE COUNT { (n)-[:包含]->() } = 0
      RETURN count(n) as count
    `)
    const leafCount = leafResult.records[0]?.get('count')?.toNumber() || 0

    // 平均子节点数
    let avgChildren = 0
    try {
      const avgChildrenResult = await session.run(`
        MATCH (n)-[:包含]->(child)
        WITH n, count(child) as children
        RETURN avg(children) as avgChildren
      `)
      const avgValue = avgChildrenResult.records[0]?.get('avgChildren')
      avgChildren = avgValue ? (typeof avgValue.toNumber === 'function' ? avgValue.toNumber() : parseFloat(avgValue)) : 0
    } catch (err) {
      console.warn('计算平均子节点数失败:', err.message)
      avgChildren = 0
    }

    res.json({
      success: true,
      data: {
        categoryStats,
        levelStats,
        levelCategoryStats,
        rootCount,
        leafCount,
        avgChildren: Math.round(avgChildren * 100) / 100
      }
    })

  } catch (error) {
    console.error('获取分析数据失败:', error.message)
    console.error('错误堆栈:', error.stack)
    res.status(500).json({ 
      error: '获取分析数据失败',
      details: error.message 
    })
  } finally {
    await session.close()
  }
})

// 获取顶层分类统计
app.get('/api/analytics/top-level', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const session = driver.session()
  try {
    // 获取一级节点（代码只有2位）
    const topLevelResult = await session.run(`
      MATCH (n)
      WHERE n.code =~ '^[A-Z]\\d{2}$'
      RETURN n.code as code, 
             n.mainTerm as name, 
             n.category as category,
             COUNT { (n)-[:包含]->() } as childrenCount
      ORDER BY childrenCount DESC
      LIMIT 20
    `)
    
    const topLevelNodes = topLevelResult.records.map(record => ({
      code: record.get('code'),
      name: record.get('name') || record.get('code'),
      category: record.get('category'),
      childrenCount: record.get('childrenCount').toNumber()
    }))

    res.json({
      success: true,
      data: topLevelNodes
    })

  } catch (error) {
    console.error('获取顶层分类统计失败:', error)
    res.status(500).json({ error: '获取顶层分类统计失败' })
  } finally {
    await session.close()
  }
})

// 根路�?
// 路径分析 - 查找两个节点之间的最短路�?
app.get('/api/analysis/path', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { from, to, maxDepth = 5 } = req.query

  if (!from || !to) {
    return res.status(400).json({ error: '请提供起始节点和结束节点代码' })
  }

  const session = driver.session()
  try {
    // 查找最短路�?- 使用标准shortestPath
    const maxDepthNum = parseInt(maxDepth) || 5
    const result = await session.run(`
      MATCH (start {code: $from}), (end {code: $to})
      WHERE start <> end
      MATCH path = shortestPath((start)-[*1..${maxDepthNum}]-(end))
      RETURN path,
             length(path) as pathLength,
             [node in nodes(path) | {
               code: node.code,
               name: COALESCE(node.mainTerm, node.节点名称, node.显示名称),
               category: node.category,
               level: node.classificationLevel
             }] as nodes,
             [rel in relationships(path) | {
               type: type(rel),
               source: startNode(rel).code,
               target: endNode(rel).code
             }] as edges
      LIMIT 10
    `, { from, to })

    const paths = result.records.map(record => ({
      pathLength: record.get('pathLength').toNumber(),
      nodes: record.get('nodes'),
      edges: record.get('edges')
    }))

    res.json({
      success: true,
      data: paths,
      total: paths.length
    })
  } catch (error) {
    console.error('路径分析失败:', error)
    res.status(500).json({ error: '路径分析失败: ' + error.message })
  } finally {
    await session.close()
  }
})

// 中心度分�?- 计算节点的度中心度、接近中心度、介数中心度
app.get('/api/analysis/centrality', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { code, type = 'degree' } = req.query

  const session = driver.session()
  try {
    if (code) {
      // 单个节点的中心度
      let query = ''
      if (type === 'degree') {
        // 度中心度：节点的连接�?- 简化查�?
        query = `
          MATCH (n {code: $code})
          OPTIONAL MATCH (n)-[r]-()
          RETURN n.code as code,
                 COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
                 n.category as category,
                 COUNT(DISTINCT r) as degree
        `
      } else if (type === 'betweenness') {
        // 介数中心度：节点在最短路径中出现的频�?
        query = `
          MATCH (n {code: $code})
          OPTIONAL MATCH path = shortestPath((start)-[*..5]-(end))
          WHERE n IN nodes(path) AND start <> end AND start <> n AND end <> n
          RETURN n.code as code,
                 COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
                 n.category as category,
                 COUNT(DISTINCT path) as betweenness
        `
      } else {
        // 接近中心度：节点到所有其他节点的平均距离
        query = `
          MATCH (n {code: $code})
          OPTIONAL MATCH path = shortestPath((n)-[*..5]-(other))
          WHERE other <> n
          WITH n, 
               COUNT(DISTINCT other) as reachable,
               AVG(length(path)) as avgDistance
          RETURN n.code as code,
                 COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
                 n.category as category,
                 reachable,
                 avgDistance,
                 CASE WHEN reachable > 0 THEN 1.0 / avgDistance ELSE 0 END as closeness
        `
      }

      const result = await session.run(query, { code })
      
      if (result.records.length === 0) {
        return res.status(404).json({ error: '节点未找�? })
      }

      res.json({
        success: true,
        data: result.records[0].toObject()
      })
    } else {
      // Top N 中心度节�?
      let query = ''
      if (type === 'degree') {
        query = `
          MATCH (n)
          OPTIONAL MATCH (n)-[r]-()
          WITH n, COUNT(DISTINCT r) as degree
          WHERE degree > 0
          RETURN n.code as code,
                 COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
                 n.category as category,
                 degree
          ORDER BY degree DESC
          LIMIT 50
        `
      } else {
        // 简化版本：只返回度中心�?
        query = `
          MATCH (n)
          OPTIONAL MATCH (n)-[r]-()
          WITH n, COUNT(DISTINCT r) as degree
          WHERE degree > 0
          RETURN n.code as code,
                 COALESCE(n.mainTerm, n.节点名称, n.显示名称) as name,
                 n.category as category,
                 degree
          ORDER BY degree DESC
          LIMIT 50
        `
      }

      const result = await session.run(query)
      const nodes = result.records.map(record => record.toObject())

      res.json({
        success: true,
        data: nodes,
        total: nodes.length
      })
    }
  } catch (error) {
    console.error('中心度分析失�?', error)
    res.status(500).json({ error: '中心度分析失�? ' + error.message })
  } finally {
    await session.close()
  }
})

// 节点关系分析 - 分析节点的邻居节点统�?
app.get('/api/analysis/neighbors', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const { code, depth = 1 } = req.query

  if (!code) {
    return res.status(400).json({ error: '请提供节点代�? })
  }

  const session = driver.session()
  try {
    // 使用参数化查询，修复字符串插值问�?
    const depthNum = parseInt(depth) || 1
    const result = await session.run(`
      MATCH (start {code: $code})-[*1..${depthNum}]-(neighbor)
      WHERE neighbor <> start
      WITH DISTINCT neighbor,
           COUNT(*) as connectionCount
      RETURN neighbor.code as code,
             COALESCE(neighbor.mainTerm, neighbor.节点名称, neighbor.显示名称) as name,
             neighbor.category as category,
             neighbor.classificationLevel as level,
             connectionCount
      ORDER BY connectionCount DESC
      LIMIT 100
    `, { code })

    const neighbors = result.records.map(record => ({
      code: record.get('code'),
      name: record.get('name'),
      category: record.get('category'),
      level: record.get('level')?.toNumber() || 0,
      connectionCount: record.get('connectionCount').toNumber()
    }))

    res.json({
      success: true,
      data: neighbors,
      total: neighbors.length
    })
  } catch (error) {
    console.error('邻居分析失败:', error)
    res.status(500).json({ error: '邻居分析失败: ' + error.message })
  } finally {
    await session.close()
  }
})

// API信息端点
app.get('/api/info', (req, res) => {
  res.json({
    name: '少纳言中医知识图谱API',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      stats: '/api/stats',
      roots: '/api/nodes/roots',
      search: '/api/search?q=关键�?
    }
  })
})

// 根路�?- 生产环境返回前端页面，开发环境返回API信息
app.get('/', (req, res) => {
  if (NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '../frontend/dist')
    res.sendFile(path.join(frontendDistPath, 'index.html'))
  } else {
    res.json({
      name: '少纳言中医知识图谱API',
      version: '1.0.0',
      status: 'running',
      environment: NODE_ENV,
      database: dbConnected ? 'connected' : 'disconnected',
      message: '开发环境：前端运行�?http://localhost:3000',
      endpoints: {
        health: '/health',
        stats: '/api/stats',
        roots: '/api/nodes/roots',
        search: '/api/search?q=关键�?
      }
    })
  }
})

// 生产环境：所有非API路由返回前端页面（必须在最后）
if (NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      const frontendDistPath = path.join(__dirname, '../frontend/dist')
      res.sendFile(path.join(frontendDistPath, 'index.html'))
    } else {
      next()
    }
  })
}

// 启动服务�?
app.listen(PORT, () => {
  console.log(`🚀 少纳言中医知识图谱服务启动成功！`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`🌐 环境: ${NODE_ENV}`)
  console.log(`💚 健康检�? http://localhost:${PORT}/health`)
  console.log(`📊 统计数据: http://localhost:${PORT}/api/stats`)
  if (NODE_ENV === 'production') {
    console.log(`📱 前端应用: http://localhost:${PORT}`)
  } else {
    console.log(`📱 前端开发服务器: http://localhost:3000`)
  }
})

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务�?..')
  await driver.close()
  process.exit(0)
})


