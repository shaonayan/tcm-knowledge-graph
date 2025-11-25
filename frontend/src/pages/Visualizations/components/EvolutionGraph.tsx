import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, Slider, Button, Space, Select, Statistic, Switch, Tooltip, Modal, Descriptions } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { GraphNode, GraphEdge } from '@/services/api'

cytoscape.use(dagre)

const { Option } = Select

interface EvolutionGraphProps {
  data: {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
}

export const EvolutionGraph: React.FC<EvolutionGraphProps> = ({ data }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cyRef = React.useRef<cytoscape.Core | null>(null)
  const [evolutionStep, setEvolutionStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [evolutionSpeed, setEvolutionSpeed] = useState(500) // 毫秒
  const [mode, setMode] = useState<'progressive' | 'hierarchical' | 'individual'>('progressive')
  const [animationEnabled, setAnimationEnabled] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailNode, setDetailNode] = useState<GraphNode | null>(null)

  // 计算演化步骤（渐进式添加节点）
  const evolutionSteps = React.useMemo(() => {
    if (mode === 'progressive') {
      // 渐进式：按层级逐步添加（每个步骤包含当前层级的节点和新产生的边）
      const steps: Array<{ nodes: GraphNode[], edges: GraphEdge[] }> = []
      const levels = new Map<number, GraphNode[]>()
      
      data.nodes.forEach(node => {
        const level = node.level || 1
        if (!levels.has(level)) {
          levels.set(level, [])
        }
        levels.get(level)!.push(node)
      })
      
      const sortedLevels = Array.from(levels.keys()).sort()
      const addedNodeIds = new Set<string>()
      const addedEdgeIds = new Set<string>()
      
      sortedLevels.forEach((level) => {
        const levelNodes = levels.get(level) || []
        const stepNodes: GraphNode[] = []
        const stepEdges: GraphEdge[] = []
        
        // 添加当前层级的节点
        levelNodes.forEach(node => {
          stepNodes.push(node)
          addedNodeIds.add(node.id)
        })
        
        // 添加连接到已添加节点的边（只添加新边）
        data.edges.forEach(edge => {
          if (addedNodeIds.has(edge.source) && 
              addedNodeIds.has(edge.target) && 
              !addedEdgeIds.has(edge.id)) {
            stepEdges.push(edge)
            addedEdgeIds.add(edge.id)
          }
        })
        
        steps.push({ nodes: [...stepNodes], edges: [...stepEdges] })
      })
      
      return steps
    } else if (mode === 'individual') {
      // 单独式：每个节点单独一个步骤（最详细的演化）
      const steps: Array<{ nodes: GraphNode[], edges: GraphEdge[] }> = []
      const addedNodeIds = new Set<string>()
      const addedEdgeIds = new Set<string>()
      
      // 按层级排序节点
      const sortedNodes = [...data.nodes].sort((a, b) => (a.level || 1) - (b.level || 1))
      
      sortedNodes.forEach((node) => {
        addedNodeIds.add(node.id)
        
        // 添加连接到已添加节点的边
        const newEdges = data.edges.filter(edge => {
          if (addedEdgeIds.has(edge.id)) return false
          if (addedNodeIds.has(edge.source) && addedNodeIds.has(edge.target)) {
            addedEdgeIds.add(edge.id)
            return true
          }
          return false
        })
        
        steps.push({ 
          nodes: [node], 
          edges: newEdges 
        })
      })
      
      return steps
    } else {
      // 层级式：每次显示一个层级
      const steps: Array<{ nodes: GraphNode[], edges: GraphEdge[] }> = []
      const maxLevel = Math.max(...data.nodes.map(n => n.level || 1))
      const accumulatedNodeIds = new Set<string>()
      
      for (let level = 1; level <= maxLevel; level++) {
        const levelNodes = data.nodes.filter(n => (n.level || 1) === level)
        levelNodes.forEach(n => accumulatedNodeIds.add(n.id))
        
        const levelEdges = data.edges.filter(e => 
          accumulatedNodeIds.has(e.source) && accumulatedNodeIds.has(e.target)
        )
        steps.push({ nodes: levelNodes, edges: levelEdges })
      }
      
      return steps
    }
  }, [data, mode])

  const maxSteps = evolutionSteps.length - 1

  useEffect(() => {
    if (!containerRef.current) return

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 80,
            'height': 80,
            'shape': 'ellipse',
            'background-color': (ele: any) => {
              const category = ele.data('category')
              return category === '疾病类' ? '#E3F2FD' : category === '证候类' ? '#E8F5E9' : '#F3E5F5'
            },
            'border-width': 2,
            'border-color': (ele: any) => {
              const category = ele.data('category')
              return category === '疾病类' ? '#2196F3' : category === '证候类' ? '#4CAF50' : '#9C27B0'
            },
            'font-size': 12,
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'opacity': 0
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#757575',
            'target-arrow-color': '#757575',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0
          }
        }
      ],
      layout: {
        name: 'dagre',
        nodeSep: 50,
        edgeSep: 50,
        rankSep: 100,
      }
    })

    // 添加节点点击事件
    cyRef.current.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id()
      const node = data.nodes.find(n => n.id === nodeId)
      if (node) {
        setDetailNode(node)
        setShowDetailModal(true)
      }
    })

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
      }
    }
  }, [])

  // 更新演化步骤
  useEffect(() => {
    if (!cyRef.current || evolutionSteps.length === 0) return

    // 累积步骤：显示从步骤0到当前步骤的所有节点和边
    const cumulativeNodes = new Map<string, GraphNode>()
    const cumulativeEdges = new Map<string, GraphEdge>()
    
    // 累积到当前步骤的所有节点和边
    for (let i = 0; i <= Math.min(evolutionStep, maxSteps); i++) {
      const step = evolutionSteps[i]
      if (!step) continue
      
      step.nodes.forEach(node => {
        cumulativeNodes.set(node.id, node)
      })
      step.edges.forEach(edge => {
        cumulativeEdges.set(edge.id, edge)
      })
    }

    const currentElements = cyRef.current.elements()
    const currentNodeIds = new Set(
      currentElements.filter(el => !el.data('source')).map(el => el.id())
    )
    const currentEdgeIds = new Set(
      currentElements.filter(el => el.data('source')).map(el => el.data('id'))
    )

    // 移除不应该存在的节点和边
    currentElements.forEach((el) => {
      const isNode = !el.data('source')
      const id = isNode ? el.id() : el.data('id')
      
      if (isNode && !cumulativeNodes.has(id)) {
        el.remove()
      } else if (!isNode && !cumulativeEdges.has(id)) {
        el.remove()
      }
    })

    // 添加新节点（带动画）
    const nodesToAdd = Array.from(cumulativeNodes.values()).filter(
      node => !currentNodeIds.has(node.id)
    )
    
    nodesToAdd.forEach((node, index) => {
      const nodeElement = cyRef.current!.add({
        data: {
          id: node.id,
          label: node.label || node.name || node.code,
          category: node.category,
          level: node.level
        },
        classes: 'new-node'
      })

      // 动画显示节点
      if (animationEnabled) {
        setTimeout(() => {
          // 先从小变大（弹动效果）
          nodeElement.style({ opacity: 0, width: 0, height: 0 })
          nodeElement.animate({
            style: { 
              opacity: 1,
              width: 80,
              height: 80
            }
          }, {
            duration: 600,
            easing: 'ease-out'
          })
        }, index * (mode === 'individual' ? 100 : 50))
      } else {
        nodeElement.style({ opacity: 1, width: 80, height: 80 })
      }
    })

    // 添加新边（带动画）
    const edgesToAdd = Array.from(cumulativeEdges.values()).filter(
      edge => !currentEdgeIds.has(edge.id) &&
               cumulativeNodes.has(edge.source) &&
               cumulativeNodes.has(edge.target)
    )
    
    edgesToAdd.forEach((edge, index) => {
      const edgeElement = cyRef.current!.add({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target
        }
      })

      // 动画显示边
      if (animationEnabled) {
        setTimeout(() => {
          edgeElement.style({ opacity: 0, width: 0 })
          edgeElement.animate({
            style: { 
              opacity: 0.8,
              width: 2
            }
          }, {
            duration: 400,
            easing: 'ease-out'
          })
        }, index * (mode === 'individual' ? 50 : 30))
      } else {
        edgeElement.style({ opacity: 0.8, width: 2 })
      }
    })

    // 运行布局（只在有节点时运行）
    if (cumulativeNodes.size > 0) {
      cyRef.current.layout({
        name: 'dagre',
        animate: animationEnabled,
        animationDuration: animationEnabled ? 800 : 0
      }).run()

      // 适应视图
      setTimeout(() => {
        cyRef.current?.fit(undefined, 50)
      }, animationEnabled ? 1000 : 100)
    }
  }, [evolutionStep, evolutionSteps, maxSteps, mode, animationEnabled])

  // 自动播放
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setEvolutionStep((prev) => {
        if (prev >= maxSteps) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, evolutionSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, maxSteps, evolutionSpeed])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setEvolutionStep(0)
    setIsPlaying(false)
    if (cyRef.current) {
      cyRef.current.elements().remove()
    }
  }

  const handleStepChange = (step: number) => {
    setEvolutionStep(step)
    setIsPlaying(false)
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 控制面板 */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handlePlayPause}
            >
              {isPlaying ? '暂停' : '播放'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => {
                // 导出为图片
                if (cyRef.current) {
                  const png = cyRef.current.png({ 
                    output: 'blob',
                    full: true,
                    bg: 'white'
                  })
                  const url = URL.createObjectURL(png)
                  const link = document.createElement('a')
                  link.download = `evolution-graph-${Date.now()}.png`
                  link.href = url
                  link.click()
                  URL.revokeObjectURL(url)
                }
              }}
            >
              导出图片
            </Button>
            <div>
              <label className="mr-2">演化模式:</label>
              <Select
                value={mode}
                onChange={(val) => {
                  setMode(val)
                  setEvolutionStep(0)
                  setIsPlaying(false)
                }}
                style={{ width: 150 }}
              >
                <Option value="progressive">渐进式</Option>
                <Option value="hierarchical">层级式</Option>
                <Option value="individual">单独式</Option>
              </Select>
            </div>
            <Space>
              <label>动画效果:</label>
              <Switch checked={animationEnabled} onChange={setAnimationEnabled} />
            </Space>
            <div>
              <label className="mr-2">播放速度:</label>
              <Slider
                min={200}
                max={2000}
                step={100}
                value={evolutionSpeed}
                onChange={setEvolutionSpeed}
                style={{ width: 200 }}
              />
            </div>
            <span>步骤: {evolutionStep} / {maxSteps}</span>
          </Space>
          
          {/* 当前步骤统计 */}
          {evolutionSteps[evolutionStep] && (
            <Space>
              <Statistic 
                title="当前步骤新增节点" 
                value={evolutionSteps[evolutionStep].nodes.length} 
                valueStyle={{ fontSize: 14 }}
              />
              <Statistic 
                title="当前步骤新增边数" 
                value={evolutionSteps[evolutionStep].edges.length} 
                valueStyle={{ fontSize: 14 }}
              />
              <Statistic 
                title="累计节点" 
                value={evolutionSteps.slice(0, evolutionStep + 1).reduce((sum, step) => sum + step.nodes.length, 0)}
                valueStyle={{ fontSize: 14, color: '#1890ff' }}
              />
              <Statistic 
                title="累计边数" 
                value={evolutionSteps.slice(0, evolutionStep + 1).reduce((sum, step) => sum + step.edges.length, 0)}
                valueStyle={{ fontSize: 14, color: '#52c41a' }}
              />
            </Space>
          )}
          
          <Slider
            min={0}
            max={maxSteps}
            value={evolutionStep}
            onChange={handleStepChange}
            marks={{
              0: '起点',
              [Math.floor(maxSteps / 2)]: '中点',
              [maxSteps]: '终点'
            }}
          />
        </Space>
      </Card>

      {/* 图谱容器 */}
      <div 
        ref={containerRef} 
        style={{ 
          flex: 1, 
          background: '#F5F5F5', 
          border: '1px solid #e0e0e0', 
          borderRadius: '4px' 
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
            <Descriptions.Item label="节点ID">{detailNode.id}</Descriptions.Item>
            <Descriptions.Item label="关联边数">
              {data.edges.filter(e => e.source === detailNode.id || e.target === detailNode.id).length}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
