import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const testNeo4jConnection = async () => {
  console.log('🔍 测试Neo4j连接...')
  
  // 尝试多种连接方式
  const connectionConfigs = [
    {
      name: 'Aura连接',
      uri: 'neo4j+s://f36358f7.databases.neo4j.io',
      user: 'neo4j',
      password: 'qwertyuiop06'
    },
    {
      name: '本地连接',
      uri: 'bolt://localhost:7687',
      user: 'neo4j', 
      password: 'qwertyuiop06'
    },
    {
      name: 'Aura备用连接',
      uri: 'neo4j+s://f36358f7.databases.neo4j.io',
      user: 'neo4j',
      password: 'tcm123456'
    }
  ]

  for (const config of connectionConfigs) {
    console.log(`\n🔧 尝试${config.name}...`)
    console.log(`URI: ${config.uri}`)
    console.log(`用户: ${config.user}`)
    
    const driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password)
    )

    try {
      // 验证连接
      await driver.verifyConnectivity()
      console.log(`✅ ${config.name}成功！`)

      // 获取会话并测试查询
      const session = driver.session()
      
      try {
        // 测试基本查询
        const result = await session.run('RETURN "连接成功!" as message, datetime() as timestamp')
        const record = result.records[0]
        
        console.log('📊 测试查询结果:')
        console.log(`   消息: ${record.get('message')}`)
        console.log(`   时间: ${record.get('timestamp')}`)
        
        // 检查现有数据
        const countResult = await session.run('MATCH (n) RETURN count(n) as nodeCount')
        const nodeCount = countResult.records[0].get('nodeCount').toNumber()
        
        console.log(`📈 数据库节点数量: ${nodeCount}`)
        
        // 检查节点类型
        const typesResult = await session.run('MATCH (n) RETURN DISTINCT labels(n) as labels LIMIT 10')
        console.log('🏷️ 节点类型:')
        typesResult.records.forEach(record => {
          console.log(`   - ${record.get('labels')}`)
        })
        
        // 检查关系类型
        const relsResult = await session.run('MATCH ()-[r]->() RETURN DISTINCT type(r) as relType LIMIT 10')
        console.log('🔗 关系类型:')
        relsResult.records.forEach(record => {
          console.log(`   - ${record.get('relType')}`)
        })
        
        console.log(`\n🎉 ${config.name}测试完成，连接正常！`)
        
        // 保存成功的配置
        console.log('\n📝 成功的连接配置:')
        console.log(`NEO4J_URI=${config.uri}`)
        console.log(`NEO4J_USER=${config.user}`)
        console.log(`NEO4J_PASSWORD=${config.password}`)
        
        await session.close()
        await driver.close()
        return config // 返回成功的配置
        
      } catch (queryError) {
        console.error(`❌ 查询失败: ${queryError.message}`)
        await session.close()
      }
      
    } catch (error) {
      console.error(`❌ ${config.name}失败: ${error.message}`)
    } finally {
      await driver.close()
    }
  }
  
  console.log('\n❌ 所有连接方式都失败了')
  return null
}

// 运行测试
testNeo4jConnection().catch(console.error)
