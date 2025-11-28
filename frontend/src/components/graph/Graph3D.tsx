import React, { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { GraphNode, GraphEdge } from '@/services/api'

interface Graph3DProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onNodeHover?: (node: GraphNode | null) => void
  searchQuery?: string
  categoryFilter?: string
  levelFilter?: number
  codePrefixFilter?: string
  style?: React.CSSProperties
}

// 节点组件
const GraphNode3D: React.FC<{
  node: GraphNode
  position: [number, number, number]
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  highlighted?: boolean
}> = ({ node, position, onClick, onHover, highlighted }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = React.useState(false)

  const color = useMemo(() => {
    if (node.category === '疾病类') return '#68BDF6'
    if (node.category === '证候类') return '#6DCE9E'
    return '#FF756E'
  }, [node.category])

  const size = useMemo(() => {
    if (node.level === 1) return 0.5
    if (node.level === 2) return 0.4
    if (node.level === 3) return 0.3
    return 0.2
  }, [node.level])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          if (onHover) onHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          if (onHover) onHover(false)
        }}
      >
        <meshStandardMaterial
          color={highlighted || hovered ? '#FFD700' : color}
          emissive={highlighted || hovered ? '#FFD700' : color}
          emissiveIntensity={highlighted || hovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      {(hovered || highlighted) && (
        <Text
          position={[0, size + 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {node.name || node.code}
        </Text>
      )}
    </group>
  )
}

// 边组件
const GraphEdge3D: React.FC<{
  edge: GraphEdge
  sourcePos: [number, number, number]
  targetPos: [number, number, number]
  sourceCategory?: string
  targetCategory?: string
}> = ({ edge, sourcePos, targetPos, sourceCategory, targetCategory }) => {
  const color = useMemo(() => {
    if (sourceCategory === '疾病类' && targetCategory === '疾病类') return '#68BDF6'
    if (sourceCategory === '证候类' && targetCategory === '证候类') return '#6DCE9E'
    return '#FFD700'
  }, [sourceCategory, targetCategory])

  return (
    <Line
      points={[sourcePos, targetPos]}
      color={color}
      lineWidth={2}
      opacity={0.6}
    />
  )
}

// 图谱场景
const GraphScene: React.FC<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onNodeHover?: (node: GraphNode | null) => void
  searchQuery?: string
  categoryFilter?: string
  levelFilter?: number
  codePrefixFilter?: string
}> = ({
  nodes,
  edges,
  onNodeClick,
  onNodeHover,
  searchQuery,
  categoryFilter,
  levelFilter,
  codePrefixFilter
}) => {
  // 筛选节点
  const filteredNodes = useMemo(() => {
    let result = [...nodes]
    if (categoryFilter) {
      result = result.filter(n => n.category === categoryFilter)
    }
    if (levelFilter !== undefined) {
      result = result.filter(n => n.level === levelFilter)
    }
    if (codePrefixFilter) {
      result = result.filter(n => n.code.startsWith(codePrefixFilter))
    }
    return result
  }, [nodes, categoryFilter, levelFilter, codePrefixFilter])

  // 筛选边
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [edges, filteredNodes])

  // 计算节点位置（使用改进的3D力导向布局）
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>()
    
    // 按层级分组
    const nodesByLevel = new Map<number, GraphNode[]>()
    filteredNodes.forEach(node => {
      const level = node.level || 1
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(node)
    })

    // 为每个层级计算位置
    nodesByLevel.forEach((levelNodes, level) => {
      const levelRadius = 3 + (level - 1) * 2
      const z = (level - 2) * 3
      
      levelNodes.forEach((node, index) => {
        const angle = (index / levelNodes.length) * Math.PI * 2
        const x = Math.cos(angle) * levelRadius
        const y = Math.sin(angle) * levelRadius
        positions.set(node.id, [x, y, z])
      })
    })

    return positions
  }, [filteredNodes])

  // 高亮节点
  const highlightedNodes = useMemo(() => {
    if (!searchQuery) return new Set<string>()
    const query = searchQuery.toLowerCase()
    return new Set(
      filteredNodes
        .filter(n => 
          n.code.toLowerCase().includes(query) ||
          (n.name && n.name.toLowerCase().includes(query))
        )
        .map(n => n.id)
    )
  }, [filteredNodes, searchQuery])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {filteredEdges.map(edge => {
        const sourcePos = nodePositions.get(edge.source)
        const targetPos = nodePositions.get(edge.target)
        if (!sourcePos || !targetPos) return null

        const sourceNode = filteredNodes.find(n => n.id === edge.source)
        const targetNode = filteredNodes.find(n => n.id === edge.target)

        return (
          <GraphEdge3D
            key={edge.id}
            edge={edge}
            sourcePos={sourcePos}
            targetPos={targetPos}
            sourceCategory={sourceNode?.category}
            targetCategory={targetNode?.category}
          />
        )
      })}

      {filteredNodes.map(node => {
        const position = nodePositions.get(node.id)
        if (!position) return null

        return (
          <GraphNode3D
            key={node.id}
            node={node}
            position={position}
            onClick={() => onNodeClick?.(node)}
            onHover={(hovered) => onNodeHover?.(hovered ? node : null)}
            highlighted={highlightedNodes.has(node.id)}
          />
        )
      })}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
      />
    </>
  )
}

const Graph3D: React.FC<Graph3DProps> = ({
  nodes,
  edges,
  onNodeClick,
  onNodeHover,
  searchQuery,
  categoryFilter,
  levelFilter,
  codePrefixFilter,
  style = { width: '100%', height: '600px' }
}) => {
  return (
    <div style={style}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: '#1a1a1a', borderRadius: '8px' }}
      >
        <GraphScene
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          levelFilter={levelFilter}
          codePrefixFilter={codePrefixFilter}
        />
      </Canvas>
    </div>
  )
}

export default Graph3D

