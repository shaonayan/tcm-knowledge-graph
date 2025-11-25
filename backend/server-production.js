import express from 'express'
import cors from 'cors'
import neo4j from 'neo4j-driver'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'production'

// Neo4j连接配置
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://f36358f7.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U'

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',  // 生产环境应该设置具体的域名
  credentials: true
}))
app.use(express.json())

// Neo4j连接
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
)

let dbConnected = false

// 测试连接
async function testConnection() {
  try {
    await driver.verifyConnectivity()
    dbConnected = true
    console.log('✅ Neo4j连接成功！')
  } catch (error) {
    console.error('❌ Neo4j连接失败:', error.message)
    dbConnected = false
  }
}

// 启动时测试连接
testConnection()

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

// 静态文件服务（生产环境）
if (NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../frontend/dist')
  app.use(express.static(frontendDistPath))
  
  // 所有非API路由返回index.html（用于React Router）
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'))
    } else {
      next()
    }
  })
}

// API路由 - 从server-simple.js复制所有API端点
// 这里需要导入或复制所有API路由
// 为了简化，我们直接引用server-simple.js的逻辑

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  const session = driver.session()
  try {
    const nodeResult = await session.run('MATCH (n) RETURN count(n) as count')
    const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as count')
    
    const totalNodes = nodeResult.records[0].get('count').toNumber()
    const totalRelationships = relResult.records[0].get('count').toNumber()

    res.json({
      success: true,
      data: {
        totalNodes,
        totalRelationships,
        labelStats: [],
        dataCompleteness: 100
      }
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  } finally {
    await session.close()
  }
})

// 其他API端点需要从server-simple.js复制
// 为了快速部署，我们可以直接导入server-simple.js
// 或者创建一个共享的API路由文件

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 中医知识图谱API服务启动成功！`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`🌐 环境: ${NODE_ENV}`)
  console.log(`💚 健康检查: http://localhost:${PORT}/health`)
  if (NODE_ENV === 'production') {
    console.log(`📱 前端应用: http://localhost:${PORT}`)
  }
})

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...')
  await driver.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭服务器...')
  await driver.close()
  process.exit(0)
})

