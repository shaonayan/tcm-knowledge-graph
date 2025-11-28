import React, { useState, useMemo } from 'react'
import { Button, Input, Select, message, Card } from 'antd'
import { SearchOutlined, ClearOutlined } from '@ant-design/icons'
import { GraphNode, GraphEdge } from '@/services/api'

interface PathFinderProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onPathFound?: (path: string[]) => void
}

const PathFinder: React.FC<PathFinderProps> = ({ nodes, edges, onPathFound }) => {
  const [sourceCode, setSourceCode] = useState<string>('')
  const [targetCode, setTargetCode] = useState<string>('')
  const [foundPath, setFoundPath] = useState<string[]>([])

  // 构建邻接表
  const adjacencyList = useMemo(() => {
    const adj: Record<string, string[]> = {}
    nodes.forEach(node => {
      adj[node.id] = []
    })
    edges.forEach(edge => {
      if (!adj[edge.source]) adj[edge.source] = []
      if (!adj[edge.target]) adj[edge.target] = []
      adj[edge.source].push(edge.target)
      adj[edge.target].push(edge.source) // 无向图
    })
    return adj
  }, [nodes, edges])

  // BFS查找最短路径
  const findPath = () => {
    if (!sourceCode || !targetCode) {
      message.warning('请选择起始节点和目标节点')
      return
    }

    const sourceNode = nodes.find(n => n.code === sourceCode)
    const targetNode = nodes.find(n => n.code === targetCode)

    if (!sourceNode || !targetNode) {
      message.error('节点不存在')
      return
    }

    if (sourceNode.id === targetNode.id) {
      message.info('起始节点和目标节点相同')
      setFoundPath([sourceNode.id])
      if (onPathFound) onPathFound([sourceNode.id])
      return
    }

    // BFS
    const queue: string[][] = [[sourceNode.id]]
    const visited = new Set<string>([sourceNode.id])

    while (queue.length > 0) {
      const path = queue.shift()!
      const current = path[path.length - 1]

      if (current === targetNode.id) {
        setFoundPath(path)
        if (onPathFound) onPathFound(path)
        message.success(`找到路径，共 ${path.length - 1} 步`)
        return
      }

      const neighbors = adjacencyList[current] || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push([...path, neighbor])
        }
      }
    }

    message.warning('未找到路径')
    setFoundPath([])
    if (onPathFound) onPathFound([])
  }

  return (
    <div className="linear-panel" style={{ marginTop: '24px' }}>
      <header>
        <div>
          <p className="eyebrow">路径查找</p>
          <h4>节点关系路径</h4>
        </div>
      </header>
      <div className="linear-form-group">
        <label>起始节点</label>
        <Select
          showSearch
          placeholder="选择或输入起始节点代码"
          value={sourceCode}
          onChange={setSourceCode}
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
        >
          {nodes.map(node => (
            <Select.Option key={node.code} value={node.code} label={`${node.code} - ${node.name}`}>
              {node.code} - {node.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="linear-form-group">
        <label>目标节点</label>
        <Select
          showSearch
          placeholder="选择或输入目标节点代码"
          value={targetCode}
          onChange={setTargetCode}
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
        >
          {nodes.map(node => (
            <Select.Option key={node.code} value={node.code} label={`${node.code} - ${node.name}`}>
              {node.code} - {node.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="linear-form-actions">
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={findPath}
          block
        >
          查找路径
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={() => {
            setSourceCode('')
            setTargetCode('')
            setFoundPath([])
            if (onPathFound) onPathFound([])
          }}
          block
        >
          清空
        </Button>
      </div>
      {foundPath.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>路径：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {foundPath.map((nodeId, index) => {
              const node = nodes.find(n => n.id === nodeId)
              return (
                <React.Fragment key={nodeId}>
                  <span style={{
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ffffff',
                    fontFamily: 'monospace'
                  }}>
                    {node?.code || nodeId}
                  </span>
                  {index < foundPath.length - 1 && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>→</span>
                  )}
                </React.Fragment>
              )
            })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            路径长度：{foundPath.length - 1} 步
          </div>
        </div>
      )}
    </div>
  )
}

export default PathFinder

