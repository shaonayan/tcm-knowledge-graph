import { Router, Request, Response } from 'express'
import { neo4jService } from '@services/neo4j'
import { logger } from '@utils/logger'

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

    res.json({
      success: true,
      data: graphData
    })
  } catch (error) {
    logger.error('展开节点失败:', error)
    res.status(500).json({
      success: false,
      error: '展开节点失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router

