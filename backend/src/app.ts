import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'

import { errorHandler } from '@middleware/errorHandler'
import { notFoundHandler } from '@middleware/notFoundHandler'
import { logger } from '@utils/logger'

// 路由导入
import graphRoutes from '@routes/graph'
import searchRoutes from '@routes/search'
import analyticsRoutes from '@routes/analytics'
import userRoutes from '@routes/users'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const API_PREFIX = process.env.API_PREFIX || '/api'

// 基础中间件
app.use(helmet()) // 安全头
app.use(compression()) // 压缩响应
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })) // 日志

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API路由
app.use(`${API_PREFIX}/graph`, graphRoutes)
app.use(`${API_PREFIX}/search`, searchRoutes)
app.use(`${API_PREFIX}/analytics`, analyticsRoutes)
app.use(`${API_PREFIX}/users`, userRoutes)

// 根路径
app.get('/', (req, res) => {
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
  
  server.close(() => {
    logger.info('HTTP服务器已关闭')
    
    // 关闭数据库连接等
    // neo4jDriver.close()
    // redisClient.disconnect()
    
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
