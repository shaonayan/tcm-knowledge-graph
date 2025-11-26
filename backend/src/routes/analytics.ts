import { Router, Request, Response } from 'express'
import { neo4jService } from '@services/neo4j'
import { logger } from '@utils/logger'

const router = Router()

// 获取统计数据
router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const stats = await neo4jService.getStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('获取统计数据失败:', error)
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取概览数据
router.get('/overview', async (req: Request, res: Response) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }

    const session = neo4jService.getSession()
    try {
      // 按分类统计
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

      // 按层级统计
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

      res.json({
        success: true,
        data: {
          categoryStats,
          levelStats
        }
      })
    } finally {
      await session.close()
    }
  } catch (error) {
    logger.error('获取分析数据失败:', error)
    res.status(500).json({
      success: false,
      error: '获取分析数据失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router

