import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const testNeo4jConnection = async () => {
  console.log('🔍 开始测试Neo4j连接...')
  
  const driver = neo4j.driver(
    process.env.NEO4J_URI || '',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || ''
    )
  )

  try {
    // 验证连接
    await driver.verifyConnectivity()
    console.log('✅ Neo4j连接成功！')

    // 获取会话
    const session = driver.session()
    
    try {
      // 测试基本查询
      const result = await session.run('RETURN "Hello Neo4j!" as message, datetime() as timestamp')
      const record = result.records[0]
      
      console.log('📊 测试查询结果:')
      console.log(`   消息: ${record.get('message')}`)
      console.log(`   时间: ${record.get('timestamp')}`)
      
      // 检查数据库状态
      const dbInfo = await session.run('CALL dbms.components() YIELD name, versions, edition')
      const dbRecord = dbInfo.records[0]
      
      console.log('🗄️ 数据库信息:')
      console.log(`   名称: ${dbRecord.get('name')}`)
      console.log(`   版本: ${dbRecord.get('versions')}`)
      console.log(`   版本: ${dbRecord.get('edition')}`)
      
      // 检查现有数据
      const countResult = await session.run('MATCH (n) RETURN count(n) as nodeCount')
      const nodeCount = countResult.records[0].get('nodeCount').toNumber()
      
      console.log(`📈 当前数据库节点数量: ${nodeCount}`)
      
      if (nodeCount === 0) {
        console.log('💡 数据库为空，准备导入中医知识图谱数据')
      } else {
        console.log('📋 数据库中已有数据，可以直接使用')
      }
      
    } finally {
      await session.close()
    }
    
  } catch (error) {
    console.error('❌ Neo4j连接失败:')
    console.error(`   错误信息: ${error.message}`)
    
    if (error.code) {
      console.error(`   错误代码: ${error.code}`)
    }
    
    console.log('\n🔧 请检查以下配置:')
    console.log(`   URI: ${process.env.NEO4J_URI || '未设置'}`)
    console.log(`   用户名: ${process.env.NEO4J_USER || '未设置'}`)
    console.log(`   密码: ${process.env.NEO4J_PASSWORD ? '已设置' : '未设置'}`)
    
  } finally {
    await driver.close()
  }
}

// 运行测试
testNeo4jConnection().catch(console.error)
