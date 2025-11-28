import axios from 'axios'
import { GraphNode } from './api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tcm-knowledge-graph.onrender.com/api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    nodes?: GraphNode[]
    highlightNodes?: string[]
    highlightPath?: string[]
    suggestions?: string[]
  }
  error?: boolean
}

export interface AgentResponse {
  content: string
  metadata?: {
    nodes?: GraphNode[]
    highlightNodes?: string[]
    highlightPath?: string[]
    suggestions?: string[]
    confidence?: number
  }
}

/**
 * 与智能体对话
 */
export async function chatWithAgent(
  query: string,
  history: ChatMessage[] = []
): Promise<AgentResponse> {
  try {
    const response = await axios.post<AgentResponse>(
      `${API_BASE_URL}/agent/chat`,
      {
        query,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Agent chat error:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请稍后再试')
      }
      if (error.response?.status === 503) {
        throw new Error('服务暂时不可用，请稍后再试')
      }
    }

    // 降级到本地智能处理
    return handleLocalAgent(query, history)
  }
}

/**
 * 本地智能处理（降级方案）
 */
function handleLocalAgent(query: string, history: ChatMessage[]): AgentResponse {
  const lowerQuery = query.toLowerCase()
  
  // 简单的关键词匹配和响应
  if (lowerQuery.includes('脾虚') || lowerQuery.includes('脾')) {
    return {
      content: '脾虚是中医常见证候，主要症状包括：\n\n• 食欲不振\n• 腹胀便溏\n• 神疲乏力\n• 面色萎黄\n\n在知识图谱中，脾虚与多个疾病和证候相关。我可以帮你在图谱中高亮显示相关节点。',
      metadata: {
        highlightNodes: [],
        suggestions: [
          '显示所有与脾虚相关的节点',
          '查找脾虚的治疗方法',
          '分析脾虚的证候关系'
        ]
      }
    }
  }

  if (lowerQuery.includes('关系') || lowerQuery.includes('相关')) {
    return {
      content: '我可以帮你分析节点之间的关系。请告诉我你想查询哪些节点之间的关系，或者我可以根据你的问题自动查找相关节点。',
      metadata: {
        suggestions: [
          '查找两个节点之间的路径',
          '显示某个节点的所有关系',
          '分析节点间的关联强度'
        ]
      }
    }
  }

  if (lowerQuery.includes('推荐') || lowerQuery.includes('建议')) {
    return {
      content: '基于知识图谱，我可以为你推荐相关内容。请告诉我你的具体需求，比如：\n\n• 想了解某个证候的相关疾病\n• 查找某个疾病的治疗方法\n• 探索知识图谱中的热点节点',
      metadata: {
        suggestions: [
          '推荐热门节点',
          '推荐相关证候',
          '推荐治疗方法'
        ]
      }
    }
  }

  // 默认响应
  return {
    content: `我理解你想了解"${query}"。让我在知识图谱中搜索相关信息...\n\n你可以尝试：\n• 查询具体的证候或疾病名称\n• 询问节点之间的关系\n• 请求推荐相关内容\n• 让我分析图谱结构`,
    metadata: {
      suggestions: [
        '查询证候信息',
        '查找疾病关系',
        '分析图谱结构'
      ]
    }
  }
}

/**
 * 智能推荐节点
 */
export async function recommendNodes(
  context?: string,
  limit: number = 10
): Promise<GraphNode[]> {
  try {
    const response = await axios.post<{ nodes: GraphNode[] }>(
      `${API_BASE_URL}/agent/recommend`,
      { context, limit },
      { timeout: 15000 }
    )
    return response.data.nodes
  } catch (error) {
    console.error('Recommend nodes error:', error)
    return []
  }
}

/**
 * 智能分析图谱
 */
export async function analyzeGraph(
  analysisType: 'structure' | 'clusters' | 'centrality' | 'paths'
): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/agent/analyze`,
      { type: analysisType },
      { timeout: 30000 }
    )
    return response.data
  } catch (error) {
    console.error('Analyze graph error:', error)
    throw error
  }
}

