import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Text, Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { Card, Button, Space, Statistic, Select, Switch, Slider, Tooltip, Modal, Descriptions } from 'antd'
import { InfoCircleOutlined, FullscreenOutlined, ReloadOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons'
import { GraphNode, GraphEdge } from '@/services/api'

const { Option } = Select

interface Graph3DProps {
  data: {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
}

// 3D 节点组件（使用 React.memo 优化性能）
const Node3D: React.FC<{
  node: GraphNode
  position: [number, number, number]
  color: string
  showLabels: boolean
  selected: boolean
  onHover: (node: GraphNode | null) => void
  onClick?: (node: GraphNode) => void
}> = React.memo(({ node, position, color, showLabels, selected, onHover, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // 计算节点大小（协调的大小比例）
  const level = node.level || 1
  // 根据层级调整大小，让中心节点稍大但不过分突出，与周围节点协调
  const baseSize = level === 1 ? 0.7 : level === 2 ? 0.5 : level === 3 ? 0.45 : 0.4
  const displaySize = hovered || selected ? baseSize * 1.3 : baseSize
  
  // 确保所有节点都有足够大的标签
  const labelFontSize = Math.max(0.12, displaySize * 0.18)

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(node)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover(node)
          if (meshRef.current) {
            meshRef.current.scale.set(1.3, 1.3, 1.3)
          }
        }}
        onPointerOut={(e) => {
          setHovered(false)
          onHover(null)
          if (meshRef.current) {
            meshRef.current.scale.set(1, 1, 1)
          }
        }}
      >
        <sphereGeometry args={[displaySize, 32, 32]} />
        <meshStandardMaterial 
          color={hovered || selected ? '#FFC107' : color}
          emissive={hovered || selected ? '#FFC107' : color}
          emissiveIntensity={hovered || selected ? 0.8 : 0.4}
          metalness={0.7}
          roughness={0.3}
          transparent={false}
        />
      </mesh>
      {/* 节点标签（始终面向相机） */}
      {showLabels && (
        <Billboard position={[0, displaySize + 0.3, 0]}>
          <Text
            fontSize={labelFontSize}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={Math.max(0.02, labelFontSize * 0.15)}
            outlineColor="#000000"
            maxWidth={displaySize * 3}
          >
            {node.label || node.name || node.code}
          </Text>
        </Billboard>
      )}
      {/* 悬停时显示详情 */}
      {hovered && (
        <Html position={[0, displaySize + 0.8, 0]} center>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.95) 100%)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5), 0 0 20px rgba(24,144,255,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px', color: '#4FC3F7' }}>
              {node.label || node.name}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>代码: {node.code}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>类别: {node.category}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>层级: {level}</div>
          </div>
        </Html>
      )}
    </group>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在必要时重新渲染
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.showLabels === nextProps.showLabels &&
    prevProps.selected === nextProps.selected
  )
})

// 3D 边组件（线条，使用 React.memo 优化性能）
const Edge3D: React.FC<{
  edge: GraphEdge
  startPos: [number, number, number]
  endPos: [number, number, number]
  color: string
  highlighted: boolean
  showLabels?: boolean
}> = React.memo(({ edge, startPos, endPos, color, highlighted, showLabels = false }) => {
  const points = useMemo(() => [
    new THREE.Vector3(...startPos),
    new THREE.Vector3(...endPos)
  ], [startPos, endPos])
  
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    return geom
  }, [points])
  
  // 计算边的长度，调整不透明度（长边更透明）
  const edgeLength = useMemo(() => {
    const dx = endPos[0] - startPos[0]
    const dy = endPos[1] - startPos[1]
    const dz = endPos[2] - startPos[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }, [startPos, endPos])
  
  // 计算边的中点位置（用于显示关系标签）
  const midPoint = useMemo(() => {
    return [
      (startPos[0] + endPos[0]) / 2,
      (startPos[1] + endPos[1]) / 2,
      (startPos[2] + endPos[2]) / 2
    ] as [number, number, number]
  }, [startPos, endPos])
  
  // 根据长度调整不透明度（长边更透明，避免视觉混乱）
  const maxEdgeLength = 2.5
  const baseOpacity = highlighted 
    ? 0.9 
    : edgeLength > maxEdgeLength 
      ? 0.1 
      : 0.2 + (1 - edgeLength / maxEdgeLength) * 0.15
  
  // 关系类型显示文本（如果有type字段，否则显示默认文本）
  const relationText = edge.type || '包含'
  
  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial 
          color={highlighted ? '#FFC107' : '#999999'} 
          opacity={baseOpacity} 
          transparent 
          linewidth={highlighted ? 3 : 1}
        />
      </line>
      {/* 关系标签（始终面向相机，显示所有边的关系） */}
      {showLabels && (
        <Billboard position={midPoint}>
          <Text
            fontSize={Math.max(0.12, Math.min(0.18, edgeLength * 0.05))}
            color={highlighted ? '#FFC107' : '#FFFFFF'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={edgeLength * 0.8}
          >
            {relationText}
          </Text>
        </Billboard>
      )}
    </group>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.edge.id === nextProps.edge.id &&
    prevProps.highlighted === nextProps.highlighted &&
    prevProps.showLabels === nextProps.showLabels
  )
})

export const Graph3D: React.FC<Graph3DProps> = ({ data }) => {
  const { nodes, edges } = data
  const [showLabels, setShowLabels] = useState(true)
  const [showEdges, setShowEdges] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [layoutMode, setLayoutMode] = useState<'force' | 'spherical' | 'grid'>('force')
  const [cameraDistance, setCameraDistance] = useState(10)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailNode, setDetailNode] = useState<GraphNode | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // 计算节点的3D位置（根据布局模式）
  const nodePositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {}
    
    console.log('计算节点位置，布局模式:', layoutMode, '节点数量:', nodes.length)
    
    if (layoutMode === 'spherical') {
      // 改进的球形分布 - 使用均匀球面分布算法（增大半径，让节点更分散）
      console.log('使用球形布局')
      const radius = Math.max(3, Math.cbrt(nodes.length) * 1.2)
      nodes.forEach((node, index) => {
        // 使用黄金角度螺旋算法实现均匀球面分布
        const y = 1 - (index / (nodes.length - 1 || 1)) * 2 // 从1到-1
        const radius_at_y = Math.sqrt(Math.max(0, 1 - y * y))
        const theta = Math.PI * (3 - Math.sqrt(5)) * index // 黄金角度
        const x = Math.cos(theta) * radius_at_y
        const z = Math.sin(theta) * radius_at_y
        
        positions[node.id] = [
          x * radius,
          y * radius,
          z * radius
        ]
      })
    } else if (layoutMode === 'grid') {
      // 改进的网格分布 - 3D网格（增大间距，让节点更分散）
      console.log('使用网格布局')
      const cols = Math.ceil(Math.cbrt(nodes.length))
      const rows = Math.ceil(Math.sqrt(nodes.length / cols))
      const layers = Math.ceil(nodes.length / (cols * rows))
      
      const spacing = 2.0 // 增大间距，让节点更分散
      nodes.forEach((node, index) => {
        const layer = Math.floor(index / (cols * rows))
        const remainder = index % (cols * rows)
        const row = Math.floor(remainder / cols)
        const col = remainder % cols
        
        positions[node.id] = [
          (col - (cols - 1) / 2) * spacing,
          (row - (rows - 1) / 2) * spacing,
          (layer - (layers - 1) / 2) * spacing
        ]
      })
    } else {
      // 改进的力导向布局
      const layout = calculate3DLayout(nodes, edges)
      const nodeIdToIndex = new Map(nodes.map((n, i) => [n.id, i]))
      
      nodes.forEach((node) => {
        const index = nodeIdToIndex.get(node.id)
        if (index !== undefined && layout[index]) {
          // 根据节点数量动态调整缩放（进一步缩小范围，让节点更集中）
          const scale = Math.max(0.6, Math.min(1.5, 3 / Math.sqrt(nodes.length)))
          positions[node.id] = [
            layout[index].x * scale,
            layout[index].y * scale,
            layout[index].z * scale
          ]
        } else {
          // 备用：使用球形分布
          const i = index || 0
          const y = 1 - (i / (nodes.length - 1 || 1)) * 2
          const radius_at_y = Math.sqrt(Math.max(0, 1 - y * y))
          const theta = Math.PI * (3 - Math.sqrt(5)) * i
          const x = Math.cos(theta) * radius_at_y
          const z = Math.sin(theta) * radius_at_y
          const radius = 2.5 // 增大备用布局的半径，让节点更分散
          positions[node.id] = [
            x * radius,
            y * radius,
            z * radius
          ]
        }
      })
    }
    
    return positions
  }, [nodes, edges, layoutMode])

  // 根据类别确定颜色（更美观的配色）
  const getNodeColor = (node: GraphNode): string => {
    if (node.category === '疾病类') return '#42A5F5' // 更亮的蓝色
    if (node.category === '证候类') return '#66BB6A' // 更亮的绿色
    return '#AB47BC' // 更亮的紫色
  }

  // 获取高亮的边（连接到悬停或选中的节点）
  const highlightedEdges = useMemo(() => {
    if (!hoveredNode && !selectedNode) return new Set<string>()
    const targetNode = hoveredNode || selectedNode
    const highlighted = new Set<string>()
    edges.forEach(edge => {
      if (edge.source === targetNode?.id || edge.target === targetNode?.id) {
        highlighted.add(edge.id)
      }
    })
    return highlighted
  }, [hoveredNode, selectedNode, edges])

  // 统计信息
  const stats = useMemo(() => {
    const diseaseCount = nodes.filter(n => n.category === '疾病类').length
    const syndromeCount = nodes.filter(n => n.category === '证候类').length
    return {
      total: nodes.length,
      edges: edges.length,
      disease: diseaseCount,
      syndrome: syndromeCount
    }
  }, [nodes, edges])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* 控制面板 */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 8, 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '8px'
        }}
      >
        <Space size="large" wrap>
          <Space>
            <label>显示标签:</label>
            <Switch checked={showLabels} onChange={setShowLabels} />
          </Space>
          <Space>
            <label>显示连线:</label>
            <Switch checked={showEdges} onChange={setShowEdges} />
          </Space>
          <Space>
            <label>布局模式:</label>
            <Select
              value={layoutMode}
              onChange={setLayoutMode}
              style={{ width: 120 }}
            >
              <Option value="force">力导向</Option>
              <Option value="spherical">球形</Option>
              <Option value="grid">网格</Option>
            </Select>
          </Space>
          <Space>
            <label>相机距离:</label>
            <Slider
              min={5}
              max={25}
              value={cameraDistance}
              onChange={setCameraDistance}
              style={{ width: 150 }}
            />
          </Space>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              setSelectedNode(null)
              setHoveredNode(null)
            }}
          >
            重置视图
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              // 导出为图片功能
              if (canvasRef.current) {
                const canvas = canvasRef.current.querySelector('canvas')
                if (canvas) {
                  const url = canvas.toDataURL('image/png')
                  const link = document.createElement('a')
                  link.download = `3d-graph-${Date.now()}.png`
                  link.href = url
                  link.click()
                }
              }
            }}
          >
            导出图片
          </Button>
        </Space>
      </Card>

      {/* 统计信息 */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 8,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Space size="large">
          <Statistic title="总节点数" value={stats.total} valueStyle={{ fontSize: 16 }} />
          <Statistic title="总边数" value={stats.edges} valueStyle={{ fontSize: 16 }} />
          <Statistic title="疾病类" value={stats.disease} valueStyle={{ color: '#2196F3', fontSize: 16 }} />
          <Statistic title="证候类" value={stats.syndrome} valueStyle={{ color: '#4CAF50', fontSize: 16 }} />
          {selectedNode && (
            <Statistic 
              title="选中节点" 
              value={selectedNode.label || selectedNode.name || selectedNode.code}
              valueStyle={{ fontSize: 14, maxWidth: 200 }}
            />
          )}
        </Space>
      </Card>

      {/* 3D 画布 */}
      <div 
        ref={canvasRef}
        style={{ 
          flex: 1, 
          position: 'relative', 
          background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)',
          borderRadius: '8px', 
          overflow: 'hidden',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
        }}
      >
        <Canvas>
          {/* 相机 */}
          <PerspectiveCamera 
            makeDefault 
            position={[0, 0, cameraDistance]} 
            fov={70}
            near={0.1}
            far={1000}
          />
          
          {/* 环境光 */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#ffffff" />
          <pointLight position={[0, 10, -10]} intensity={0.6} color="#ffffff" />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          
          {/* 星空背景 */}
          <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={0.3} />
          
          {/* 控制 */}
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={30}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          
          {/* 渲染边 */}
          {showEdges && edges.map((edge) => {
            const startPos = nodePositions[edge.source]
            const endPos = nodePositions[edge.target]
            
            if (!startPos || !endPos) return null
            
            return (
              <Edge3D
                key={edge.id}
                edge={edge}
                startPos={startPos}
                endPos={endPos}
                color="#888888"
                highlighted={highlightedEdges.has(edge.id)}
                showLabels={showLabels}
              />
            )
          })}
          
          {/* 渲染节点 */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id]
            if (!pos) return null
            
            return (
              <Node3D
                key={node.id}
                node={node}
                position={pos}
                color={getNodeColor(node)}
                showLabels={showLabels}
                selected={selectedNode?.id === node.id}
                onHover={setHoveredNode}
                onClick={(clickedNode) => {
                  setSelectedNode(prev => prev?.id === clickedNode.id ? null : clickedNode)
                  if (clickedNode) {
                    setDetailNode(clickedNode)
                    setShowDetailModal(true)
                  }
                }}
              />
            )
          })}
        </Canvas>

        {/* 操作提示（右下角） */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,20,30,0.9) 100%)',
          color: 'white',
          padding: '14px 16px',
          borderRadius: '10px',
          fontSize: '12px',
          lineHeight: '1.8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#4FC3F7' }}>
            操作提示
          </div>
          <div style={{ opacity: 0.9 }}>🖱️ 左键拖动：旋转视角</div>
          <div style={{ opacity: 0.9 }}>🖱️ 右键拖动：平移视图</div>
          <div style={{ opacity: 0.9 }}>🖱️ 滚轮：缩放</div>
          <div style={{ opacity: 0.9 }}>🖱️ 点击节点：选中/取消</div>
          <div style={{ opacity: 0.9 }}>🖱️ 悬停节点：查看详情</div>
        </div>
      </div>

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
            {detailNode.code && (
              <Descriptions.Item label="关联边数">
                {edges.filter(e => e.source === detailNode.id || e.target === detailNode.id).length}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

// 改进的3D力导向布局算法
function calculate3DLayout(nodes: GraphNode[], edges: GraphEdge[]) {
  if (nodes.length === 0) return []
  
  // 创建节点ID到索引的映射
  const nodeIdToIndex = new Map(nodes.map((n, i) => [n.id, i]))
  
    // 初始化位置 - 使用更好的初始分布（进一步缩小初始范围）
    const positions = nodes.map((_, i) => {
      // 使用球形初始分布，避免节点聚集
      const y = 1 - (i / (nodes.length - 1 || 1)) * 2
      const radius_at_y = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = Math.PI * (3 - Math.sqrt(5)) * i
      const x = Math.cos(theta) * radius_at_y
      const z = Math.sin(theta) * radius_at_y
      const radius = 2.5 // 增大初始半径，让节点更分散
      return {
        x: x * radius,
        y: y * radius,
        z: z * radius
      }
    })
  
  // 力导向参数（调整理想距离，让节点更分散）
  const iterations = Math.min(150, Math.max(50, nodes.length))
  const k = Math.sqrt((nodes.length * nodes.length) / (nodes.length + edges.length)) * 1.0 // 理想距离（增大）
  const repulsionStrength = k * k * 0.15 // 斥力强度
  const attractionStrength = 0.01 // 引力强度（减小）
  const damping = 0.85 // 阻尼系数
  
  // 速度数组（用于平滑运动）
  const velocities = nodes.map(() => ({ x: 0, y: 0, z: 0 }))
  
  // 力导向迭代
  for (let iter = 0; iter < iterations; iter++) {
    // 计算所有节点之间的斥力
    for (let i = 0; i < nodes.length; i++) {
      let fx = 0, fy = 0, fz = 0
      
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue
        
        const dx = positions[i].x - positions[j].x
        const dy = positions[i].y - positions[j].y
        const dz = positions[i].z - positions[j].z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
        
        // 斥力：F = k^2 / d
        const force = repulsionStrength / dist
        fx += (dx / dist) * force
        fy += (dy / dist) * force
        fz += (dz / dist) * force
      }
      
      // 计算基于边的引力
      edges.forEach((edge) => {
        const sourceIdx = nodeIdToIndex.get(edge.source)
        const targetIdx = nodeIdToIndex.get(edge.target)
        
        if (sourceIdx === i && targetIdx !== undefined && targetIdx !== i) {
          const dx = positions[targetIdx].x - positions[i].x
          const dy = positions[targetIdx].y - positions[i].y
          const dz = positions[targetIdx].z - positions[i].z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
          
          // 引力：F = d^2 / k
          const force = (dist * dist) / k * attractionStrength
          fx += (dx / dist) * force
          fy += (dy / dist) * force
          fz += (dz / dist) * force
        }
      })
      
      // 更新速度（带阻尼）
      velocities[i].x = (velocities[i].x + fx) * damping
      velocities[i].y = (velocities[i].y + fy) * damping
      velocities[i].z = (velocities[i].z + fz) * damping
      
      // 限制最大速度
      const maxVelocity = 0.5
      const velMag = Math.sqrt(velocities[i].x ** 2 + velocities[i].y ** 2 + velocities[i].z ** 2)
      if (velMag > maxVelocity) {
        velocities[i].x = (velocities[i].x / velMag) * maxVelocity
        velocities[i].y = (velocities[i].y / velMag) * maxVelocity
        velocities[i].z = (velocities[i].z / velMag) * maxVelocity
      }
      
      // 更新位置
      positions[i].x += velocities[i].x
      positions[i].y += velocities[i].y
      positions[i].z += velocities[i].z
    }
    
    // 冷却（逐渐减少力的大小）
    const cooling = 1 - (iter / iterations) * 0.5
    if (iter < iterations - 1) {
      for (let i = 0; i < nodes.length; i++) {
        velocities[i].x *= cooling
        velocities[i].y *= cooling
        velocities[i].z *= cooling
      }
    }
  }
  
  return positions
}
