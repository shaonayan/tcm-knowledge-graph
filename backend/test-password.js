import neo4j from 'neo4j-driver'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function testPassword() {
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('🔐 Neo4j密码测试工具')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  const uri = 'neo4j+s://f36358f7.databases.neo4j.io'
  const user = 'neo4j'
  
  console.log(`连接URI: ${uri}`)
  console.log(`用户名: ${user}\n`)
  
  // 常见密码选项
  const commonPasswords = [
    'qwertyuiop06',
    'tcm123456',
    'password',
    'neo4j',
    ''
  ]
  
  console.log('🔍 先测试常见密码...\n')
  
  for (const password of commonPasswords) {
    if (!password) continue
    
    console.log(`测试密码: ${'*'.repeat(password.length)}`)
    
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password)
    )
    
    try {
      await driver.verifyConnectivity()
      console.log(`✅ 密码正确！密码是: ${password}`)
      await driver.close()
      
      console.log('\n🎉 连接成功！现在可以更新配置了。')
      rl.close()
      return password
      
    } catch (error) {
      console.log(`❌ 密码错误: ${error.message}\n`)
    } finally {
      try {
        await driver.close()
      } catch (e) {
        // 忽略关闭错误
      }
    }
  }
  
  console.log('\n❌ 所有常见密码都不正确。')
  console.log('\n💡 请手动输入密码：')
  const password = await question('请输入Neo4j密码: ')
  
  if (password) {
    console.log(`\n🔍 测试您输入的密码...`)
    
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password)
    )
    
    try {
      await driver.verifyConnectivity()
      console.log(`✅ 密码正确！`)
      
      // 测试查询
      const session = driver.session()
      const result = await session.run('MATCH (n) RETURN count(n) as total')
      const total = result.records[0].get('total').toNumber()
      await session.close()
      
      console.log(`📊 数据库包含 ${total} 个节点`)
      console.log('\n🎉 连接成功！')
      
      await driver.close()
      rl.close()
      return password
      
    } catch (error) {
      console.log(`❌ 密码错误: ${error.message}`)
      await driver.close()
      rl.close()
      return null
    }
  }
  
  rl.close()
  return null
}

testPassword().then(password => {
  if (password) {
    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('📝 请更新以下文件中的密码：')
    console.log('   backend/.env')
    console.log('   backend/server-simple.js')
    console.log('\n密码是:', password)
    console.log('═══════════════════════════════════════════════════════════\n')
  }
  process.exit(0)
})
