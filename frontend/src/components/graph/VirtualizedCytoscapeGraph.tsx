import React, { useEffect, useRef, useMemo } from 'react'
import cytoscape from 'cytoscape'
// 确保 graphlib 和 lodash 在 dagre 之前初始化
import '@/utils/pre-init'
import '@/utils/graphlib-init'
// graphlib 已在 main.tsx 中初始化
import dagre from 'cytoscape-dagre'
import { GraphNode, GraphEdge } from '@/services/api'

// 注册dagre布局
cytoscape.use(dagre)

interface VirtualizedCytoscapeGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onNodeDoubleClick?: (node: GraphNode) => void
  layout?: 'dagre' | 'breadthfirst' | 'grid' | 'circle'
  style?: React.CSSProperties
  searchQuery?: string
  categoryFilter?: string
  levelFilter?: number
  codePrefixFilter?: string
  // 虚拟渲染配置
  virtualRenderThreshold?: number // 超过此数量启用虚拟渲染
  visibleRange?: number // 可见范围（节点数量）
}

/**
 * 虚拟渲染优化的Cytoscape图谱组件
 * 当节点数量超过阈值时，只渲染可见区域的节点
 */
const VirtualizedCytoscapeGraph: React.FC<VirtualizedCytoscapeGraphProps> = ({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  layout = 'dagre',
  style = { width: '100%', height: '600px' },
  searchQuery = '',
  categoryFilter,
  levelFilter,
  codePrefixFilter = '',
  virtualRenderThreshold = 200,
  visibleRange = 150
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  // 判断是否需要虚拟渲染
  const needsVirtualization = nodes.length > virtualRenderThreshold

  // 虚拟渲染：只显示部分节点
  const visibleNodes = useMemo(() => {
    if (!needsVirtualization) {
      return nodes
    }

    // 根据搜索和筛选条件优先显示匹配的节点
    let filtered = nodes

    // 应用筛选
    if (categoryFilter) {
      filtered = filtered.filter(n => n.category === categoryFilter)
    }
    if (levelFilter !== undefined) {
      filtered = filtered.filter(n => n.level === levelFilter)
    }
    if (codePrefixFilter) {
      filtered = filtered.filter(n => n.code.startsWith(codePrefixFilter))
    }

    // 如果有搜索词，优先显示匹配的节点
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matched = filtered.filter(n => 
        (n.name || '').toLowerCase().includes(query) ||
        n.code.toLowerCase().includes(query)
      )
      const unmatched = filtered.filter(n => 
        !(n.name || '').toLowerCase().includes(query) &&
        !n.code.toLowerCase().includes(query)
      )
      // 返回匹配的节点 + 部分未匹配的节点
      return [...matched, ...unmatched.slice(0, visibleRange - matched.length)]
    }

    // 没有搜索词时，返回前N个节点
    return filtered.slice(0, visibleRange)
  }, [nodes, searchQuery, categoryFilter, levelFilter, codePrefixFilter, needsVirtualization, visibleRange])

  // 计算可见节点对应的边
  const visibleEdges = useMemo(() => {
    if (!needsVirtualization) {
      return edges
    }

    const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
    return edges.filter(e => 
      visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    )
  }, [edges, visibleNodes, needsVirtualization])

  // 初始化Cytoscape
  useEffect(() => {
    if (!containerRef.current) return

    try {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [],
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'width': 'data(width)',
              'height': 'data(height)',
              'background-color': (ele: any) => {
              const category = ele.data('category')
              if (category === '疾病类') {
                return '#68BDF6'  // Neo4j蓝色
              } else if (category === '证候类') {
                return '#6DCE9E'  // Neo4j绿色
              } else {
                return '#FF756E'  // Neo4j红色
              }
            },
              'border-width': 0,
              'border-color': 'transparent',
              'color': '#FFFFFF',  // Neo4j白色文字
              'text-outline-width': 1,
              'text-outline-color': '#000000',
              'font-size': 'data(fontSize)',
              'text-valign': 'center',
              'text-halign': 'center',
              'shape': 'ellipse'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 1.5,
              'line-color': '#A5ABB6',  // Neo4j淡灰色边
              'target-arrow-color': '#A5ABB6',
              'target-arrow-shape': 'triangle',
              'target-arrow-size': 4,
              'curve-style': 'bezier',
              'opacity': 0.6
            }
          },
          {
            selector: 'edge:hover',
            style: {
              'line-color': '#FFD700',
              'target-arrow-color': '#FFD700',
              'width': 2,
              'opacity': 1
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 3,
              'border-color': '#FFD700'  // Neo4j选中时的金色边框
            }
          },
          {
            selector: 'node:hover',
            style: {
              'border-width': 2,
              'border-color': '#FFD700'
            }
          }
        ],
        minZoom: 0.1,
        maxZoom: 2,
        wheelSensitivity: 0.15,
        userZoomingEnabled: true,
        userPanningEnabled: true
      })
    } catch (err) {
      console.error('Cytoscape初始化失败:', err)
      return
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [])

  // 更新图谱数据
  useEffect(() => {
    if (!cyRef.current) return

    const elements: any[] = []

    // 添加可见节点 - Neo4j风格
    // 注意：Cytoscape 要求 id 必须是字符串类型
    visibleNodes.forEach(node => {
      const level = node.level || 1
      const size = level === 1 ? 60 : level === 2 ? 50 : level === 3 ? 45 : 40
      const bgColor = node.category === '疾病类' ? '#68BDF6' : node.category === '证候类' ? '#6DCE9E' : '#FF756E'

      elements.push({
        data: {
          id: String(node.id),
          label: node.name || node.code,
          code: node.code,
          category: node.category,
          level: level,
          width: size,
          height: size,
          bgColor: bgColor,
          fontSize: 12
        }
      })
    })

    // 添加可见边
    // 注意：Cytoscape 要求 id、source、target 必须是字符串类型
    visibleEdges.forEach(edge => {
      elements.push({
        data: {
          id: String(edge.id),
          source: String(edge.source),
          target: String(edge.target)
        }
      })
    })

    // 更新图谱
    cyRef.current.json({ elements })

    // 应用布局
    const layoutConfig: any = {
      name: layout,
      animate: true,
      animationDuration: 700,
      animationEasing: 'ease-out'
    }

    if (layout === 'dagre') {
      layoutConfig.rankDir = 'TB'
      layoutConfig.nodeSep = 50
      layoutConfig.rankSep = 100
    }

    const layoutInstance = cyRef.current.layout(layoutConfig)
    layoutInstance.run()

    // 节点点击事件
    if (onNodeClick) {
      cyRef.current.off('tap', 'node')
      cyRef.current.on('tap', 'node', (evt: any) => {
        const nodeData = evt.target.data()
        const node = visibleNodes.find(n => n.id === nodeData.id)
        if (node) {
          onNodeClick(node)
        }
      })
    }

    // 节点双击事件
    if (onNodeDoubleClick) {
      cyRef.current.off('dbltap', 'node')
      cyRef.current.on('dbltap', 'node', (evt: any) => {
        const nodeData = evt.target.data()
        const node = visibleNodes.find(n => n.id === nodeData.id)
        if (node) {
          onNodeDoubleClick(node)
        }
      })
    }

    // 显示虚拟渲染提示
    if (needsVirtualization) {
      console.log(`虚拟渲染: 显示 ${visibleNodes.length}/${nodes.length} 个节点`)
    }
  }, [visibleNodes, visibleEdges, layout, onNodeClick, onNodeDoubleClick, needsVirtualization, nodes.length])

  return (
    <div 
      ref={containerRef} 
      style={{
        ...style,
        width: style?.width || '100%',
        height: style?.height || '600px',
        minHeight: '400px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#2B2B2B',  // Neo4j深色背景
        position: 'relative'
      }} 
    >
      {needsVirtualization && (
        <div className="absolute top-2 right-2 bg-yellow-100 px-2 py-1 rounded text-xs">
          虚拟渲染: {visibleNodes.length}/{nodes.length} 节点
        </div>
      )}
    </div>
  )
}

export default VirtualizedCytoscapeGraph

