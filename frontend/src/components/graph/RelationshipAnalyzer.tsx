import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Statistic, Row, Col, Select, Button } from 'antd'
import { ReloadOutlined, BarChartOutlined } from '@ant-design/icons'
import { analyzeGraph } from '@/services/agent'
import type { GraphNode, GraphEdge } from '@/services/api'

interface RelationshipAnalyzerProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onHighlight?: (nodeIds: string[]) => void
}

const RelationshipAnalyzer: React.FC<RelationshipAnalyzerProps> = ({
  nodes,
  edges,
  onHighlight
}) => {
  const [relationshipStats, setRelationshipStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    loadRelationshipStats()
  }, [edges])

  const loadRelationshipStats = async () => {
    setLoading(true)
    try {
      const result = await analyzeGraph('relationships')
      setRelationshipStats(result)
    } catch (error) {
      console.error('Load relationship stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 统计关系类型
  const relationshipTypes = React.useMemo(() => {
    const typeMap = new Map<string, number>()
    edges.forEach(edge => {
      const type = edge.type || '未知'
      typeMap.set(type, (typeMap.get(type) || 0) + 1)
    })
    return Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [edges])

  // 计算关系强度（基于连接数）
  const relationshipStrength = React.useMemo(() => {
    const nodeConnections = new Map<string, number>()
    edges.forEach(edge => {
      const sourceStr = String(edge.source)
      const targetStr = String(edge.target)
      nodeConnections.set(sourceStr, (nodeConnections.get(sourceStr) || 0) + 1)
      nodeConnections.set(targetStr, (nodeConnections.get(targetStr) || 0) + 1)
    })
    return nodeConnections
  }, [edges])

  // 过滤关系
  const filteredEdges = React.useMemo(() => {
    if (selectedType === 'all') return edges
    return edges.filter(edge => edge.type === selectedType)
  }, [edges, selectedType])

  const columns = [
    {
      title: '源节点',
      dataIndex: 'source',
      key: 'source',
      render: (source: string | number) => {
        const sourceStr = String(source)
        const node = nodes.find(n => String(n.id) === sourceStr)
        return node ? (node.name || node.code || sourceStr) : sourceStr
      }
    },
    {
      title: '关系类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getRelationshipColor(type)}>{type || '未知'}</Tag>
      )
    },
    {
      title: '目标节点',
      dataIndex: 'target',
      key: 'target',
      render: (target: string | number) => {
        const targetStr = String(target)
        const node = nodes.find(n => String(n.id) === targetStr)
        return node ? (node.name || node.code || targetStr) : targetStr
      }
    },
    {
      title: '强度',
      key: 'strength',
      render: (_: any, record: GraphEdge) => {
        const sourceStrength = relationshipStrength.get(String(record.source)) || 0
        const targetStrength = relationshipStrength.get(String(record.target)) || 0
        const avgStrength = (sourceStrength + targetStrength) / 2
        return (
          <Tag color={getStrengthColor(avgStrength)}>
            {avgStrength.toFixed(1)}
          </Tag>
        )
      }
    }
  ]

  return (
    <div className="linear-panel">
      <header>
        <div>
          <p className="eyebrow">关系分析</p>
          <h4>图谱关系统计</h4>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadRelationshipStats}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      </header>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="总关系数"
            value={edges.length}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#1f2937' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="关系类型数"
            value={relationshipTypes.length}
            valueStyle={{ color: '#1f2937' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="平均连接度"
            value={edges.length > 0 ? (edges.length * 2 / nodes.length).toFixed(2) : 0}
            valueStyle={{ color: '#1f2937' }}
          />
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Select
          value={selectedType}
          onChange={setSelectedType}
          style={{ width: '100%' }}
          placeholder="筛选关系类型"
        >
          <Select.Option value="all">全部类型</Select.Option>
          {relationshipTypes.map(({ type }) => (
            <Select.Option key={type} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h5 style={{ color: '#1f2937', marginBottom: 12 }}>关系类型分布</h5>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {relationshipTypes.map(({ type, count }) => (
            <Tag
              key={type}
              color={getRelationshipColor(type)}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSelectedType(type)
                const relatedNodes = edges
                  .filter(e => e.type === type)
                  .flatMap(e => [e.source, e.target])
                if (onHighlight) {
                  onHighlight(Array.from(new Set(relatedNodes)))
                }
              }}
            >
              {type}: {count}
            </Tag>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredEdges}
        rowKey={(record, index) => record.id ? String(record.id) : `edge-${index}-${String(record.source)}-${String(record.target)}`}
        pagination={{ pageSize: 10 }}
        size="small"
        style={{ background: 'transparent' }}
      />
    </div>
  )
}

function getRelationshipColor(type: string): string {
  const colors: Record<string, string> = {
    '包含': 'blue',
    '属于': 'green',
    '相关': 'orange',
    '治疗': 'red',
    '症状': 'purple',
    '证候': 'cyan'
  }
  return colors[type] || 'default'
}

function getStrengthColor(strength: number): string {
  if (strength >= 10) return 'red'
  if (strength >= 5) return 'orange'
  if (strength >= 2) return 'green'
  return 'default'
}

export default RelationshipAnalyzer

