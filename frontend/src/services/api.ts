// 根据环境变量自动选择API地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')

// 调试信息：在控制台输出API地址（仅在开发环境）
if (import.meta.env.DEV) {
  console.log('🔍 API调试信息:')
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('PROD:', import.meta.env.PROD)
  console.log('最终API地址:', API_BASE_URL)
}

// 在生产环境也输出一次（帮助调试）
if (import.meta.env.PROD && typeof window !== 'undefined') {
  console.log('🌐 生产环境API地址:', API_BASE_URL)
  console.log('环境变量VITE_API_URL:', import.meta.env.VITE_API_URL || '未设置')
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

// 获取统计数据
export const getStats = async (): Promise<StatsData> => {
  const response = await fetch(`${API_BASE_URL}/stats`)
  if (!response.ok) {
    throw new Error('获取统计数据失败')
  }
  const result = await response.json()
  return result.data
}

// 获取根节点
export const getRootNodes = async (): Promise<RootNode[]> => {
  const response = await fetch(`${API_BASE_URL}/nodes/roots`)
  if (!response.ok) {
    throw new Error('获取根节点失败')
  }
  const result = await response.json()
  return result.data
}

// 搜索节点
export const searchNodes = async (
  query: string,
  category?: string,
  limit: number = 10
): Promise<{ data: SearchResult[]; total: number }> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  })
  if (category) {
    params.append('category', category)
  }
  
  const response = await fetch(`${API_BASE_URL}/search?${params}`)
  if (!response.ok) {
    throw new Error('搜索失败')
  }
  const result = await response.json()
  return result
}

// 获取节点详情
export const getNodeDetails = async (code: string): Promise<NodeDetail> => {
  // URL编码处理，确保特殊字符正确传递
  const encodedCode = encodeURIComponent(code)
  const response = await fetch(`${API_BASE_URL}/nodes/${encodedCode}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `获取节点详情失败: ${response.status} ${response.statusText}`)
  }
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '获取节点详情失败')
  }
  return result.data
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

// 获取图谱数据
export const getGraphData = async (
  rootCode?: string,
  depth: number = 2,
  limit: number = 100
): Promise<GraphData> => {
  const params = new URLSearchParams({
    depth: depth.toString(),
    limit: limit.toString()
  })
  if (rootCode) {
    params.append('rootCode', rootCode)
  }
  
  const response = await fetch(`${API_BASE_URL}/graph?${params}`)
  if (!response.ok) {
    throw new Error('获取图谱数据失败')
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '获取图谱数据失败')
  }
  return result.data
}

// 展开节点（获取子图）
export const expandNode = async (
  code: string,
  depth: number = 1,
  limit: number = 50
): Promise<GraphData> => {
  const params = new URLSearchParams({
    depth: depth.toString(),
    limit: limit.toString()
  })
  
  const response = await fetch(`${API_BASE_URL}/graph/expand/${code}?${params}`)
  if (!response.ok) {
    throw new Error('展开节点失败')
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '展开节点失败')
  }
  return result.data
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
  const response = await fetch(`${API_BASE_URL}/analytics/overview`)
  if (!response.ok) {
    throw new Error('获取分析数据失败')
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '获取分析数据失败')
  }
  return result.data
}

// 获取顶层分类统计
export const getTopLevelStats = async (): Promise<TopLevelNode[]> => {
  const response = await fetch(`${API_BASE_URL}/analytics/top-level`)
  if (!response.ok) {
    throw new Error('获取顶层分类统计失败')
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '获取顶层分类统计失败')
  }
  return result.data
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
