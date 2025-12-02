import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Card, Slider, Button, Space, Statistic, Select, Tooltip, Switch, Modal, Descriptions, Progress, Badge } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, InfoCircleOutlined, DownloadOutlined, StepForwardOutlined, StepBackwardOutlined, ZoomInOutlined, ZoomOutOutlined, CompressOutlined, FullscreenOutlined, FullscreenExitOutlined, ArrowLeftOutlined } from '@ant-design/icons'
// 确保 graphlib 和 lodash 在 dagre 之前初始化
import '@/utils/pre-init'
import '@/utils/graphlib-init'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { GraphNode, GraphEdge } from '@/services/api'

cytoscape.use(dagre)

const { Option } = Select

interface TimelineGraphProps {
  data: {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
}

export const TimelineGraph: React.FC<TimelineGraphProps> = ({ data }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cyRef = React.useRef<cytoscape.Core | null>(null)
  const timelineRef = React.useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [maxTime, setMaxTime] = useState(5)
  const [playSpeed, setPlaySpeed] = useState(800) // 毫秒
  const [showAnimation, setShowAnimation] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailNode, setDetailNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set())
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isObservationMode, setIsObservationMode] = useState(false)
  
  // 使用 useRef 来避免闭包问�?
  const currentTimeRef = useRef(currentTime)
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  // 为节点分配时间（改进算法：基于层级和关系�?
  const nodeTimes = useMemo(() => {
    const times: Record<string, number> = {}
    
    // 第一步：根据层级分配基础时间（层级越高，时间越早�?
    data.nodes.forEach((node) => {
      const level = node.level || 1
      times[node.id] = level - 1
    })
    
    // 第二步：根据边的关系，调整时间（子节点必须在父节点之后）
    let changed = true
    let iterations = 0
    while (changed && iterations < 100) {
      changed = false
      data.edges.forEach((edge) => {
        const sourceTime = times[edge.source] ?? 0
        const targetTime = times[edge.target] ?? 0
        
        // 确保目标节点时间 > 源节点时�?
        if (targetTime <= sourceTime) {
          times[edge.target] = sourceTime + 1
          changed = true
        }
      })
      iterations++
    }
    
    // 第三步：按时间分组，计算每个时间点的节点�?
    const timeGroups: Record<number, GraphNode[]> = {}
    Object.entries(times).forEach(([nodeId, time]) => {
      const node = data.nodes.find(n => n.id === nodeId)
      if (node) {
        if (!timeGroups[time]) timeGroups[time] = []
        timeGroups[time].push(node)
      }
    })
    
    const maxT = Math.max(...Object.values(times), 0)
    setMaxTime(maxT)
    
    return { times, timeGroups }
  }, [data.nodes, data.edges])

  const times = nodeTimes.times
  const timeGroups = nodeTimes.timeGroups

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return

    // 初始�?Cytoscape（精美现代化样式�?
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 120,
            'height': 120,
            'shape': 'ellipse', // 圆形
            'background-color': (ele: any) => {
              const category = ele.data('category')
              if (category === '疾病类') {
                return '#42A5F5' // 蓝色
              } else if (category === '证候类') {
                return '#66BB6A' // 绿色
              }
              return '#AB47BC' // 紫色
            },
            'border-width': 4,
            'border-color': (ele: any) => {
              const category = ele.data('category')
              return category === '疾病类' ? '#1976D2' : category === '证候类' ? '#388E3C' : '#7B1FA2'
            },
            'font-size': 16,
            'font-weight': 'bold',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-outline-width': 4,
            'text-outline-color': '#000000',
            'text-background-color': '#000000',
            'text-background-opacity': 0.8,
            'text-background-padding': 8,
            'text-background-shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': 110,
            'text-margin-y': 0,
            'overlay-opacity': 0,
            'shadow-blur': 15,
            'shadow-color': (ele: any) => {
              const category = ele.data('category')
              return category === '疾病类' ? 'rgba(33,150,243,0.5)' : category === '证候类' ? 'rgba(76,175,80,0.5)' : 'rgba(156,39,176,0.5)'
            },
            'shadow-opacity': 1,
            'shadow-offset-x': 0,
            'shadow-offset-y': 4,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 6,
            'border-color': '#FFC107',
            'width': 135,
            'height': 135,
            'shadow-blur': 25,
            'shadow-color': '#FFC107',
            'shadow-opacity': 1,
            'z-index': 999,
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 5,
            'border-color': '#FFC107',
            'width': 130,
            'height': 130,
            'shadow-blur': 20,
            'shadow-color': '#FFC107',
            'shadow-opacity': 0.8,
            'z-index': 998,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 4,
            'line-color': '#90A4AE',
            'target-arrow-color': '#90A4AE',
            'target-arrow-shape': 'triangle-backcurve',
            'target-arrow-size': 10,
            'curve-style': 'bezier',
            'opacity': 0.5,
            'line-style': 'solid',
            'line-cap': 'round',
            'source-endpoint': 'outside-to-node',
            'target-endpoint': 'outside-to-node',
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 6,
            'line-color': '#FFC107',
            'target-arrow-color': '#FFC107',
            'opacity': 1,
            'z-index': 999,
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 5,
            'line-color': '#FFC107',
            'target-arrow-color': '#FFC107',
            'opacity': 1,
            'z-index': 999,
            'line-style': 'solid',
          }
        }
      ],
      layout: {
        name: 'dagre',
        nodeSep: 100,
        edgeSep: 40,
        rankSep: 200, // 减小层级间距，让图形更扁平
        padding: 80,
        animate: true,
        animationDuration: 600,
        animationEasing: 'ease-out',
      } as any, // 添加类型断言解决dagre布局属性类型问题
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.15,
      boxSelectionEnabled: true,
      autounselectify: false,
    })
    
    // 监听缩放变化
    cyRef.current.on('zoom', () => {
      if (cyRef.current) {
        const currentZoom = cyRef.current.zoom()
        setZoomLevel(currentZoom)
      }
    })

    // 添加节点交互事件
    cyRef.current.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id()
      const node = data.nodes.find(n => n.id === nodeId)
      if (node) {
        setDetailNode(node)
        setShowDetailModal(true)
        
        // 高亮相关路径
        const relatedEdges = data.edges.filter(e => 
          e.source === nodeId || e.target === nodeId
        )
        const pathIds = new Set(relatedEdges.map(e => e.id))
        setHighlightedPath(pathIds)
        
        // 更新边的样式
        cyRef.current?.edges().removeClass('highlighted')
        relatedEdges.forEach(edge => {
          const cyEdge = cyRef.current?.$id(edge.id)
          cyEdge?.addClass('highlighted')
        })
      }
    })
    
    cyRef.current.on('mouseover', 'node', (evt) => {
      const nodeId = evt.target.id()
      setHoveredNode(nodeId)
    })
    
    cyRef.current.on('mouseout', 'node', () => {
      setHoveredNode(null)
    })
    
    cyRef.current.on('tap', (evt) => {
      if (evt.target === cyRef.current) {
        cyRef.current?.edges().removeClass('highlighted')
        setHighlightedPath(new Set())
      }
    })

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
      }
    }
  }, [])

  // 更新时间线显�?
  useEffect(() => {
    if (!cyRef.current || !data.nodes.length) return

    // 根据当前时间筛选节点和�?
    const visibleNodeIds = new Set<string>()
    
    data.nodes.forEach((node) => {
      const nodeTime = times[node.id] || 0
      if (nodeTime <= currentTime) {
        visibleNodeIds.add(node.id)
      }
    })
    
    console.log('时间线更�?', { currentTime, maxTime, visibleNodes: visibleNodeIds.size, totalNodes: data.nodes.length })

    const visibleEdges = data.edges.filter((edge) => {
      return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    })

    // 更新图谱
    const currentElements = cyRef.current.elements()
    const currentIds = new Set(currentElements.map(el => el.id()))

    // 移除不可见的元素
    const elementsToRemove: any[] = []
    currentElements.forEach((el) => {
      const isNode = !el.data('source')
      const id = isNode ? el.id() : el.data('id')
      
      if (isNode && !visibleNodeIds.has(id)) {
        elementsToRemove.push(el)
      } else if (!isNode) {
        const edgeId = el.data('id')
        if (!visibleEdges.some(e => e.id === edgeId)) {
          elementsToRemove.push(el)
        }
      }
    })
    
    if (elementsToRemove.length > 0) {
      cyRef.current.remove(elementsToRemove)
    }

    // 添加新可见的元素
    const newNodes = data.nodes
      .filter(node => visibleNodeIds.has(node.id) && !currentIds.has(node.id))
      .map(node => ({
        data: {
          id: node.id,
          label: node.label || node.name || node.code,
          category: node.category,
          level: node.level,
          time: times[node.id]
        }
      }))

    const newEdges = visibleEdges
      .filter(edge => !currentIds.has(edge.id))
      .map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target
        }
      }))

    if (newNodes.length > 0 || newEdges.length > 0) {
      console.log('添加新元�?', { nodes: newNodes.length, edges: newEdges.length })
      cyRef.current.add([...newNodes, ...newEdges])
    }
    
    // 确保所有可见节点都显示
    cyRef.current.nodes().forEach((node: any) => {
      const nodeId = node.id()
      if (visibleNodeIds.has(nodeId)) {
        node.style('display', 'element')
        const currentOpacity = node.style('opacity')
        if (!currentOpacity || currentOpacity === 0) {
          const nodeTime = node.data('time') || 0
          const isCurrentTime = nodeTime === currentTime
          const isPastTime = nodeTime < currentTime
          node.style('opacity', isCurrentTime ? 1 : isPastTime ? 0.95 : 0.2)
        }
      } else {
        node.style('display', 'none')
      }
    })
    
    console.log('当前图谱元素:', { 
      nodes: cyRef.current.nodes().length, 
      edges: cyRef.current.edges().length,
      visibleNodes: cyRef.current.nodes().filter((n: any) => visibleNodeIds.has(n.id())).length
    })

    // 更新节点样式（根据时间，添加高级动画效果�?
    cyRef.current.nodes().forEach((node: any) => {
      const nodeId = node.id()
      const nodeTime = node.data('time') || 0
      const isCurrentTime = nodeTime === currentTime
      const isPastTime = nodeTime < currentTime
      const isFutureTime = nodeTime > currentTime
      
      // 确保节点可见
      node.style('display', 'element')
      
      // 当前时间点的节点：高亮显示，带脉冲效�?
      if (isCurrentTime) {
        const category = node.data('category')
        const borderColor = category === '疾病类' ? '#1976D2' : category === '证候类' ? '#388E3C' : '#7B1FA2'
        
        node.style({
          opacity: 1,
          'border-width': 6,
          'border-color': borderColor,
          'width': 135,
          'height': 135,
          'z-index': 999,
        })
        if (showAnimation) {
          // 添加脉冲动画
          node.animate({
            style: {
              'border-width': 10,
              'width': 140,
              'height': 140,
            }
          }, {
            duration: 800,
            easing: 'ease-in-out',
            complete: () => {
              node.animate({
                style: {
                  'border-width': 6,
                  'width': 135,
                  'height': 135,
                }
              }, {
                duration: 800,
                easing: 'ease-in-out',
              })
            }
          })
        }
      } else if (isPastTime) {
        // 过去时间点的节点：正常显�?
        node.style({
          opacity: 0.95,
          'border-width': 4,
          'width': 120,
          'height': 120,
        })
      } else {
        // 未来时间点的节点：半透明
        node.style({
          opacity: 0.2,
          'border-width': 2,
          'width': 100,
          'height': 100,
        })
      }
    })

    // 更新边样式（根据时间和高亮状态）
    cyRef.current.edges().forEach((edge: any) => {
      const edgeId = edge.id()
      const sourceTime = times[edge.source()?.id()] || 0
      const targetTime = times[edge.target()?.id()] || 0
      const maxTime = Math.max(sourceTime, targetTime)
      const isHighlighted = highlightedPath.has(edgeId)
      
      if (isHighlighted) {
        edge.style({
          opacity: 1,
          'width': 5,
          'line-color': '#FFC107',
          'target-arrow-color': '#FFC107',
        })
      } else {
        const targetOpacity = maxTime <= currentTime ? 0.6 : 0.1
        edge.style({
          opacity: targetOpacity,
          'width': maxTime <= currentTime ? 4 : 2,
        })
      }
    })

    // 运行布局算法（优化版，平放布局�?
    const layout = cyRef.current.layout({
      name: 'dagre',
      rankDir: 'TB', // 改为上下布局（平放）
      nodeSep: 100,
      edgeSep: 40,
      rankSep: 200, // 减小层级间距，让图形更扁�?
      padding: 80,
      animate: showAnimation,
      animationDuration: showAnimation ? 600 : 0,
      animationEasing: 'ease-out',
    })
    
    layout.one('layoutstop', () => {
      cyRef.current?.fit(undefined, 80)
      // 确保所有节点都可见
      cyRef.current?.nodes().forEach((n: any) => {
        const currentOpacity = n.style('opacity')
        if (currentOpacity === 0 || currentOpacity === undefined) {
          const nodeTime = n.data('time') || 0
          const isCurrentTime = nodeTime === currentTime
          const isPastTime = nodeTime < currentTime
          const targetOpacity = isCurrentTime ? 1 : isPastTime ? 0.95 : 0.2
          
          if (showAnimation) {
            n.style('opacity', 0)
            n.animate({
              style: { opacity: targetOpacity }
            }, {
              duration: 400,
              easing: 'ease-out'
            })
          } else {
            n.style('opacity', targetOpacity)
          }
        }
      })
    })
    
    layout.run()
  }, [currentTime, data, times, showAnimation, highlightedPath])

  // 自动播放（改进版�?
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= maxTime) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, playSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, maxTime, playSpeed])
  
  // 键盘快捷�?
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      } else if (e.key === 'ArrowRight' && currentTimeRef.current < maxTime) {
        setCurrentTime(currentTimeRef.current + 1)
      } else if (e.key === 'ArrowLeft' && currentTimeRef.current > 0) {
        setCurrentTime(currentTimeRef.current - 1)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, maxTime])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentTime(0)
    setIsPlaying(false)
    setHighlightedPath(new Set())
    cyRef.current?.edges().removeClass('highlighted')
  }
  
  const handleStepForward = () => {
    if (currentTime < maxTime) {
      setCurrentTime(currentTime + 1)
    }
  }
  
  const handleStepBackward = () => {
    if (currentTime > 0) {
      setCurrentTime(currentTime - 1)
    }
  }
  
  const handleZoomIn = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom()
      const newZoom = Math.min(3, currentZoom * 1.2)
      cyRef.current.animate({
        zoom: newZoom
      }, {
        duration: 300
      })
      setZoomLevel(newZoom)
    }
  }
  
  const handleZoomOut = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom()
      const newZoom = Math.max(0.1, currentZoom / 1.2)
      cyRef.current.animate({
        zoom: newZoom
      }, {
        duration: 300
      })
      setZoomLevel(newZoom)
    }
  }
  
  const handleZoomReset = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        zoom: 1,
        center: cyRef.current.center()
      }, {
        duration: 300
      })
      setZoomLevel(1)
    }
  }
  
  const handleZoomSliderChange = (value: number) => {
    if (cyRef.current) {
      const newZoom = value / 100 // 将百分比转换为缩放�?
      cyRef.current.zoom(newZoom)
      setZoomLevel(newZoom)
    }
  }

  // 计算当前时间点的统计信息
  const currentStats = useMemo(() => {
    const currentNodes = data.nodes.filter(node => (times[node.id] || 0) <= currentTime)
    const currentEdges = data.edges.filter(edge => {
      const sourceTime = times[edge.source] || 0
      const targetTime = times[edge.target] || 0
      return sourceTime <= currentTime && targetTime <= currentTime
    })
    const thisTimeNodes = timeGroups[currentTime] || []
    
    return {
      total: currentNodes.length,
      edges: currentEdges.length,
      thisTime: thisTimeNodes.length
    }
  }, [currentTime, data, times, timeGroups])

  // 生成时间轴标�?
  const timelineMarks = useMemo(() => {
    const marks: Record<number, string> = { 0: '起点' }
    if (maxTime > 0) {
      marks[maxTime] = '终点'
      if (maxTime >= 2) {
        const mid = Math.floor(maxTime / 2)
        marks[mid] = '中点'
      }
      // 添加更多标记�?
      for (let i = 1; i < maxTime; i++) {
        if (i % Math.ceil(maxTime / 4) === 0 && !marks[i]) {
          marks[i] = `T${i}`
        }
      }
    }
    return marks
  }, [maxTime])

  // 监听观察模式变化，调整容器大�?
  useEffect(() => {
    if (isObservationMode && cyRef.current) {
      // 延迟一下，确保DOM更新完成
      const timer = setTimeout(() => {
        if (cyRef.current && containerRef.current) {
          cyRef.current.resize()
          cyRef.current.fit(undefined, 50)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isObservationMode])

  // 观察模式：全屏显�?
  if (isObservationMode) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 返回按钮 */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10000,
        }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              setIsObservationMode(false)
              // 退出观察模式后重新调整大小
              setTimeout(() => {
                if (cyRef.current) {
                  cyRef.current.resize()
                  cyRef.current.fit(undefined, 80)
                }
              }, 100)
            }}
            style={{
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              background: '#1890ff',
              border: 'none'
            }}
          >
            返回
          </Button>
        </div>
        
        {/* 观察模式下的简化控制栏（右上角�?*/}
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10000,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          maxWidth: '60%'
        }}>
          <Button
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handlePlayPause}
            title={isPlaying ? '暂停' : '播放'}
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <Button
            icon={<StepBackwardOutlined />}
            onClick={handleStepBackward}
            disabled={currentTime === 0}
            title="上一步"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <Button
            icon={<StepForwardOutlined />}
            onClick={handleStepForward}
            disabled={currentTime >= maxTime}
            title="下一步"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <Button
            icon={<ZoomOutOutlined />}
            onClick={handleZoomOut}
            title="缩小"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <Button
            icon={<ZoomInOutlined />}
            onClick={handleZoomIn}
            title="放大"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <Button
            icon={<CompressOutlined />}
            onClick={handleZoomReset}
            title="重置缩放"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '6px',
            fontSize: 13,
            fontWeight: 'bold',
            color: '#1890ff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            时间点: {currentTime} / {maxTime} | 缩放: {Math.round(zoomLevel * 100)}%
          </div>
        </div>
        
        {/* 全屏图谱容器 - 确保使用同一个容器引�?*/}
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            overflow: 'hidden',
            position: 'relative'
          }} 
        />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5', padding: '12px' }}>
      {/* 控制面板（现代化设计�?*/}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 12,
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 播放控制 */}
          <Space wrap>
            <Button
              type="primary"
              size="large"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handlePlayPause}
              style={{ 
                height: '40px',
                borderRadius: '8px'
              }}
            >
              {isPlaying ? '暂停' : '播放'}
            </Button>
            <Button 
              icon={<StepBackwardOutlined />} 
              onClick={handleStepBackward}
              disabled={currentTime === 0}
            >
              上一�?
            </Button>
            <Button 
              icon={<StepForwardOutlined />} 
              onClick={handleStepForward}
              disabled={currentTime >= maxTime}
            >
              下一�?
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <Button 
              type="default"
              icon={<DownloadOutlined />} 
              onClick={() => {
                if (cyRef.current) {
                  const png = cyRef.current.png({ 
                    output: 'blob',
                    full: true,
                    bg: 'white'
                  })
                  const url = URL.createObjectURL(png)
                  const link = document.createElement('a')
                  link.download = `timeline-graph-${Date.now()}.png`
                  link.href = url
                  link.click()
                  URL.revokeObjectURL(url)
                }
              }}
            >
              导出图片
            </Button>
            <Button 
              type="default"
              icon={<FullscreenOutlined />} 
              onClick={() => setIsObservationMode(true)}
              title="进入观察模式"
            >
              观察模式
            </Button>
            <div style={{ marginLeft: 16 }}>
              <label style={{ marginRight: 8 }}>播放速度:</label>
              <Slider
                min={200}
                max={2000}
                step={100}
                value={playSpeed}
                onChange={setPlaySpeed}
                style={{ width: 150, display: 'inline-block' }}
                tooltip={{ formatter: (value) => `${value}ms` }}
              />
            </div>
            <Space>
              <label>显示动画:</label>
              <Switch checked={showAnimation} onChange={setShowAnimation} />
            </Space>
            {/* 缩放控制 */}
            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid #e0e0e0', paddingLeft: 16 }}>
              <span style={{ fontSize: 12, color: '#666' }}>缩放:</span>
              <Button 
                size="small" 
                icon={<ZoomOutOutlined />} 
                onClick={handleZoomOut}
                title="缩小"
              />
              <Slider
                min={10}
                max={300}
                step={10}
                value={zoomLevel * 100}
                onChange={handleZoomSliderChange}
                style={{ width: 120 }}
                tooltip={{ formatter: (value) => `${value}%` }}
              />
              <Button 
                size="small" 
                icon={<ZoomInOutlined />} 
                onClick={handleZoomIn}
                title="放大"
              />
              <Button 
                size="small" 
                icon={<CompressOutlined />} 
                onClick={handleZoomReset}
                title="重置缩放"
              />
              <span style={{ fontSize: 12, color: '#666', minWidth: 45, textAlign: 'right' }}>
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </Space>
          
          {/* 时间轴滑块（增强版） */}
          <div style={{ padding: '0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#666' }}>时间轴控制</span>
              <Badge count={currentTime + 1} showZero style={{ backgroundColor: '#1890ff' }}>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: '#1890ff' }}>
                  时间点: {currentTime} / {maxTime}
                </span>
              </Badge>
            </div>
            <Slider
              min={0}
              max={maxTime}
              value={currentTime}
              onChange={setCurrentTime}
              marks={timelineMarks}
              tooltip={{ formatter: (value) => `时间点: ${value}` }}
              style={{ width: '100%' }}
            />
            <Progress 
              percent={maxTime > 0 ? Math.round((currentTime / maxTime) * 100) : 0} 
              showInfo={false}
              strokeColor={{
                '0%': '#42A5F5',
                '100%': '#66BB6A',
              }}
              style={{ marginTop: 8 }}
            />
          </div>
          
          {/* 缁熻淇℃伅锛堝崱鐗囧紡锛?*/}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            padding: '12px',
            background: '#fafafa',
            borderRadius: '8px'
          }}>
            <Card size="small" style={{ textAlign: 'center', background: 'white' }}>
              <Statistic 
                title="累计节点" 
                value={currentStats.total} 
                valueStyle={{ fontSize: 20, color: '#42A5F5', fontWeight: 'bold' }}
              />
            </Card>
            <Card size="small" style={{ textAlign: 'center', background: 'white' }}>
              <Statistic 
                title="累计边数" 
                value={currentStats.edges} 
                valueStyle={{ fontSize: 20, color: '#66BB6A', fontWeight: 'bold' }}
              />
            </Card>
            <Card size="small" style={{ textAlign: 'center', background: 'white' }}>
              <Statistic 
                title={`时间�?${currentTime} 新增`} 
                value={currentStats.thisTime} 
                valueStyle={{ fontSize: 20, color: '#FF9800', fontWeight: 'bold' }}
              />
            </Card>
            {timeGroups[currentTime] && timeGroups[currentTime].length > 0 && (
              <Card size="small" style={{ textAlign: 'center', background: 'white' }}>
                <Tooltip title={timeGroups[currentTime].map(n => n.label || n.name || n.code).join(', ')}>
                  <Button 
                    type="link" 
                    icon={<InfoCircleOutlined />}
                    style={{ width: '100%' }}
                  >
                    查看节点列表
                  </Button>
                </Tooltip>
              </Card>
            )}
          </div>
        </Space>
      </Card>

      {/* 图谱容器（现代化背景�?*/}
      <div 
        ref={containerRef} 
        style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '2px solid rgba(255,255,255,0.8)',
          borderRadius: '12px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          position: 'relative'
        }} 
      />
      
      {/* 节点详情模态框 */}
      <Modal
        title="节点详情"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {detailNode && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="节点名称" span={2}>
              {detailNode.label || detailNode.name || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="代码">{detailNode.code}</Descriptions.Item>
            <Descriptions.Item label="类别">{detailNode.category || '未知'}</Descriptions.Item>
            <Descriptions.Item label="层级">{detailNode.level || '未知'}</Descriptions.Item>
            <Descriptions.Item label="时间点">{(times[detailNode.id] || 0)}</Descriptions.Item>
            <Descriptions.Item label="关联边数">
              {data.edges.filter(e => e.source === detailNode.id || e.target === detailNode.id).length}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
