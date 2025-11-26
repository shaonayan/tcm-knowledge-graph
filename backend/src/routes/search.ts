import { Router, Request, Response } from 'express'
import { neo4jService } from '@services/neo4j'
import { logger } from '@utils/logger'

const router = Router()

// 搜索节点
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const { q, category, limit = '10' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      })
    }

    const results = await neo4jService.searchNodes(
      q,
      category as string | null,
      parseInt(limit as string)
    )

    return res.json({
      success: true,
      data: results,
      total: results.length
    })
  } catch (error) {
    logger.error('搜索失败:', error)
    return res.status(500).json({
      success: false,
      error: '搜索失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取节点详情
router.get('/nodes/:code', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const { code } = req.params
    const node = await neo4jService.getNodeDetails(code)

    if (!node) {
      return res.status(404).json({
        success: false,
        error: '节点未找到'
      })
    }

    return res.json({
      success: true,
      data: node
    })
  } catch (error) {
    logger.error('获取节点详情失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取节点详情失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取根节点
router.get('/roots', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const { limit = '20' } = req.query
    const roots = await neo4jService.getRootNodes(parseInt(limit as string))

    return res.json({
      success: true,
      data: roots
    })
  } catch (error) {
    logger.error('获取根节点失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取根节点失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router

