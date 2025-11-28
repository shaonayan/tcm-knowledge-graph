import { Router, Request, Response } from 'express'
import { neo4jService } from '@services/neo4j.js'
import { logger } from '@utils/logger.js'

const router = Router()

/**
 * 智能对话接口
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { query, history = [] } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameter'
      })
    }

    // 1. 从查询中提取关键词
    const keywords = extractKeywords(query)
    
    // 2. 在知识图谱中搜索相关节点
    const relatedNodes = await searchRelatedNodes(keywords)
    
    // 3. 分析查询意图
    const intent = analyzeIntent(query)
    
    // 4. 生成响应
    const response = await generateResponse(query, intent, relatedNodes, history)
    
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
 * 智能推荐节点
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { context, limit = 10 } = req.body

    // 基于上下文推荐相关节点
    const nodes = await recommendNodesByContext(context, limit)

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
 * 智能分析图谱
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { type } = req.body

    let result: any = {}

    switch (type) {
      case 'structure':
        result = await analyzeStructure()
        break
      case 'clusters':
        result = await analyzeClusters()
        break
      case 'centrality':
        result = await analyzeCentrality()
        break
      case 'paths':
        result = await analyzePaths()
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
 * 提取关键词
 */
function extractKeywords(query: string): string[] {
  // 简单的中文关键词提取
  const keywords: string[] = []
  
  // 常见中医术语
  const tcmTerms = [
    '脾虚', '肾虚', '肝郁', '气滞', '血瘀', '痰湿', '湿热', '阴虚', '阳虚',
    '感冒', '咳嗽', '头痛', '失眠', '便秘', '腹泻', '胃痛', '腰痛'
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
 * 搜索相关节点
 */
async function searchRelatedNodes(keywords: string[]): Promise<any[]> {
  try {
    const session = neo4jService.getSession()
    const nodes: any[] = []

    for (const keyword of keywords) {
      const result = await session.run(
        `
        MATCH (n)
        WHERE n.name CONTAINS $keyword 
           OR n.code CONTAINS $keyword
        RETURN n
        LIMIT 10
        `,
        { keyword }
      )

      result.records.forEach(record => {
        const node = record.get('n')
        nodes.push({
          id: node.identity.toString(),
          code: node.properties.code,
          name: node.properties.name,
          category: node.properties.category,
          level: node.properties.level
        })
      })
    }

    return nodes
  } catch (error) {
    logger.error('Search related nodes error:', error)
    return []
  }
}

/**
 * 分析查询意图
 */
function analyzeIntent(query: string): {
  type: 'query' | 'relation' | 'recommend' | 'analyze'
  entities: string[]
} {
  const lowerQuery = query.toLowerCase()
  
  let type: 'query' | 'relation' | 'recommend' | 'analyze' = 'query'
  const entities: string[] = []

  if (lowerQuery.includes('关系') || lowerQuery.includes('相关') || lowerQuery.includes('连接')) {
    type = 'relation'
  } else if (lowerQuery.includes('推荐') || lowerQuery.includes('建议') || lowerQuery.includes('类似')) {
    type = 'recommend'
  } else if (lowerQuery.includes('分析') || lowerQuery.includes('统计') || lowerQuery.includes('结构')) {
    type = 'analyze'
  }

  // 提取实体（简化版）
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

  return { type, entities }
}

/**
 * 生成响应
 */
async function generateResponse(
  query: string,
  intent: { type: string; entities: string[] },
  relatedNodes: any[],
  _history: any[]
): Promise<any> {
  let content = ''
  const metadata: any = {
    nodes: relatedNodes.slice(0, 5),
    highlightNodes: relatedNodes.slice(0, 10).map(n => n.id),
    suggestions: []
  }

  switch (intent.type) {
    case 'query':
      if (relatedNodes.length > 0) {
        content = `我找到了 ${relatedNodes.length} 个相关节点：\n\n`
        relatedNodes.slice(0, 5).forEach(node => {
          content += `• ${node.name || node.code} (${node.category}, L${node.level})\n`
        })
        content += '\n你想了解哪个节点的详细信息？'
        metadata.suggestions = relatedNodes.slice(0, 3).map(n => `查看${n.name || n.code}的详情`)
      } else {
        content = `我没有找到与"${query}"直接相关的节点。\n\n你可以尝试：\n• 使用更具体的中医术语\n• 输入节点代码（如：A01.001）\n• 询问节点之间的关系`
        metadata.suggestions = ['搜索热门节点', '浏览根节点', '查看统计信息']
      }
      break

    case 'relation':
      if (relatedNodes.length >= 2) {
        content = `我找到了 ${relatedNodes.length} 个相关节点。我可以帮你分析它们之间的关系。\n\n`
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
      content = `基于你的查询，我推荐以下节点：\n\n`
      relatedNodes.slice(0, 5).forEach((node, i) => {
        content += `${i + 1}. ${node.name || node.code} (${node.category})\n`
      })
      metadata.suggestions = relatedNodes.slice(0, 3).map(n => `查看${n.name || n.code}`)
      break

    case 'analyze':
      content = '我可以帮你分析知识图谱的：\n\n• 结构特征（节点分布、层级关系）\n• 聚类分析（发现节点群组）\n• 中心性分析（找出重要节点）\n• 路径分析（节点间最短路径）\n\n你想进行哪种分析？'
      metadata.suggestions = ['结构分析', '聚类分析', '中心性分析', '路径分析']
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
 * 基于上下文推荐节点
 */
async function recommendNodesByContext(context: string | undefined, limit: number): Promise<any[]> {
  try {
    const session = neo4jService.getSession()
    
    if (context) {
      // 基于上下文推荐
      const result = await session.run(
        `
        MATCH (n)
        WHERE n.name CONTAINS $context OR n.code CONTAINS $context
        RETURN n
        ORDER BY n.level ASC
        LIMIT $limit
        `,
        { context, limit }
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
    
    // 使用标签传播算法（简化版）
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
 * 分析中心性
 */
async function analyzeCentrality(): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
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
          degree: record.get('degree').toNumber()
        }
      })
    }
  } catch (error) {
    logger.error('Analyze centrality error:', error)
    throw error
  }
}

/**
 * 分析路径
 */
async function analyzePaths(): Promise<any> {
  try {
    const session = neo4jService.getSession()
    
    // 分析平均路径长度
    const result = await session.run(
      `
      MATCH path = shortestPath((a)-[*..5]-(b))
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

    return {
      avgPathLength: 0,
      maxPathLength: 0
    }
  } catch (error) {
    logger.error('Analyze paths error:', error)
    throw error
  }
}

export default router

