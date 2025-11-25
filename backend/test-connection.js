import neo4j from 'neo4j-driver'

const uri = 'neo4j+s://f36358f7.databases.neo4j.io'
const user = 'neo4j'
const password = 'RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U'

console.log('🔍 测试Neo4j连接...')
console.log(`URI: ${uri}`)
console.log(`用户: ${user}`)
console.log(`密码: ${'*'.repeat(password.length)}\n`)

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

try {
  console.log('正在验证连接...')
  await driver.verifyConnectivity()
  console.log('✅ 连接成功！\n')
  
  // 测试查询
  const session = driver.session()
  console.log('正在查询数据...')
  
  const result = await session.run('MATCH (n) RETURN count(n) as total')
  const total = result.records[0].get('total').toNumber()
  
  console.log(`📊 数据库包含 ${total} 个节点\n`)
  
  // 测试标签统计
  const labelResult = await session.run(`
    MATCH (n) 
    RETURN DISTINCT labels(n) as labels, count(n) as count
  `)
  
  console.log('📈 节点类型统计:')
  labelResult.records.forEach(record => {
    const label = record.get('labels')[0]
    const count = record.get('count').toNumber()
    console.log(`   ${label}: ${count} 个节点`)
  })
  
  await session.close()
  console.log('\n🎉 所有测试通过！密码正确！')
  
  await driver.close()
  process.exit(0)
  
} catch (error) {
  console.error(`\n❌ 连接失败:`)
  console.error(`   错误类型: ${error.code || 'UNKNOWN'}`)
  console.error(`   错误信息: ${error.message}`)
  
  if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
    console.error('\n💡 提示: 密码不正确，请检查密码是否正确。')
  }
  
  await driver.close()
  process.exit(1)
}
