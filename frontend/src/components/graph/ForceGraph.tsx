import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import * as d3 from 'd3'
import { GraphNode, GraphEdge } from '@/services/api'

export interface ForceGraphRef {
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fit: () => void
  exportPNG: (filename?: string) => void
  highlightPath: (nodeIds: string[]) => void
  clearHighlight: () => void
}

interface ForceGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onNodeDoubleClick?: (node: GraphNode) => void
  onNodeHover?: (node: GraphNode | null) => void
  style?: React.CSSProperties
  searchQuery?: string
  categoryFilter?: string
  levelFilter?: number
  codePrefixFilter?: string
  width?: number
  height?: number
}

const ForceGraph = forwardRef<ForceGraphRef, ForceGraphProps>(({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  style = { width: '100%', height: '600px' },
  searchQuery = '',
  categoryFilter,
  levelFilter,
  codePrefixFilter = '',
  width,
  height
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity)
  const highlightedNodesRef = useRef<Set<string>>(new Set())

  // 节点颜色映射
  const getNodeColor = (category: string) => {
    if (category === '疾病类') return '#68BDF6'
    if (category === '证候类') return '#6DCE9E'
    return '#FF756E'
  }

  // 节点大小映射
  const getNodeSize = (level: number) => {
    if (level === 1) return 12
    if (level === 2) return 10
    if (level === 3) return 8
    return 6
  }

  // 初始化D3力导向图
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerWidth = width || container.clientWidth || 800
    const containerHeight = height || container.clientHeight || 600

    // 创建SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .style('background', '#1a1a1a')
      .style('border-radius', '8px')

    svgRef.current = svg.node()

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)
    zoomRef.current = zoom

    // 创建主组
    const g = svg.append('g')

    // 创建箭头标记
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#A5ABB6')

    // 创建工具提示
    const tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#fff')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)
      .style('backdrop-filter', 'blur(8px)')
      .style('border', '1px solid rgba(255, 255, 255, 0.2)')

    // 更新函数
    const updateGraph = () => {
      // 筛选节点
      let filteredNodes = [...nodes]
      if (categoryFilter) {
        filteredNodes = filteredNodes.filter(n => n.category === categoryFilter)
      }
      if (levelFilter !== undefined) {
        filteredNodes = filteredNodes.filter(n => n.level === levelFilter)
      }
      if (codePrefixFilter) {
        filteredNodes = filteredNodes.filter(n => n.code.startsWith(codePrefixFilter))
      }

      // 筛选边
      const nodeIds = new Set(filteredNodes.map(n => n.id))
      const filteredEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))

      // 清除现有内容
      g.selectAll('*').remove()

      // 创建边
      const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(filteredEdges)
        .enter().append('line')
        .attr('stroke', (d) => {
          const sourceNode = filteredNodes.find(n => n.id === d.source)
          const targetNode = filteredNodes.find(n => n.id === d.target)
          if (sourceNode?.category === '疾病类' && targetNode?.category === '疾病类') return '#68BDF6'
          if (sourceNode?.category === '证候类' && targetNode?.category === '证候类') return '#6DCE9E'
          return '#FFD700'
        })
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', 'url(#arrow)')

      // 创建节点
      const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(filteredNodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(d3.drag<SVGGElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))

      // 添加节点圆圈
      node.append('circle')
        .attr('r', (d) => getNodeSize(d.level))
        .attr('fill', (d) => getNodeColor(d.category))
        .attr('stroke', (d) => highlightedNodesRef.current.has(d.id) ? '#FFD700' : 'transparent')
        .attr('stroke-width', (d) => highlightedNodesRef.current.has(d.id) ? 3 : 0)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('r', getNodeSize(d.level) * 1.5)
            .attr('stroke', '#FFD700')
            .attr('stroke-width', 2)

          tooltip.transition().duration(200).style('opacity', 1)
          tooltip.html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${d.name || d.code}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7);">代码: ${d.code}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7);">类别: ${d.category}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7);">层级: L${d.level}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')

          if (onNodeHover) onNodeHover(d)
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .attr('r', getNodeSize(d.level))
            .attr('stroke', highlightedNodesRef.current.has(d.id) ? '#FFD700' : 'transparent')
            .attr('stroke-width', highlightedNodesRef.current.has(d.id) ? 3 : 0)

          tooltip.transition().duration(200).style('opacity', 0)
          if (onNodeHover) onNodeHover(null)
        })
        .on('click', function(event, d) {
          event.stopPropagation()
          if (onNodeClick) onNodeClick(d)
        })
        .on('dblclick', function(event, d) {
          event.stopPropagation()
          if (onNodeDoubleClick) onNodeDoubleClick(d)
        })

      // 添加节点标签
      node.append('text')
        .text((d) => d.name || d.code)
        .attr('dx', (d) => getNodeSize(d.level) + 5)
        .attr('dy', 4)
        .attr('font-size', '11px')
        .attr('fill', '#ffffff')
        .attr('font-weight', '600')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)')

      // 高亮搜索匹配的节点
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        node.select('circle')
          .attr('stroke', (d) => {
            const matches = d.code.toLowerCase().includes(query) ||
              (d.name && d.name.toLowerCase().includes(query))
            return matches ? '#FFD700' : 'transparent'
          })
          .attr('stroke-width', (d) => {
            const matches = d.code.toLowerCase().includes(query) ||
              (d.name && d.name.toLowerCase().includes(query))
            return matches ? 3 : 0
          })
      }

      // 创建力导向模拟
      simulationRef.current = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
        .force('link', d3.forceLink(filteredEdges).id((d: any) => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2))
        .force('collision', d3.forceCollide().radius((d: any) => getNodeSize(d.level) + 5))

      // 更新位置
      simulationRef.current.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      })
    }

    // 拖拽函数
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // 初始更新
    updateGraph()

    // 暴露方法
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (zoomRef.current && svgRef.current) {
          transformRef.current = transformRef.current.scale(1.2)
          d3.select(svgRef.current).call(zoomRef.current.transform, transformRef.current)
        }
      },
      zoomOut: () => {
        if (zoomRef.current && svgRef.current) {
          transformRef.current = transformRef.current.scale(0.8)
          d3.select(svgRef.current).call(zoomRef.current.transform, transformRef.current)
        }
      },
      resetZoom: () => {
        if (zoomRef.current && svgRef.current) {
          transformRef.current = d3.zoomIdentity
          d3.select(svgRef.current).call(zoomRef.current.transform, transformRef.current)
        }
      },
      fit: () => {
        if (svgRef.current) {
          const gElement = d3.select(svgRef.current).select('g')
          if (gElement.node()) {
            const bounds = (gElement.node() as SVGGElement).getBBox()
            const fullWidth = containerWidth
            const fullHeight = containerHeight
            const width = bounds.width
            const height = bounds.height
            const midX = bounds.x + width / 2
            const midY = bounds.y + height / 2
            const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight)
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY]

            transformRef.current = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            d3.select(svgRef.current).call(zoomRef.current!.transform, transformRef.current)
          }
        }
      },
      exportPNG: (filename = 'graph.png') => {
        if (svgRef.current) {
          const svgData = new XMLSerializer().serializeToString(svgRef.current)
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.download = filename
                link.href = url
                link.click()
                URL.revokeObjectURL(url)
              }
            })
          }
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
        }
      },
      highlightPath: (nodeIds: string[]) => {
        highlightedNodesRef.current = new Set(nodeIds)
        updateGraph()
      },
      clearHighlight: () => {
        highlightedNodesRef.current.clear()
        updateGraph()
      }
    }), [nodes, edges, searchQuery, categoryFilter, levelFilter, codePrefixFilter])

    // 响应数据变化
    updateGraph()

    // 清理
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
      tooltip.remove()
      d3.select(container).selectAll('svg').remove()
    }
  }, [nodes, edges, searchQuery, categoryFilter, levelFilter, codePrefixFilter, width, height, onNodeClick, onNodeDoubleClick, onNodeHover])

  return (
    <div
      ref={containerRef}
      style={{
        width: style.width || '100%',
        height: style.height || '600px',
        ...style
      }}
    />
  )
})

ForceGraph.displayName = 'ForceGraph'

export default ForceGraph

