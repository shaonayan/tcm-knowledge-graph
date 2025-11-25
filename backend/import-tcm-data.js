import neo4j from 'neo4j-driver'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const importTCMData = async () => {
  console.log('🚀 开始导入中医知识图谱数据...')
  
  const driver = neo4j.driver(
    process.env.NEO4J_URI || '',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || ''
    )
  )

  try {
    const session = driver.session()
    
    try {
      // 1. 清空现有数据（可选）
      console.log('🧹 清理现有数据...')
      await session.run('MATCH (n) DETACH DELETE n')
      console.log('✅ 数据清理完成')
      
      // 2. 查找CSV文件
      const csvPath = path.join(process.cwd(), '..', '..', '中医病证分类与代码_精细清理版.csv')
      
      if (!fs.existsSync(csvPath)) {
        console.log('❌ 找不到CSV文件，请确保文件位于正确位置:')
        console.log(`   期望路径: ${csvPath}`)
        return
      }
      
      // 3. 读取CSV数据
      console.log('📖 读取CSV文件...')
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        encoding: 'utf8'
      })
      
      console.log(`📊 找到 ${records.length} 条记录`)
      
      // 4. 批量创建节点
      console.log('🏗️ 创建节点...')
      let nodeCount = 0
      
      for (const record of records) {
        const createQuery = `
          CREATE (n:TCM_Term {
            代码: $代码,
            分类层级: toInteger($分类层级),
            主要术语: $主要术语,
            同义词1: $同义词1,
            同义词2: $同义词2,
            同义词3: $同义词3,
            同义词4: $同义词4,
            同义词5: $同义词5,
            类别: $类别,
            备注: $备注
          })
        `
        
        await session.run(createQuery, {
          代码: record['代码'] || '',
          分类层级: record['分类层级'] || '0',
          主要术语: record['主要术语'] || '',
          同义词1: record['同义词1'] || '',
          同义词2: record['同义词2'] || '',
          同义词3: record['同义词3'] || '',
          同义词4: record['同义词4'] || '',
          同义词5: record['同义词5'] || '',
          类别: record['类别'] || '',
          备注: record['备注'] || ''
        })
        
        nodeCount++
        if (nodeCount % 100 === 0) {
          console.log(`   已创建 ${nodeCount} 个节点...`)
        }
      }
      
      console.log(`✅ 节点创建完成，共创建 ${nodeCount} 个节点`)
      
      // 5. 创建层次关系
      console.log('🔗 创建层次关系...')
      
      const relationshipQuery = `
        MATCH (parent), (child)
        WITH parent, child, keys(parent)[0] as codeKey
        WHERE parent[codeKey] IS NOT NULL 
          AND child[codeKey] IS NOT NULL
          AND toString(child[codeKey]) STARTS WITH toString(parent[codeKey])
          AND size(toString(child[codeKey])) > size(toString(parent[codeKey]))
        CREATE (parent)-[:包含]->(child)
        RETURN count(*) as 创建的关系数
      `
      
      const relationshipResult = await session.run(relationshipQuery)
      const relationshipCount = relationshipResult.records[0].get('创建的关系数').toNumber()
      
      console.log(`✅ 关系创建完成，共创建 ${relationshipCount} 个关系`)
      
      // 6. 验证导入结果
      console.log('🔍 验证导入结果...')
      
      const verifyQuery = `
        MATCH (n:TCM_Term)
        RETURN count(n) as 总节点数,
               count{(n)-[:包含]->()}  as 总关系数,
               count{(n) WHERE NOT ()-[:包含]->(n)} as 根节点数
      `
      
      const verifyResult = await session.run(verifyQuery)
      const stats = verifyResult.records[0]
      
      console.log('📈 导入统计:')
      console.log(`   总节点数: ${stats.get('总节点数')}`)
      console.log(`   总关系数: ${stats.get('总关系数')}`)
      console.log(`   根节点数: ${stats.get('根节点数')}`)
      
      console.log('🎉 中医知识图谱数据导入完成！')
      
    } finally {
      await session.close()
    }
    
  } catch (error) {
    console.error('❌ 数据导入失败:')
    console.error(error)
  } finally {
    await driver.close()
  }
}

// 运行导入
importTCMData().catch(console.error)
