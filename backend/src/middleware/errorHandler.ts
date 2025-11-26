import { Request, Response, NextFunction } from 'express'
import { logger } from '@utils/logger'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })

  // 如果是CORS错误，返回特定的错误信息
  if (err.message.includes('CORS')) {
    res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: err.message
    })
    return
  }

  // 默认错误响应
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message
  })
}
