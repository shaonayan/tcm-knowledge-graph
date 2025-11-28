import React, { useMemo } from 'react'
import { Tag, Empty, Card } from 'antd'
import { GraphNode } from '@/services/api'
import './UnaryGraph.css'

interface UnaryGraphProps {
  nodes: GraphNode[]
  onNodeClick?: (node: GraphNode) => void
  style?: React.CSSProperties
}

const UnaryGraph: React.FC<UnaryGraphProps> = ({ nodes, onNodeClick, style }) => {
  // 按类别分组
  const nodesByCategory = useMemo(() => {
    const grouped = new Map<string, GraphNode[]>()
    nodes.forEach(node => {
      const category = node.category || '其他'
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(node)
    })
    return grouped
  }, [nodes])

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      '疾病类': '#ff4d4f',
      '证候类': '#52c41a',
      '方剂': '#1890ff',
      '中药': '#faad14',
      '症状': '#722ed1',
      '其他': '#8c8c8c'
    }
    return colors[category] || '#8c8c8c'
  }

  if (nodes.length === 0) {
    return (
      <div style={style}>
        <Empty description="暂无实体数据" />
      </div>
    )
  }

  return (
    <div className="unary-graph" style={style}>
      <div className="unary-graph__stats">
        <div className="unary-graph__stat-item">
          <span className="unary-graph__stat-label">总实体数:</span>
          <span className="unary-graph__stat-value">{nodes.length}</span>
        </div>
        <div className="unary-graph__stat-item">
          <span className="unary-graph__stat-label">类别数:</span>
          <span className="unary-graph__stat-value">{nodesByCategory.size}</span>
        </div>
      </div>

      <div className="unary-graph__content">
        {Array.from(nodesByCategory.entries()).map(([category, categoryNodes]) => (
          <Card
            key={category}
            className="unary-graph__category-card"
            title={
              <div className="unary-graph__category-header">
                <span className="unary-graph__category-name">{category}</span>
                <Tag color={getCategoryColor(category)}>{categoryNodes.length}</Tag>
              </div>
            }
            size="small"
          >
            <div className="unary-graph__nodes-grid">
              {categoryNodes.map(node => (
                <div
                  key={node.id}
                  className="unary-graph__node-item"
                  onClick={() => onNodeClick && onNodeClick(node)}
                  style={{
                    borderColor: getCategoryColor(category),
                    cursor: onNodeClick ? 'pointer' : 'default'
                  }}
                >
                  <div className="unary-graph__node-name">{node.name || node.code}</div>
                  <div className="unary-graph__node-code">{node.code}</div>
                  {node.level && (
                    <div className="unary-graph__node-level">L{node.level}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default UnaryGraph

