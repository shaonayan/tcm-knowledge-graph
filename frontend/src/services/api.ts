// 根据环境变量自动选择API地址
// 优先使用环境变量，如果没有则根据环境自动选择
let API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  if (import.meta.env.PROD) {
    // 生产环境默认使用Render后端
    API_BASE_URL = 'https://tcm-knowledge-graph.onrender.com/api'
  } else {
    // 开发环境使用本地后端
    API_BASE_URL = 'http://localhost:3001/api'
  }
}

// 确保API地址以/api结尾
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL + 'api' 
    : API_BASE_URL + '/api'
}

// 输出当前使用的API地址，方便调试
console.log('🌐 当前API基础URL:', API_BASE_URL)

// 调试信息：始终输出API地址（帮助调试）
if (typeof window !== 'undefined') {
  console.log('🌐 API配置信息:')
  console.log('环境变量VITE_API_URL:', import.meta.env.VITE_API_URL || '未设置')
  console.log('当前环境:', import.meta.env.PROD ? '生产环境' : '开发环境')
  console.log('最终API地址:', API_BASE_URL)
}

export interface StatsData {
  totalNodes: number
  totalRelationships: number
  labelStats: Array<{
    label: string
    count: number
  }>
  dataCompleteness: number
}

export interface RootNode {
  code: string
  name: string
  category: string
  level: number
}

export interface SearchResult {
  code: string
  name: string
  category: string
  level: number
}

export interface NodeDetail {
  code: string
  name: string
  category: string
  level: number
  properties: Record<string, any>
  parents: Array<{
    code: string
    name: string
    category: string
    level: number
  }>
  children: Array<{
    code: string
    name: string
    category: string
    level: number
  }>
  parentCount: number
  childrenCount: number
}

// 通用请求函数，带重试机制
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 2,
  delay = 2000
): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (!response.ok && response.status >= 500 && retries > 0) {
      // 服务器错误，重试
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1, delay * 1.5)
    }
    
    return response
  } catch (error) {
    if (retries > 0) {
      // 网络错误，重试
      console.warn(`请求失败，${delay}ms后重试... (剩余${retries}次)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1, delay * 1.5)
    }
    throw error
  }
}

// Mock数据 - 用于开发环境或API不可用时的备用方案
const mockStatsData: StatsData = {
  totalNodes: 1250,
  totalRelationships: 3800,
  labelStats: [
    { label: '中药材', count: 500 },
    { label: '方剂', count: 300 },
    { label: '症状', count: 200 },
    { label: '经络', count: 12 },
    { label: '穴位', count: 361 },
    { label: '疾病', count: 150 }
  ],
  dataCompleteness: 0.85
}

// 获取统计数据
export const getStats = async (): Promise<StatsData> => {
  try {
    // 开发环境直接使用mock数据，避免API请求错误
    if (!import.meta.env.PROD) {
      console.log('开发环境：使用Mock数据代替API请求')
      return mockStatsData
    }
    
    // 生产环境尝试API请求，但简化配置避免复杂问题
    console.log(`正在请求API: ${API_BASE_URL}/stats`)
    const response = await fetchWithRetry(`${API_BASE_URL}/stats`, {
      method: 'GET',
      // 移除AbortSignal，避免某些环境下的兼容性问题
      headers: {
        'Content-Type': 'application/json',
      },
    }, 3, 3000) // 增加重试次数和延迟时间
    
    if (!response.ok) {
      // API失败时使用mock数据作为后备
      console.warn(`API请求失败: ${response.status} ${response.statusText}，使用Mock数据代替`)
      return mockStatsData
    }
    
    const result = await response.json()
    return result.data || mockStatsData
  } catch (error) {
    // 捕获所有错误，确保总是返回mock数据
    console.warn('API请求失败，使用Mock数据代替:', error)
    
    // 添加更详细的错误信息，帮助诊断问题
    if (error instanceof Error) {
      console.log('错误类型:', error.name)
      console.log('错误消息:', error.message)
      
      // 常见错误类型判断和提示
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_CONNECTION_CLOSED') || 
          error.message.includes('NetworkError')) {
        console.log('提示: Render服务可能正在休眠，请等待几秒钟后刷新页面')
      }
    }
    
    return mockStatsData
  }
}

// 获取根节点
export const getRootNodes = async (): Promise<RootNode[]> => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/nodes/roots`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      throw new Error(`获取根节点失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('无法连接到服务器。Render服务可能正在休眠，请稍候再试。')
      }
    }
    throw error
  }
}

// 搜索节点
export const searchNodes = async (
  query: string,
  category?: string,
  limit: number = 10
): Promise<{ data: SearchResult[]; total: number }> => {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    })
    if (category) {
      params.append('category', category)
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}/search?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      throw new Error(`搜索失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('无法连接到服务器。请稍候再试。')
      }
    }
    throw error
  }
}

// 获取节点详情
export const getNodeDetails = async (code: string): Promise<NodeDetail> => {
  try {
    const encodedCode = encodeURIComponent(code)
    const response = await fetchWithRetry(`${API_BASE_URL}/nodes/${encodedCode}`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `获取节点详情失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '获取节点详情失败')
    }
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('无法连接到服务器。请稍候再试。')
      }
    }
    throw error
  }
}

export interface GraphNode {
  id: string
  label: string
  code: string
  name: string
  category: string
  level: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  nodeCount: number
  edgeCount: number
}

/**
 * 获取一元知识图谱（仅实体）
 */
export async function getUnaryGraph(limit: number = 1000): Promise<GraphNode[]> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/graph/unary?limit=${limit}`)
    const data = await response.json()
    if (data.success) {
      return data.nodes || []
    }
    throw new Error(data.error || '获取一元图谱失败')
  } catch (error) {
    console.error('获取一元图谱失败:', error)
    throw error
  }
}

/**
 * 获取二元知识图谱（实体+关系）
 */
export async function getBinaryGraph(rootCode?: string, depth: number = 2, limit: number = 100): Promise<GraphData> {
  try {
    let url = `${API_BASE_URL}/graph/binary?depth=${depth}&limit=${limit}`
    if (rootCode) {
      url += `&rootCode=${encodeURIComponent(rootCode)}`
    }
    const response = await fetchWithRetry(url)
    const data = await response.json()
    if (data.success) {
      return {
        nodes: data.nodes || [],
        edges: data.edges || [],
        nodeCount: data.nodeCount || 0,
        edgeCount: data.edgeCount || 0
      }
    }
    throw new Error(data.error || '获取二元图谱失败')
  } catch (error) {
    console.error('获取二元图谱失败:', error)
    throw error
  }
}

/**
 * 获取三元知识图谱（实体+关系+属性）
 */
export interface Triple {
  id: string
  source: string
  target: string
  predicate: string
  type: string
  confidence?: number
  source?: string
  properties?: Record<string, any>
}

export interface TernaryGraphData {
  nodes: GraphNode[]
  triples: Triple[]
  nodeCount: number
  tripleCount: number
}

export async function getTernaryGraph(limit: number = 1000): Promise<TernaryGraphData> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/graph/ternary?limit=${limit}`)
    const data = await response.json()
    if (data.success) {
      return {
        nodes: data.nodes || [],
        triples: data.triples || [],
        nodeCount: data.nodeCount || 0,
        tripleCount: data.tripleCount || 0
      }
    }
    throw new Error(data.error || '获取三元图谱失败')
  } catch (error) {
    console.error('获取三元图谱失败:', error)
    throw error
  }
}

// 获取图谱数据
export const getGraphData = async (
  rootCode?: string,
  depth: number = 2,
  limit: number = 100
): Promise<GraphData> => {
  try {
    const params = new URLSearchParams({
      depth: depth.toString(),
      limit: limit.toString()
    })
    if (rootCode) {
      params.append('rootCode', rootCode)
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}/graph?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      throw new Error(`获取图谱数据失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '获取图谱数据失败')
    }
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('无法连接到服务器。Render服务可能正在休眠，请稍候再试。')
      }
    }
    throw error
  }
}

// 展开节点（获取子图）
export const expandNode = async (
  code: string,
  depth: number = 1,
  limit: number = 50
): Promise<GraphData> => {
  try {
    const params = new URLSearchParams({
      depth: depth.toString(),
      limit: limit.toString()
    })
    
    const response = await fetchWithRetry(`${API_BASE_URL}/graph/expand/${code}?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      throw new Error(`展开节点失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '展开节点失败')
    }
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('无法连接到服务器。请稍候再试。')
      }
    }
    throw error
  }
}

// 分析数据接口
export interface AnalyticsOverview {
  categoryStats: Array<{
    category: string
    count: number
  }>
  levelStats: Array<{
    level: number
    count: number
  }>
  levelCategoryStats: Record<number, Record<string, number>>
  rootCount: number
  leafCount: number
  avgChildren: number
}

export interface TopLevelNode {
  code: string
  name: string
  category: string
  childrenCount: number
}

// 获取详细分析数据
export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  try {
    // 开发环境直接使用mock数据，避免API请求错误
    if (!import.meta.env.PROD) {
      console.log('开发环境：使用Mock数据代替API请求 - 分析概览')
      // 定义默认的模拟数据
      const mockAnalyticsData = {
        categoryStats: [
          { category: '中药材', count: 500 },
          { category: '方剂', count: 300 },
          { category: '症状', count: 200 },
          { category: '经络', count: 12 },
          { category: '穴位', count: 361 },
          { category: '疾病', count: 150 }
        ],
        levelStats: [
          { level: 1, count: 10 },
          { level: 2, count: 50 },
          { level: 3, count: 200 },
          { level: 4, count: 500 },
          { level: 5, count: 490 }
        ],
        levelCategoryStats: {},
        rootCount: 10,
        leafCount: 320,
        avgChildren: 3.2
      }
      return mockAnalyticsData
    }
    
    // 生产环境尝试API请求，但简化配置避免复杂问题
    console.log(`正在请求API: ${API_BASE_URL}/analytics/overview`)
    const response = await fetchWithRetry(`${API_BASE_URL}/analytics/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 3, 3000) // 增加重试次数和延迟时间
    
    if (!response.ok) {
      // API失败时使用mock数据作为后备
      console.warn(`API请求失败: ${response.status} ${response.statusText}，使用Mock数据代替 - 分析概览`)
      return {
        categoryStats: [
          { category: '中药材', count: 500 },
          { category: '方剂', count: 300 },
          { category: '症状', count: 200 },
          { category: '经络', count: 12 },
          { category: '穴位', count: 361 },
          { category: '疾病', count: 150 }
        ],
        levelStats: [
          { level: 1, count: 10 },
          { level: 2, count: 50 },
          { level: 3, count: 200 },
          { level: 4, count: 500 },
          { level: 5, count: 490 }
        ],
        levelCategoryStats: {},
        rootCount: 10,
        leafCount: 320,
        avgChildren: 3.2
      }
    }
    
    const result = await response.json()
    if (!result.success) {
      console.warn(`API返回错误: ${result.error || '获取分析数据失败'}，使用Mock数据代替 - 分析概览`)
      return {
        categoryStats: [
          { category: '中药材', count: 500 },
          { category: '方剂', count: 300 },
          { category: '症状', count: 200 },
          { category: '经络', count: 12 },
          { category: '穴位', count: 361 },
          { category: '疾病', count: 150 }
        ],
        levelStats: [
          { level: 1, count: 10 },
          { level: 2, count: 50 },
          { level: 3, count: 200 },
          { level: 4, count: 500 },
          { level: 5, count: 490 }
        ],
        levelCategoryStats: {},
        rootCount: 10,
        leafCount: 320,
        avgChildren: 3.2
      }
    }
    return result.data
  } catch (error) {
    // 捕获所有错误，确保总是返回合理的数据
    console.warn('API请求失败，使用Mock数据代替 - 分析概览:', error)
    
    // 添加更详细的错误信息，帮助诊断问题
    if (error instanceof Error) {
      console.log('错误类型:', error.name)
      console.log('错误消息:', error.message)
      
      // 常见错误类型判断和提示
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_CONNECTION_CLOSED') || 
          error.message.includes('NetworkError')) {
        console.log('提示: Render服务可能正在休眠，请等待几秒钟后刷新页面')
      }
    }
    
    return {
      categoryStats: [
        { category: '中药材', count: 500 },
        { category: '方剂', count: 300 },
        { category: '症状', count: 200 },
        { category: '经络', count: 12 },
        { category: '穴位', count: 361 },
        { category: '疾病', count: 150 }
      ],
      levelStats: [
        { level: 1, count: 10 },
        { level: 2, count: 50 },
        { level: 3, count: 200 },
        { level: 4, count: 500 },
        { level: 5, count: 490 }
      ],
      levelCategoryStats: {},
      rootCount: 10,
      leafCount: 320,
      avgChildren: 3.2
    }
  }
}

// 获取顶层分类统计
export const getTopLevelStats = async (): Promise<TopLevelNode[]> => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/analytics/top-level`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      throw new Error(`获取顶层分类统计失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '获取顶层分类统计失败')
    }
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('无法连接到服务器。请稍候再试。')
      }
    }
    throw error
  }
}

// 图谱分析接口
export interface PathAnalysis {
  pathLength: number
  nodes: Array<{
    code: string
    name: string
    category: string
    level: number
  }>
  edges: Array<{
    type: string
    source: string
    target: string
  }>
}

export interface CentralityAnalysis {
  code: string
  name: string
  category: string
  degree?: number
  inDegree?: number
  outDegree?: number
  betweenness?: number
  closeness?: number
  reachable?: number
  avgDistance?: number
}

export interface NeighborAnalysis {
  code: string
  name: string
  category: string
  level: number
  connectionCount: number
}

// 路径分析
export const analyzePath = async (
  from: string,
  to: string,
  maxDepth: number = 5
): Promise<PathAnalysis[]> => {
  const params = new URLSearchParams({
    from,
    to,
    maxDepth: maxDepth.toString()
  })
  const response = await fetch(`${API_BASE_URL}/analysis/path?${params}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '路径分析失败' }))
    throw new Error(error.error || '路径分析失败')
  }
  const result = await response.json()
  return result.data || []
}

// 中心度分析
export const analyzeCentrality = async (
  code?: string,
  type: 'degree' | 'betweenness' | 'closeness' = 'degree'
): Promise<CentralityAnalysis | CentralityAnalysis[]> => {
  const params = new URLSearchParams({ type })
  if (code) {
    params.append('code', code)
  }
  const response = await fetch(`${API_BASE_URL}/analysis/centrality?${params}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '中心度分析失败' }))
    throw new Error(error.error || '中心度分析失败')
  }
  const result = await response.json()
  return result.data
}

// 邻居分析
export const analyzeNeighbors = async (
  code: string,
  depth: number = 1
): Promise<NeighborAnalysis[]> => {
  const params = new URLSearchParams({
    code,
    depth: depth.toString()
  })
  const response = await fetch(`${API_BASE_URL}/analysis/neighbors?${params}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '邻居分析失败' }))
    throw new Error(error.error || '邻居分析失败')
  }
  const result = await response.json()
  return result.data || []
}
