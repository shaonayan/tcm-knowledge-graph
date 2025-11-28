import { Router, Request, Response } from 'express'
import { neo4jService } from '@services/neo4j.js'
import { logger } from '@utils/logger.js'

const router = Router()

// 获取图谱数据
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const { rootCode, depth = '2', limit = '100' } = req.query
    
    const graphData = await neo4jService.getGraphData(
      rootCode as string | undefined,
      parseInt(depth as string),
      parseInt(limit as string)
    )

    return res.json({
      success: true,
      data: graphData
    })
  } catch (error) {
    logger.error('获取图谱数据失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取图谱数据失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 展开节点
router.get('/expand/:code', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const { code } = req.params
    const { depth = '1', limit = '50' } = req.query

    const graphData = await neo4jService.getGraphData(
      code,
      parseInt(depth as string),
      parseInt(limit as string)
    )

    return res.json({
      success: true,
      data: graphData
    })
  } catch (error) {
    logger.error('展开节点失败:', error)
    return res.status(500).json({
      success: false,
      error: '展开节点失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * 获取一元知识图谱（仅实体）
 */
router.get('/unary', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 1000
    const nodes = await neo4jService.getUnaryGraph(limit)
    return res.json({
      success: true,
      nodes,
      nodeCount: nodes.length
    })
  } catch (error) {
    logger.error('获取一元图谱失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取一元图谱失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * 获取二元知识图谱（实体+关系）
 */
router.get('/binary', async (req: Request, res: Response) => {
  try {
    const rootCode = req.query.rootCode as string | undefined
    const depth = parseInt(req.query.depth as string) || 2
    const limit = parseInt(req.query.limit as string) || 100
    const data = await neo4jService.getBinaryGraph(rootCode, depth, limit)
    return res.json({
      success: true,
      nodes: data.nodes,
      edges: data.edges,
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length
    })
  } catch (error) {
    logger.error('获取二元图谱失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取二元图谱失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * 获取三元知识图谱（实体+关系+属性）
 */
router.get('/ternary', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 1000
    const data = await neo4jService.getTernaryGraph(limit)
    return res.json({
      success: true,
      nodes: data.nodes,
      triples: data.triples,
      nodeCount: data.nodes.length,
      tripleCount: data.triples.length
    })
  } catch (error) {
    logger.error('获取三元图谱失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取三元图谱失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router

