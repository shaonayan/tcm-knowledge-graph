import { Router, Request, Response } from 'express'
import { importTCMDatasets } from '../scripts/importTCMDatasets.js'
import { logger } from '@utils/logger.js'

const router = Router()

/**
 * 导入TCM数据集
 */
router.post('/tcm-datasets', async (_req: Request, res: Response) => {
  try {
    logger.info('开始导入TCM数据集...')
    
    // 异步执行导入，避免阻塞
    importTCMDatasets()
      .then(() => {
        logger.info('TCM数据集导入完成')
      })
      .catch(error => {
        logger.error('TCM数据集导入失败:', error)
      })

    return res.json({
      success: true,
      message: '数据导入任务已启动，正在后台处理...'
    })
  } catch (error) {
    logger.error('启动导入任务失败:', error)
    return res.status(500).json({
      success: false,
      error: '启动导入任务失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * 查询导入进度
 */
router.get('/import-status', async (_req: Request, res: Response) => {
  // TODO: 实现导入进度跟踪
  return res.json({
    success: true,
    status: 'processing',
    message: '导入进行中...'
  })
})

export default router

