import { Router, Request, Response } from 'express'

const router = Router()

// 用户相关路由（暂时为空，后续可以添加用户认证等功能）
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: '用户功能暂未实现'
  })
})

export default router

