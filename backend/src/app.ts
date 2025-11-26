import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'

import { errorHandler } from '@middleware/errorHandler.js'
import { notFoundHandler } from '@middleware/notFoundHandler.js'
import { logger } from '@utils/logger.js'

// 路由导入
import graphRoutes from '@routes/graph.js'
import searchRoutes from '@routes/search.js'
import analyticsRoutes from '@routes/analytics.js'
import userRoutes from '@routes/users.js'
import { neo4jService } from '@services/neo4j.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const API_PREFIX = process.env.API_PREFIX || '/api'

// 基础中间件
app.use(helmet()) // 安全头
app.use(compression()) // 压缩响应
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })) // 日志

// CORS配置 - 允许所有Vercel域名和本地开发
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']

// 添加所有 vercel.app 子域名支持
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 允许无origin的请求（如移动应用、Postman等）
    if (!origin) {
      return callback(null, true)
    }
    
    // 检查是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // 允许所有 *.vercel.app 域名（包括预览部署）
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    
    // 允许 localhost（开发环境）
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true)
    }
    
    // 其他情况拒绝
    callback(new Error('Not allowed by CORS'))
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

app.use(cors(corsOptions))

// 请求解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 限流配置
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 限制每个IP 100次请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Swagger文档配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '中医知识图谱API',
      version: '1.0.0',
      description: '中医知识图谱后端API文档',
      contact: {
        name: 'TCM Knowledge Graph Team',
        email: 'support@tcm-knowledge-graph.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}${API_PREFIX}`,
        description: '开发环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '中医知识图谱API文档'
}))

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: neo4jService.isConnected() ? 'connected' : 'disconnected'
  })
})

// API路由
// 统计数据（兼容旧API路径）
app.get(`${API_PREFIX}/stats`, async (_req, res) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: '数据库未连接'
      })
    }
    const stats = await neo4jService.getStats()
    return res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('获取统计数据失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    })
  }
})

// 根节点（兼容旧API路径）
app.get(`${API_PREFIX}/nodes/roots`, async (req, res) => {
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
      error: '获取根节点失败'
    })
  }
})

// 节点详情（兼容旧API路径）
app.get(`${API_PREFIX}/nodes/:code`, async (req, res) => {
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

app.use(`${API_PREFIX}/graph`, graphRoutes)
app.use(`${API_PREFIX}/search`, searchRoutes)
app.use(`${API_PREFIX}/analytics`, analyticsRoutes)
app.use(`${API_PREFIX}/users`, userRoutes)

// 根路径
app.get('/', (_req, res) => {
  res.json({
    name: '中医知识图谱API',
    version: '1.0.0',
    description: '中医病证分类知识图谱后端服务',
    documentation: '/api-docs',
    health: '/health'
  })
})

// 错误处理中间件
app.use(notFoundHandler)
app.use(errorHandler)

// 初始化Neo4j连接
neo4jService.connect().catch((error) => {
  logger.error('Neo4j连接初始化失败:', error)
})

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`🚀 服务器启动成功`)
  logger.info(`📍 端口: ${PORT}`)
  logger.info(`🌐 环境: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`📚 API文档: http://localhost:${PORT}/api-docs`)
  logger.info(`💚 健康检查: http://localhost:${PORT}/health`)
})

// 优雅关闭
const gracefulShutdown = (signal: string) => {
  logger.info(`收到 ${signal} 信号，开始优雅关闭...`)
  
  server.close(async () => {
    logger.info('HTTP服务器已关闭')
    
    // 关闭数据库连接
    await neo4jService.close()
    
    logger.info('应用程序已安全退出')
    process.exit(0)
  })
  
  // 如果10秒内没有完成关闭，强制退出
  setTimeout(() => {
    logger.error('强制关闭应用程序')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default app
