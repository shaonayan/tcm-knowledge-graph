import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neo4jService } from '@services/neo4j.js'
import { logger } from '@utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// TCM数据集路径
const TCM_DATASETS_PATH = path.join(__dirname, '../../../TCM_Datasets-main')

/**
 * 提取中医实体（疾病、证候、方剂、中药等）
 */
function extractTCMEntities(text: string): {
  diseases: string[]
  syndromes: string[]
  formulas: string[]
  herbs: string[]
  symptoms: string[]
} {
  const entities = {
    diseases: [] as string[],
    syndromes: [] as string[],
    formulas: [] as string[],
    herbs: [] as string[],
    symptoms: [] as string[]
  }

  // 常见中医术语模式
  const diseasePatterns = [
    /([\u4e00-\u9fa5]{2,6})(?:病|症|疾)/g,
    /(感冒|咳嗽|头痛|失眠|便秘|腹泻|胃痛|腰痛|发热|眩晕)/g
  ]

  const syndromePatterns = [
    /([\u4e00-\u9fa5]{2,6})(?:虚|实|热|寒|湿|燥|风|气|血|阴|阳)/g,
    /(脾虚|肾虚|肝郁|气滞|血瘀|痰湿|湿热|阴虚|阳虚|气虚|血虚)/g
  ]

  const formulaPatterns = [
    /([\u4e00-\u9fa5]{2,8})(?:汤|散|丸|膏|丹|饮)/g,
    /(四君子汤|四物汤|六味地黄丸|逍遥散|小柴胡汤)/g
  ]

  const herbPatterns = [
    /([\u4e00-\u9fa5]{2,4})(?:参|草|花|叶|根|皮|仁|子|实)/g,
    /(人参|黄芪|当归|甘草|茯苓|白术|陈皮|半夏)/g
  ]

  const symptomPatterns = [
    /(食欲不振|腹胀|便溏|神疲|乏力|面色|舌|脉|疼痛|不适)/g
  ]

  // 提取疾病
  diseasePatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      entities.diseases.push(...matches.map(m => m.replace(/[病症疾]$/, '')))
    }
  })

  // 提取证候
  syndromePatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      entities.syndromes.push(...matches)
    }
  })

  // 提取方剂
  formulaPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      entities.formulas.push(...matches)
    }
  })

  // 提取中药
  herbPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      entities.herbs.push(...matches)
    }
  })

  // 提取症状
  symptomPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      entities.symptoms.push(...matches)
    }
  })

  // 去重
  Object.keys(entities).forEach(key => {
    entities[key as keyof typeof entities] = Array.from(new Set(entities[key as keyof typeof entities]))
  })

  return entities
}

/**
 * 提取二元关系
 */
function extractRelations(text: string, entities: ReturnType<typeof extractTCMEntities>): Array<{
  source: string
  target: string
  type: string
}> {
  const relations: Array<{ source: string; target: string; type: string }> = []

  // 证候-疾病关系
  entities.syndromes.forEach(syndrome => {
    entities.diseases.forEach(disease => {
      if (text.includes(syndrome) && text.includes(disease)) {
        relations.push({
          source: syndrome,
          target: disease,
          type: '相关'
        })
      }
    })
  })

  // 方剂-证候关系
  entities.formulas.forEach(formula => {
    entities.syndromes.forEach(syndrome => {
      if (text.includes(formula) && text.includes(syndrome)) {
        relations.push({
          source: formula,
          target: syndrome,
          type: '治疗'
        })
      }
    })
  })

  // 中药-方剂关系
  entities.herbs.forEach(herb => {
    entities.formulas.forEach(formula => {
      if (text.includes(herb) && text.includes(formula)) {
        relations.push({
          source: herb,
          target: formula,
          type: '包含'
        })
      }
    })
  })

  // 症状-证候关系
  entities.symptoms.forEach(symptom => {
    entities.syndromes.forEach(syndrome => {
      if (text.includes(symptom) && text.includes(syndrome)) {
        relations.push({
          source: symptom,
          target: syndrome,
          type: '症状'
        })
      }
    })
  })

  return relations
}

/**
 * 提取三元组（主体-谓词-客体）
 */
function extractTriples(text: string, entities: ReturnType<typeof extractTCMEntities>): Array<{
  subject: string
  predicate: string
  object: string
  confidence?: number
  source?: string
}> {
  const triples: Array<{ subject: string; predicate: string; object: string; confidence?: number; source?: string }> = []

  // 常见谓词模式
  const predicatePatterns = [
    { pattern: /(.+?)(?:治疗|用于|适用于)(.+?)/g, predicate: '治疗' },
    { pattern: /(.+?)(?:导致|引起|引发)(.+?)/g, predicate: '导致' },
    { pattern: /(.+?)(?:属于|归于|分类为)(.+?)/g, predicate: '属于' },
    { pattern: /(.+?)(?:包含|含有|组成)(.+?)/g, predicate: '包含' },
    { pattern: /(.+?)(?:症状|表现为|出现)(.+?)/g, predicate: '症状' },
    { pattern: /(.+?)(?:配伍|配合|联合)(.+?)/g, predicate: '配伍' },
    { pattern: /(.+?)(?:禁忌|不宜|禁用)(.+?)/g, predicate: '禁忌' },
    { pattern: /(.+?)(?:功效|作用|功能)(.+?)/g, predicate: '功效' }
  ]

  // 从文本中提取三元组
  predicatePatterns.forEach(({ pattern, predicate }) => {
    const matches = Array.from(text.matchAll(pattern))
    matches.forEach(match => {
      const subject = match[1]?.trim()
      const object = match[2]?.trim()
      
      if (subject && object && subject.length <= 20 && object.length <= 20) {
        // 验证主体和客体是否在实体列表中
        const allEntityNames = [
          ...entities.diseases,
          ...entities.syndromes,
          ...entities.formulas,
          ...entities.herbs,
          ...entities.symptoms
        ]
        
        const subjectMatch = allEntityNames.find(e => subject.includes(e) || e.includes(subject))
        const objectMatch = allEntityNames.find(e => object.includes(e) || e.includes(object))
        
        if (subjectMatch || objectMatch) {
          triples.push({
            subject: subjectMatch || subject,
            predicate,
            object: objectMatch || object,
            confidence: 0.7, // 默认置信度
            source: 'text_extraction'
          })
        }
      }
    })
  })

  // 基于实体共现生成三元组
  const allEntities = [
    ...entities.diseases.map(e => ({ name: e, category: '疾病类' })),
    ...entities.syndromes.map(e => ({ name: e, category: '证候类' })),
    ...entities.formulas.map(e => ({ name: e, category: '方剂' })),
    ...entities.herbs.map(e => ({ name: e, category: '中药' })),
    ...entities.symptoms.map(e => ({ name: e, category: '症状' }))
  ]

  // 在同一句子或段落中出现的实体对
  const sentences = text.split(/[。！？；\n]/)
  sentences.forEach(sentence => {
    const sentenceEntities = allEntities.filter(e => sentence.includes(e.name))
    
    for (let i = 0; i < sentenceEntities.length; i++) {
      for (let j = i + 1; j < sentenceEntities.length; j++) {
        const e1 = sentenceEntities[i]
        const e2 = sentenceEntities[j]
        
        // 根据类别推断谓词
        let predicate = '相关'
        if (e1.category === '方剂' && e2.category === '证候类') {
          predicate = '治疗'
        } else if (e1.category === '中药' && e2.category === '方剂') {
          predicate = '包含'
        } else if (e1.category === '症状' && e2.category === '证候类') {
          predicate = '症状'
        } else if (e1.category === '证候类' && e2.category === '疾病类') {
          predicate = '相关'
        }
        
        triples.push({
          subject: e1.name,
          predicate,
          object: e2.name,
          confidence: 0.5, // 共现的置信度较低
          source: 'cooccurrence'
        })
      }
    }
  })

  // 去重
  const uniqueTriples = new Map<string, typeof triples[0]>()
  triples.forEach(triple => {
    const key = `${triple.subject}-${triple.predicate}-${triple.object}`
    if (!uniqueTriples.has(key)) {
      uniqueTriples.set(key, triple)
    } else {
      // 如果已存在，提高置信度
      const existing = uniqueTriples.get(key)!
      existing.confidence = Math.min(1.0, (existing.confidence || 0.5) + 0.1)
    }
  })

  return Array.from(uniqueTriples.values())
}

/**
 * 读取Markdown文件
 */
function readMarkdownFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    logger.error(`读取文件失败: ${filePath}`, error)
    return ''
  }
}

/**
 * 遍历目录并处理文件
 */
function processDirectory(dirPath: string): Array<{ file: string; content: string; category: string }> {
  const files: Array<{ file: string; content: string; category: string }> = []
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        files.push(...processDirectory(fullPath))
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
        const content = readMarkdownFile(fullPath)
        if (content) {
          // 从路径提取类别
          const category = path.relative(TCM_DATASETS_PATH, dirPath).replace(/\\/g, '/')
          files.push({
            file: entry.name,
            content,
            category: category || '根目录'
          })
        }
      }
    }
  } catch (error) {
    logger.error(`处理目录失败: ${dirPath}`, error)
  }
  
  return files
}

/**
 * 生成节点代码
 */
function generateNodeCode(entity: string, category: string, index: number): string {
  const prefix = category === '疾病类' ? 'D' : category === '证候类' ? 'S' : category === '方剂' ? 'F' : category === '中药' ? 'H' : 'X'
  return `${prefix}${String(index).padStart(6, '0')}`
}

/**
 * 导入数据到Neo4j
 */
async function importToNeo4j(
  entities: Map<string, { name: string; category: string; level: number; source: string }>,
  relations: Array<{ source: string; target: string; type: string }>,
  triples: Array<{ subject: string; predicate: string; object: string; confidence?: number; source?: string }>
): Promise<void> {
  const session = neo4jService.getSession()
  
  try {
    logger.info(`开始导入 ${entities.size} 个节点和 ${relations.length} 条关系`)

    // 批量创建节点
    const batchSize = 100
    const entityArray = Array.from(entities.entries())
    
    for (let i = 0; i < entityArray.length; i += batchSize) {
      const batch = entityArray.slice(i, i + batchSize)
      
      const query = `
        UNWIND $batch AS entity
        MERGE (n:TCMEntity {code: entity.code})
        SET n.name = entity.name,
            n.category = entity.category,
            n.level = entity.level,
            n.source = entity.source,
            n.createdAt = datetime()
        RETURN count(n) as created
      `
      
      const result = await session.run(query, {
        batch: batch.map(([code, data]) => ({
          code,
          name: data.name,
          category: data.category,
          level: data.level,
          source: data.source
        }))
      })
      
      logger.info(`已导入 ${i + batch.length}/${entityArray.length} 个节点`)
    }

    // 批量创建关系
    for (let i = 0; i < relations.length; i += batchSize) {
      const batch = relations.slice(i, i + batchSize)
      
      const query = `
        UNWIND $batch AS rel
        MATCH (source:TCMEntity {code: rel.sourceCode})
        MATCH (target:TCMEntity {code: rel.targetCode})
        MERGE (source)-[r:${batch[0]?.type || 'RELATED'}]->(target)
        SET r.createdAt = datetime()
        RETURN count(r) as created
      `
      
      // 按关系类型分组处理
      const relationsByType = new Map<string, typeof batch>()
      batch.forEach(rel => {
        if (!relationsByType.has(rel.type)) {
          relationsByType.set(rel.type, [])
        }
        relationsByType.get(rel.type)!.push(rel)
      })

      for (const [type, typeRels] of relationsByType.entries()) {
        const sourceCodes = new Set(typeRels.map(r => r.source))
        const targetCodes = new Set(typeRels.map(r => r.target))
        
        // 查找对应的节点代码
        const sourceCodeMap = new Map<string, string>()
        const targetCodeMap = new Map<string, string>()
        
        for (const [code, data] of entities.entries()) {
          if (sourceCodes.has(data.name)) {
            sourceCodeMap.set(data.name, code)
          }
          if (targetCodes.has(data.name)) {
            targetCodeMap.set(data.name, code)
          }
        }

        const relsWithCodes = typeRels
          .map(rel => ({
            sourceCode: sourceCodeMap.get(rel.source),
            targetCode: targetCodeMap.get(rel.target),
            type: rel.type
          }))
          .filter(rel => rel.sourceCode && rel.targetCode)

        if (relsWithCodes.length > 0) {
          const relQuery = `
            UNWIND $rels AS rel
            MATCH (source:TCMEntity {code: rel.sourceCode})
            MATCH (target:TCMEntity {code: rel.targetCode})
            MERGE (source)-[r:\`${type}\`]->(target)
            SET r.createdAt = datetime()
            RETURN count(r) as created
          `
          
          await session.run(relQuery, { rels: relsWithCodes })
          logger.info(`已导入 ${relsWithCodes.length} 条 ${type} 关系`)
        }
      }
    }

    // 导入三元组（在关系上添加属性）
    for (let i = 0; i < triples.length; i += batchSize) {
      const batch = triples.slice(i, i + batchSize)
      
      // 查找对应的节点代码
      const tripleWithCodes = batch
        .map(triple => {
          let subjectCode: string | undefined
          let objectCode: string | undefined
          
          for (const [code, data] of entities.entries()) {
            if (data.name === triple.subject) {
              subjectCode = code
            }
            if (data.name === triple.object) {
              objectCode = code
            }
          }
          
          return { triple, subjectCode, objectCode }
        })
        .filter(item => item.subjectCode && item.objectCode)

      if (tripleWithCodes.length > 0) {
        const tripleQuery = `
          UNWIND $triples AS t
          MATCH (subject:TCMEntity {code: t.subjectCode})
          MATCH (object:TCMEntity {code: t.objectCode})
          MERGE (subject)-[r:\`${tripleWithCodes[0].triple.predicate}\`]->(object)
          SET r.predicate = t.predicate,
              r.confidence = t.confidence,
              r.source = t.source,
              r.createdAt = datetime()
          RETURN count(r) as created
        `
        
        await session.run(tripleQuery, {
          triples: tripleWithCodes.map(item => ({
            subjectCode: item.subjectCode,
            objectCode: item.objectCode,
            predicate: item.triple.predicate,
            confidence: item.triple.confidence || 0.5,
            source: item.triple.source || 'unknown'
          }))
        })
        
        logger.info(`已导入 ${tripleWithCodes.length} 个三元组`)
      }
    }

    logger.info('✅ 数据导入完成')
  } catch (error) {
    logger.error('导入数据失败:', error)
    throw error
  } finally {
    await session.close()
  }
}

/**
 * 主导入函数
 */
export async function importTCMDatasets(): Promise<void> {
  try {
    logger.info('开始导入TCM数据集...')

    if (!fs.existsSync(TCM_DATASETS_PATH)) {
      logger.error(`数据集路径不存在: ${TCM_DATASETS_PATH}`)
      return
    }

    // 处理所有文件
    const files = processDirectory(TCM_DATASETS_PATH)
    logger.info(`找到 ${files.length} 个文件`)

    const entities = new Map<string, { name: string; category: string; level: number; source: string }>()
    const relations: Array<{ source: string; target: string; type: string }> = []
    const triples: Array<{ subject: string; predicate: string; object: string; confidence?: number; source?: string }> = []

    let entityIndex = 1

    // 处理每个文件
    for (const file of files) {
      logger.info(`处理文件: ${file.file} (${file.category})`)

      // 提取实体
      const fileEntities = extractTCMEntities(file.content)
      
      // 提取三元组
      const fileTriples = extractTriples(file.content, fileEntities)
      triples.push(...fileTriples)

      // 添加疾病
      fileEntities.diseases.forEach(disease => {
        const code = generateNodeCode(disease, '疾病类', entityIndex++)
        if (!entities.has(code)) {
          entities.set(code, {
            name: disease,
            category: '疾病类',
            level: 2,
            source: file.category
          })
        }
      })

      // 添加证候
      fileEntities.syndromes.forEach(syndrome => {
        const code = generateNodeCode(syndrome, '证候类', entityIndex++)
        if (!entities.has(code)) {
          entities.set(code, {
            name: syndrome,
            category: '证候类',
            level: 2,
            source: file.category
          })
        }
      })

      // 添加方剂
      fileEntities.formulas.forEach(formula => {
        const code = generateNodeCode(formula, '方剂', entityIndex++)
        if (!entities.has(code)) {
          entities.set(code, {
            name: formula,
            category: '方剂',
            level: 3,
            source: file.category
          })
        }
      })

      // 添加中药
      fileEntities.herbs.forEach(herb => {
        const code = generateNodeCode(herb, '中药', entityIndex++)
        if (!entities.has(code)) {
          entities.set(code, {
            name: herb,
            category: '中药',
            level: 4,
            source: file.category
          })
        }
      })

      // 添加症状
      fileEntities.symptoms.forEach(symptom => {
        const code = generateNodeCode(symptom, '症状', entityIndex++)
        if (!entities.has(code)) {
          entities.set(code, {
            name: symptom,
            category: '症状',
            level: 3,
            source: file.category
          })
        }
      })

      // 提取关系
      const fileRelations = extractRelations(file.content, fileEntities)
      relations.push(...fileRelations)
    }

    logger.info(`提取到 ${entities.size} 个实体、${relations.length} 条关系和 ${triples.length} 个三元组`)

    // 导入到Neo4j
    await importToNeo4j(entities, relations, triples)

    logger.info('✅ TCM数据集导入完成')
  } catch (error) {
    logger.error('导入TCM数据集失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  importTCMDatasets()
    .then(() => {
      logger.info('导入完成')
      process.exit(0)
    })
    .catch(error => {
      logger.error('导入失败:', error)
      process.exit(1)
    })
}

