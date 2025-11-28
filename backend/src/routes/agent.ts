import { Router, Request, Response } from 'express'
import { neo4jService } from '@services/neo4j.js'
import { logger } from '@utils/logger.js'

const router = Router()

// 对话上下文存储（生产环境应使用Redis等）
const conversationContexts = new Map<string, {
  history: Array<{ role: string; content: string }>
  entities: Set<string>
  intent: string | null
  lastNodes: string[]
}>()

/**
 * 智能对话接口
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { query, history = [], sessionId = 'default' } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameter'
      })
    }

    // 获取或创建对话上下文
    let context = conversationContexts.get(sessionId)
    if (!context) {
      context = {
        history: [],
        entities: new Set(),
        intent: null,
        lastNodes: []
      }
      conversationContexts.set(sessionId, context)
    }

    // 更新历史记录
    context.history.push(...history)
    if (context.history.length > 10) {
      context.history = context.history.slice(-10) // 只保留最近10轮对话
    }

    // 1. 从查询中提取关键词和实体
    const keywords = extractKeywords(query)
    const entities = extractEntities(query, context)
    
    // 2. 在知识图谱中搜索相关节点（增强版）
    const relatedNodes = await searchRelatedNodes(keywords, entities)
    
    // 3. 分析查询意图（增强版，考虑上下文）
    const intent = analyzeIntent(query, context)
    context.intent = intent.type
    
    // 4. 分析关系（如果涉及多个节点）
    const relationships = await analyzeRelationships(relatedNodes)
    
    // 5. 分析数据维度
    const dimensions = await analyzeDimensions(relatedNodes)
    
    // 6. 生成响应（使用上下文）
    const response = await generateResponse(
      query,
      intent,
      relatedNodes,
      relationships,
      dimensions,
      context
    )
    
    // 更新上下文
    relatedNodes.forEach(node => {
      context.entities.add(node.code)
      context.lastNodes.push(node.id)
    })
    if (context.lastNodes.length > 20) {
      context.lastNodes = context.lastNodes.slice(-20)
    }

    return res.json({
      success: true,
      ...response
    })
  } catch (error) {
    logger.error('Agent chat error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * 智能推荐节点（增强版）
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { context, limit = 10, nodeId, dimension } = req.body

    // 基于多维度推荐
    const nodes = await recommendNodesByContext(context, limit, nodeId, dimension)

    return res.json({
      success: true,
      nodes
    })
  } catch (error) {
    logger.error('Recommend nodes error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * 智能分析图谱（增强版）
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { type, nodeId, depth } = req.body

    let result: any = {}

    switch (type) {
      case 'structure':
        result = await analyzeStructure()
        break
      case 'clusters':
        result = await analyzeClusters()
        break
      case 'centrality':
        result = await analyzeCentrality(nodeId)
        break
      case 'paths':
        result = await analyzePaths(nodeId, depth)
        break
      case 'relationships':
        result = await analyzeAllRelationships()
        break
      case 'dimensions':
        result = await analyzeAllDimensions()
        break
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid analysis type'
        })
    }

    return res.json({
      success: true,
      ...result
    })
  } catch (error) {
    logger.error('Analyze graph error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// ========== 辅助函数 ==========

/**
 * 提取关键词（增强版）
 */
function extractKeywords(query: string): string[] {
  const keywords: string[] = []
  
  // 常见中医术语（扩展）
  const tcmTerms = [
    '脾虚', '肾虚', '肝郁', '气滞', '血瘀', '痰湿', '湿热', '阴虚', '阳虚',
    '感冒', '咳嗽', '头痛', '失眠', '便秘', '腹泻', '胃痛', '腰痛',
    '气血', '经络', '脏腑', '方剂', '中药', '穴位', '脉象', '舌象'
  ]
  
  for (const term of tcmTerms) {
    if (query.includes(term)) {
      keywords.push(term)
    }
  }
  
  // 提取可能的代码（如：A01.001）
  const codePattern = /[A-Z]\d{2}\.\d{3}/g
  const codes = query.match(codePattern)
  if (codes) {
    keywords.push(...codes)
  }
  
  return keywords.length > 0 ? keywords : [query]
}

/**
 * 提取实体（增强版，考虑上下文）
 */
function extractEntities(query: string, context: any): string[] {
  const entities: string[] = []
  
  // 从当前查询提取
  const codePattern = /[A-Z]\d{2}\.\d{3}/g
  const codes = query.match(codePattern)
  if (codes) {
    entities.push(...codes)
  }
  
  // 从上下文提取
  if (context.entities.size > 0) {
    entities.push(...Array.from(context.entities).filter((e): e is string => typeof e === 'string'))
  }
  
  return entities
}

/**
 * 搜索相关节点（增强版）
 */
async function searchRelatedNodes(keywords: string[], entities: string[]): Promise<any[]> {
  try {
    const session = neo4jService.getSession()
    const nodeMap = new Map<string, any>()

    // 按关键词搜索
    for (const keyword of keywords) {
      const result = await session.run(
        `
        MATCH (n)
        WHERE n.name CONTAINS $keyword 
           OR n.code CONTAINS $keyword
        RETURN n, 
               CASE 
                 WHEN n.name CONTAINS $keyword THEN 2
                 ELSE 1
               END as relevance
        ORDER BY relevance DESC, n.level ASC
        LIMIT 10
        `,
        { keyword }
      )

      result.records.forEach(record => {
        const node = record.get('n')
        const nodeId = node.identity.toString()
        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            id: nodeId,
            code: node.properties.code,
            name: node.properties.name,
            category: node.properties.category,
            level: node.properties.level,
            relevance: record.get('relevance').toNumber()
          })
        }
      })
    }

    // 按实体代码精确搜索
    for (const entity of entities) {
      if (typeof entity !== 'string') continue
      const result = await session.run(
        `
        MATCH (n {code: $code})
        RETURN n
        LIMIT 1
        `,
        { code: entity }
      )

      result.records.forEach(record => {
        const node = record.get('n')
        const nodeId = node.identity.toString()
        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            id: nodeId,
            code: node.properties.code,
            name: node.properties.name,
            category: node.properties.category,
            level: node.properties.level,
            relevance: 3 // 精确匹配优先级最高
          })
        }
      })
    }

    // 按相关性排序
    return Array.from(nodeMap.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20)
  } catch (error) {
    logger.error('Search related nodes error:', error)
    return []
  }
}

/**
 * 分析关系（新增）
 */
async function analyzeRelationships(_nodes: any[]): Promise<any[]> {
  if (_nodes.length < 2) return []

  try {
    const session = neo4jService.getSession()
    const relationships: any[] = []
    const nodeIds = _nodes.map(n => n.id)

    // 查找节点之间的关系
    const result = await session.run(
      `
      MATCH (a)-[r]-(b)
      WHERE id(a) IN $nodeIds AND id(b) IN $nodeIds
      RETURN a, r, b, type(r) as relType
      LIMIT 50
      `,
      { nodeIds: nodeIds.map(id => parseInt(id)) }
    )

    result.records.forEach(record => {
      const source = record.get('a')
      const target = record.get('b')
      const relType = record.get('relType')
      
      relationships.push({
        source: source.identity.toString(),
        target: target.identity.toString(),
        type: relType,
        sourceName: source.properties.name || source.properties.code,
        targetName: target.properties.name || target.properties.code
      })
    })

    return relationships
  } catch (error) {
    logger.error('Analyze relationships error:', error)
    return []
  }
}

/**
 * 分析数据维度（新增）
 */
async function analyzeDimensions(nodes: any[]): Promise<any> {
  if (nodes.length === 0) {
    return {
      byCategory: {},
      byLevel: {},
      total: 0
    }
  }

  const dimensions = {
    byCategory: {} as Record<string, number>,
    byLevel: {} as Record<number, number>,
    total: nodes.length
  }

  nodes.forEach(node => {
    // 按类别统计
    const category = node.category || '未知'
    dimensions.byCategory[category] = (dimensions.byCategory[category] || 0) + 1
    
    // 按层级统计
    const level = node.level || 1
    dimensions.byLevel[level] = (dimensions.byLevel[level] || 0) + 1
  })

  return dimensions
}

/**
 * 分析查询意图（增强版，考虑上下文）
 */
function analyzeIntent(query: string, context: any): {
  type: 'query' | 'relation' | 'recommend' | 'analyze' | 'compare' | 'explain'
  entities: string[]
  confidence: number
} {
  const lowerQuery = query.toLowerCase()
  
  let type: 'query' | 'relation' | 'recommend' | 'analyze' | 'compare' | 'explain' = 'query'
  let confidence = 0.5

  // 关系查询
  if (lowerQuery.includes('关系') || lowerQuery.includes('相关') || lowerQuery.includes('连接') || 
      lowerQuery.includes('关联') || lowerQuery.includes('联系')) {
    type = 'relation'
    confidence = 0.9
  }
  // 推荐查询
  else if (lowerQuery.includes('推荐') || lowerQuery.includes('建议') || lowerQuery.includes('类似') ||
           lowerQuery.includes('相似') || lowerQuery.includes('相关')) {
    type = 'recommend'
    confidence = 0.8
  }
  // 分析查询
  else if (lowerQuery.includes('分析') || lowerQuery.includes('统计') || lowerQuery.includes('结构') ||
           lowerQuery.includes('分布') || lowerQuery.includes('数量')) {
    type = 'analyze'
    confidence = 0.85
  }
  // 比较查询
  else if (lowerQuery.includes('比较') || lowerQuery.includes('对比') || lowerQuery.includes('区别') ||
           lowerQuery.includes('差异')) {
    type = 'compare'
    confidence = 0.8
  }
  // 解释查询
  else if (lowerQuery.includes('什么是') || lowerQuery.includes('解释') || lowerQuery.includes('说明') ||
           lowerQuery.includes('含义') || lowerQuery.includes('意思')) {
    type = 'explain'
    confidence = 0.9
  }

  // 如果上下文中有之前的意图，可以调整
  if (context.intent && context.intent === type) {
    confidence = Math.min(confidence + 0.1, 1.0)
  }

  // 提取实体
  const entities: string[] = []
  const entityPatterns = [
    /[A-Z]\d{2}\.\d{3}/g, // 代码
    /[\u4e00-\u9fa5]{2,6}/g // 中文术语
  ]

  entityPatterns.forEach(pattern => {
    const matches = query.match(pattern)
    if (matches) {
      entities.push(...matches)
    }
  })

  return { type, entities, confidence }
}

/**
 * 生成响应（增强版）
 */
async function generateResponse(
  query: string,
  intent: { type: string; entities: string[]; confidence: number },
  relatedNodes: any[],
  relationships: any[],
  dimensions: any,
  _context: any
): Promise<any> {
  let content = ''
  const metadata: any = {
    nodes: relatedNodes.slice(0, 5),
    highlightNodes: relatedNodes.slice(0, 10).map(n => n.id),
    relationships: relationships.slice(0, 5),
    dimensions,
    suggestions: []
  }

  switch (intent.type) {
    case 'query':
      if (relatedNodes.length > 0) {
        content = `我找到了 ${relatedNodes.length} 个相关节点：\n\n`
        relatedNodes.slice(0, 5).forEach(node => {
          content += `• ${node.name || node.code} (${node.category}, L${node.level})\n`
        })
        
        // 添加维度信息
        if (dimensions.total > 0) {
          content += `\n📊 数据维度：\n`
          content += `• 类别分布：${Object.entries(dimensions.byCategory).map(([k, v]) => `${k}(${v})`).join(', ')}\n`
          content += `• 层级分布：${Object.entries(dimensions.byLevel).map(([k, v]) => `L${k}(${v})`).join(', ')}\n`
        }
        
        content += '\n你想了解哪个节点的详细信息？'
        metadata.suggestions = relatedNodes.slice(0, 3).map(n => `查看${n.name || n.code}的详情`)
      } else {
        content = `我没有找到与"${query}"直接相关的节点。\n\n你可以尝试：\n• 使用更具体的中医术语\n• 输入节点代码（如：A01.001）\n• 询问节点之间的关系`
        metadata.suggestions = ['搜索热门节点', '浏览根节点', '查看统计信息']
      }
      break

    case 'relation':
      if (relationships.length > 0) {
        content = `我发现了 ${relationships.length} 条关系：\n\n`
        relationships.slice(0, 5).forEach((rel, i) => {
          content += `${i + 1}. ${rel.sourceName} → ${rel.targetName} (${rel.type})\n`
        })
        metadata.suggestions = [
          '显示所有关系',
          '分析关系强度',
          '查找关系路径'
        ]
      } else if (relatedNodes.length >= 2) {
        content = `我找到了 ${relatedNodes.length} 个相关节点，但未发现直接关系。\n\n`
        content += `主要节点：\n`
        relatedNodes.slice(0, 3).forEach(node => {
          content += `• ${node.name || node.code}\n`
        })
        metadata.suggestions = [
          `查找${relatedNodes[0]?.name}和${relatedNodes[1]?.name}之间的路径`,
          `显示${relatedNodes[0]?.name}的所有关系`,
          '分析节点关联度'
        ]
      } else {
        content = '要分析关系，请提供至少两个节点。你可以：\n• 告诉我两个节点的名称或代码\n• 让我推荐相关节点'
        metadata.suggestions = ['推荐相关节点', '查看热门节点', '浏览图谱']
      }
      break

    case 'recommend':
      if (relatedNodes.length > 0) {
        content = `基于你的查询，我推荐以下节点：\n\n`
        relatedNodes.slice(0, 5).forEach((node, i) => {
          content += `${i + 1}. ${node.name || node.code} (${node.category}, L${node.level})\n`
        })
        metadata.suggestions = relatedNodes.slice(0, 3).map(n => `查看${n.name || n.code}`)
      } else {
        content = '让我为你推荐一些热门节点...'
        metadata.suggestions = ['推荐热门节点', '推荐相关证候', '推荐治疗方法']
      }
      break

    case 'analyze':
      content = '我可以帮你分析知识图谱的：\n\n'
      content += '• 结构特征（节点分布、层级关系）\n'
      content += '• 聚类分析（发现节点群组）\n'
      content += '• 中心性分析（找出重要节点）\n'
      content += '• 路径分析（节点间最短路径）\n'
      content += '• 关系分析（关系类型和强度）\n'
      content += '• 维度分析（多维度数据分布）\n\n'
      content += '你想进行哪种分析？'
      metadata.suggestions = ['结构分析', '聚类分析', '中心性分析', '路径分析', '关系分析', '维度分析']
      break

    case 'compare':
      if (relatedNodes.length >= 2) {
        content = `我来比较 ${relatedNodes[0]?.name} 和 ${relatedNodes[1]?.name}：\n\n`
        content += `相似点：\n`
        if (relatedNodes[0].category === relatedNodes[1].category) {
          content += `• 同属于${relatedNodes[0].category}类别\n`
        }
        if (relatedNodes[0].level === relatedNodes[1].level) {
          content += `• 同属于L${relatedNodes[0].level}层级\n`
        }
        content += `\n差异点：\n`
        if (relatedNodes[0].category !== relatedNodes[1].category) {
          content += `• 类别不同：${relatedNodes[0].category} vs ${relatedNodes[1].category}\n`
        }
        if (relatedNodes[0].level !== relatedNodes[1].level) {
          content += `• 层级不同：L${relatedNodes[0].level} vs L${relatedNodes[1].level}\n`
        }
        metadata.suggestions = [
          `查找${relatedNodes[0]?.name}和${relatedNodes[1]?.name}的关系`,
          `分析${relatedNodes[0]?.name}的详细信息`,
          `分析${relatedNodes[1]?.name}的详细信息`
        ]
      } else {
        content = '要进行比较，请提供至少两个节点。'
        metadata.suggestions = ['推荐相关节点', '搜索节点']
      }
      break

    case 'explain':
      if (relatedNodes.length > 0) {
        const node = relatedNodes[0]
        content = `关于"${node.name || node.code}"：\n\n`
        content += `• 代码：${node.code}\n`
        content += `• 类别：${node.category}\n`
        content += `• 层级：L${node.level}\n`
        if (relationships.length > 0) {
          content += `\n相关关系：\n`
          relationships.slice(0, 3).forEach(rel => {
            content += `• ${rel.type} → ${rel.targetName}\n`
          })
        }
        metadata.suggestions = [
          `查看${node.name || node.code}的完整详情`,
          `显示${node.name || node.code}的所有关系`,
          `查找与${node.name || node.code}相关的节点`
        ]
      } else {
        content = `我没有找到"${query}"的相关信息。请尝试使用更具体的中医术语或节点代码。`
        metadata.suggestions = ['搜索热门节点', '浏览根节点']
      }
      break

    default:
      content = `我理解你想了解"${query}"。让我在知识图谱中搜索相关信息...`
  }

  return {
    content,
    metadata
  }
}

/**
 * 基于上下文推荐节点（增强版）
 */
async function recommendNodesByContext(
  contextStr: string | undefined,
  limit: number,
  nodeId?: string,
  dimension?: string
): Promise<any[]> {
  try {
    const session = neo4jService.getSession()
    
    if (nodeId) {
      // 基于特定节点推荐（查找邻居节点）
      const result = await session.run(
        `
        MATCH (n)-[r]-(m)
        WHERE id(n) = $nodeId
        WITH m, count(r) as relCount
        RETURN m, relCount
        ORDER BY relCount DESC, m.level ASC
        LIMIT $limit
        `,
        { nodeId: parseInt(nodeId), limit }
      )

      return result.records.map(record => {
        const node = record.get('m')
        return {
          id: node.identity.toString(),
          code: node.properties.code,
          name: node.properties.name,
          category: node.properties.category,
          level: node.properties.level,
          relCount: record.get('relCount').toNumber()
        }
      })
    } else if (dimension) {
      // 基于维度推荐
      const result = await session.run(
        `
        MATCH (n)
        WHERE n.category = $dimension OR toString(n.level) = $dimension
        RETURN n
        ORDER BY n.level ASC
        LIMIT $limit
        `,
        { dimension, limit }
      )

      return result.records.map(record => {
        const node = record.get('n')
        return {
          id: node.identity.toString(),
          code: node.properties.code,
          name: node.properties.name,
          category: node.properties.category,
          level: node.properties.level
        }
      })
    } else if (contextStr) {
      // 基于上下文推荐
      const result = await session.run(
        `
        MATCH (n)
        WHERE n.name CONTAINS $context OR n.code CONTAINS $context
        RETURN n
        ORDER BY n.level ASC
        LIMIT $limit
        `,
        { context: contextStr, limit }
      )

      return result.records.map(record => {
        const node = record.get('n')
        return {
          id: node.identity.toString(),
          code: node.properties.code,
          name: node.properties.name,
          category: node.properties.category,
          level: node.properties.level
        }
      })
    } else {
      // 推荐热门节点（按连接数）
      const result = await session.run(
        `
        MATCH (n)-[r]-()
        WITH n, count(r) as degree
        RETURN n, degree
        ORDER BY degree DESC
        LIMIT $limit
        `,
        { limit }
      )

      return result.records.map(record => {
        const node = record.get('n')
        return {
          id: node.identity.toString(),
          code: node.properties.code,
          name: node.properties.name,
          category: node.properties.category,
          level: node.properties.level,
          degree: record.get('degree').toNumber()
        }
      })
    }
  } catch (error) {
    logger.error('Recommend nodes by context error:', error)
    return []
  }
}

/**
 * 分析图谱结构
 */
async function analyzeStructure(): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
    const result = await session.run(
      `
      MATCH (n)
      WITH n.category as category, count(n) as count
      RETURN category, count
      ORDER BY count DESC
      `
    )

    const structure = {
      categories: result.records.map(record => ({
        category: record.get('category'),
        count: record.get('count').toNumber()
      })),
      totalNodes: result.records.reduce((sum, record) => sum + record.get('count').toNumber(), 0)
    }

    return structure
  } catch (error) {
    logger.error('Analyze structure error:', error)
    throw error
  }
}

/**
 * 分析聚类
 */
async function analyzeClusters(): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
    const result = await session.run(
      `
      MATCH (n)-[r]-(m)
      WHERE n.category = m.category
      WITH n.category as cluster, count(DISTINCT n) as size
      RETURN cluster, size
      ORDER BY size DESC
      `
    )

    return {
      clusters: result.records.map(record => ({
        cluster: record.get('cluster'),
        size: record.get('size').toNumber()
      }))
    }
  } catch (error) {
    logger.error('Analyze clusters error:', error)
    throw error
  }
}

/**
 * 分析中心性（增强版）
 */
async function analyzeCentrality(nodeId?: string): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
    if (nodeId) {
      // 分析特定节点的中心性
      const result = await session.run(
        `
        MATCH (n)-[r]-()
        WHERE id(n) = $nodeId
        WITH n, count(r) as degree
        RETURN n, degree
        `,
        { nodeId: parseInt(nodeId) }
      )

      if (result.records.length > 0) {
        const record = result.records[0]
        const node = record.get('n')
        return {
          node: {
            id: node.identity.toString(),
            code: node.properties.code,
            name: node.properties.name,
            category: node.properties.category,
            level: node.properties.level
          },
          degree: record.get('degree').toNumber()
        }
      }
    } else {
      // 分析所有节点的中心性
      const result = await session.run(
        `
        MATCH (n)-[r]-()
        WITH n, count(r) as degree
        RETURN n, degree
        ORDER BY degree DESC
        LIMIT 20
        `
      )

      return {
        centralNodes: result.records.map(record => {
          const node = record.get('n')
          return {
            id: node.identity.toString(),
            code: node.properties.code,
            name: node.properties.name,
            category: node.properties.category,
            level: node.properties.level,
            degree: record.get('degree').toNumber()
          }
        })
      }
    }

    return {}
  } catch (error) {
    logger.error('Analyze centrality error:', error)
    throw error
  }
}

/**
 * 分析路径（增强版）
 */
async function analyzePaths(nodeId?: string, depth?: number): Promise<any> {
  try {
    const session = neo4jService.getSession()
    const maxDepth = depth || 5

    if (nodeId) {
      // 分析特定节点的路径
      const result = await session.run(
        `
        MATCH path = (n)-[*1..${maxDepth}]-(m)
        WHERE id(n) = $nodeId
        WITH path, length(path) as pathLength
        RETURN path, pathLength
        ORDER BY pathLength ASC
        LIMIT 100
        `
      )

      const paths = result.records.map(record => {
        const path = record.get('path')
        const segments = path.segments
        return {
          length: record.get('pathLength').toNumber(),
          nodes: segments.map((seg: any) => ({
            id: seg.start.identity.toString(),
            name: seg.start.properties.name || seg.start.properties.code
          })).concat([{
            id: segments[segments.length - 1].end.identity.toString(),
            name: segments[segments.length - 1].end.properties.name || segments[segments.length - 1].end.properties.code
          }])
        }
      })

      return { paths }
    } else {
      // 分析平均路径长度
      const result = await session.run(
        `
        MATCH path = shortestPath((a)-[*..${maxDepth}]-(b))
        WHERE id(a) < id(b)
        WITH length(path) as pathLength
        RETURN avg(pathLength) as avgLength, max(pathLength) as maxLength
        LIMIT 1000
        `
      )

      if (result.records.length > 0) {
        const record = result.records[0]
        return {
          avgPathLength: record.get('avgLength')?.toNumber() || 0,
          maxPathLength: record.get('maxLength')?.toNumber() || 0
        }
      }
    }

    return {
      avgPathLength: 0,
      maxPathLength: 0
    }
  } catch (error) {
    logger.error('Analyze paths error:', error)
    throw error
  }
}

/**
 * 分析所有关系（新增）
 */
async function analyzeAllRelationships(): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
    const result = await session.run(
      `
      MATCH ()-[r]->()
      WITH type(r) as relType, count(r) as count
      RETURN relType, count
      ORDER BY count DESC
      `
    )

    return {
      relationships: result.records.map(record => ({
        type: record.get('relType'),
        count: record.get('count').toNumber()
      }))
    }
  } catch (error) {
    logger.error('Analyze all relationships error:', error)
    throw error
  }
}

/**
 * 分析所有维度（新增）
 */
async function analyzeAllDimensions(): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
    // 按类别统计
    const categoryResult = await session.run(
      `
      MATCH (n)
      WITH n.category as category, count(n) as count
      RETURN category, count
      ORDER BY count DESC
      `
    )

    // 按层级统计
    const levelResult = await session.run(
      `
      MATCH (n)
      WITH n.level as level, count(n) as count
      RETURN level, count
      ORDER BY level ASC
      `
    )

    return {
      byCategory: categoryResult.records.map(record => ({
        category: record.get('category'),
        count: record.get('count').toNumber()
      })),
      byLevel: levelResult.records.map(record => ({
        level: record.get('level'),
        count: record.get('count').toNumber()
      }))
    }
  } catch (error) {
    logger.error('Analyze all dimensions error:', error)
    throw error
  }
}

export default router
