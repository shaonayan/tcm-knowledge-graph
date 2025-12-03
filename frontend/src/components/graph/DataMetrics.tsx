import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Tag, Button } from 'antd'
import { ReloadOutlined, BarChartOutlined, NodeIndexOutlined, BranchesOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { analyzeGraph } from '@/services/agent'
import type { GraphNode, GraphEdge } from '@/services/api'

interface DataMetricsProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const DataMetrics: React.FC<DataMetricsProps> = ({ nodes, edges }) => {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [nodes, edges])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const structure = await analyzeGraph('structure')
      const dimensions = await analyzeGraph('dimensions')
      const relationships = await analyzeGraph('relationships')
      
      setMetrics({
        structure,
        dimensions,
        relationships
      })
    } catch (error) {
      console.error('Load metrics error:', error)
      // 降级到本地计算
      calculateLocalMetrics()
    } finally {
      setLoading(false)
    }
  }

  const calculateLocalMetrics = () => {
    // 计算节点统计
    const byCategory: Record<string, number> = {}
    const byLevel: Record<number, number> = {}
    
    nodes.forEach(node => {
      const category = node.category || '未知'
      byCategory[category] = (byCategory[category] || 0) + 1
      const level = node.level || 1
      byLevel[level] = (byLevel[level] || 0) + 1
    })

    // 计算关系统计
    const byType: Record<string, number> = {}
    edges.forEach(edge => {
      const type = edge.type || '未知'
      byType[type] = (byType[type] || 0) + 1
    })

    // 计算连接度分布
    const nodeConnections = new Map<string, number>()
    edges.forEach(edge => {
      nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1)
      nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1)
    })
    const connectionCounts = Array.from(nodeConnections.values())
    const avgConnections = connectionCounts.length > 0 
      ? connectionCounts.reduce((a, b) => a + b, 0) / connectionCounts.length 
      : 0
    const maxConnections = connectionCounts.length > 0 ? Math.max(...connectionCounts) : 0

    setMetrics({
      structure: {
        totalNodes: nodes.length,
        totalRelationships: edges.length,
        categories: Object.entries(byCategory).map(([category, count]) => ({ category, count }))
      },
      dimensions: {
        byCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
        byLevel: Object.entries(byLevel).map(([level, count]) => ({ level: parseInt(level), count }))
      },
      relationships: {
        relationships: Object.entries(byType).map(([type, count]) => ({ type, count }))
      },
      connections: {
        avg: avgConnections,
        max: maxConnections,
        distribution: connectionCounts
      }
    })
  }

  const getDistributionChartOption = () => {
    if (!metrics) return {}

    const levelData = metrics.dimensions?.byLevel || []
    const categoryData = metrics.dimensions?.byCategory || []

    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#1f2937'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        textStyle: {
          color: '#1f2937'
        }
      },
      legend: {
        data: ['层级分布', '类别分布'],
        textStyle: {
          color: '#1f2937'
        }
      },
      xAxis: {
        type: 'category',
        data: levelData.map((item: any) => `L${item.level}`),
        axisLabel: {
          color: '#6b7280'
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280'
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6'
          }
        }
      },
      series: [
        {
          name: '层级分布',
          type: 'bar',
          data: levelData.map((item: any) => item.count),
          itemStyle: {
            color: new (window as any).echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#68BDF6' },
              { offset: 1, color: '#6DCE9E' }
            ])
          }
        }
      ]
    }
  }

  const getConnectionDistributionOption = () => {
    if (!metrics?.connections?.distribution) return {}

    const distribution = metrics.connections.distribution
    const bins = [0, 1, 2, 5, 10, 20, 50, 100]
    const binCounts = new Array(bins.length - 1).fill(0)

    distribution.forEach((count: number) => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (count >= bins[i] && count < bins[i + 1]) {
          binCounts[i]++
          break
        }
      }
      if (count >= bins[bins.length - 1]) {
        binCounts[binCounts.length - 1]++
      }
    })

    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#1f2937'
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        textStyle: {
          color: '#1f2937'
        }
      },
      xAxis: {
        type: 'category',
        data: bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`),
        axisLabel: {
          color: '#6b7280',
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280'
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6'
          }
        }
      },
      series: [
        {
          data: binCounts,
          type: 'bar',
          itemStyle: {
            color: new (window as any).echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a855f7' },
              { offset: 1, color: '#ec4899' }
            ])
          },
          label: {
            show: true,
            position: 'top',
            color: '#1f2937'
          }
        }
      ]
    }
  }

  if (!metrics) {
    return (
      <div className="linear-panel">
        <header>
          <div>
            <p className="eyebrow">数据量级</p>
            <h4>图谱统计指标</h4>
          </div>
        </header>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          加载中...
        </div>
      </div>
    )
  }

  const totalNodes = metrics.structure?.totalNodes || nodes.length
  const totalRelationships = metrics.structure?.totalRelationships || edges.length
  const avgConnections = metrics.connections?.avg || 0
  const maxConnections = metrics.connections?.max || 0
  const density = totalNodes > 0 ? (totalRelationships / (totalNodes * (totalNodes - 1) / 2)) * 100 : 0

  return (
    <div className="linear-panel">
      <header>
        <div>
          <p className="eyebrow">数据量级</p>
          <h4>图谱统计指标</h4>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadMetrics}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      </header>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="节点总数"
            value={totalNodes}
            prefix={<NodeIndexOutlined />}
            valueStyle={{ color: '#68BDF6', fontSize: '24px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="关系总数"
            value={totalRelationships}
            prefix={<BranchesOutlined />}
            valueStyle={{ color: '#6DCE9E', fontSize: '24px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均连接度"
            value={avgConnections.toFixed(2)}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#FFD700', fontSize: '24px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="最大连接度"
            value={maxConnections}
            valueStyle={{ color: '#FF756E', fontSize: '24px' }}
          />
        </Col>
      </Row>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#1f2937' }}>图谱密度</span>
          <span style={{ color: '#6b7280' }}>{density.toFixed(2)}%</span>
        </div>
        <Progress
          percent={Math.min(density, 100)}
          strokeColor={{
            '0%': '#68BDF6',
            '100%': '#6DCE9E'
          }}
          showInfo={false}
        />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
            <h5 style={{ color: '#1f2937', marginBottom: 12 }}>层级分布</h5>
            {metrics && (
              <ReactECharts
                key="distribution-chart"
                option={getDistributionChartOption()}
                style={{ height: '250px' }}
                notMerge={true}
                lazyUpdate={true}
              />
            )}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
            <h5 style={{ color: '#1f2937', marginBottom: 12 }}>连接度分布</h5>
            {metrics && (
              <ReactECharts
                key="connection-chart"
                option={getConnectionDistributionOption()}
                style={{ height: '250px' }}
                notMerge={true}
                lazyUpdate={true}
              />
            )}
          </div>
        </Col>
      </Row>

      <div>
        <h5 style={{ color: '#1f2937', marginBottom: 12 }}>类别统计</h5>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {metrics.dimensions?.byCategory?.map((item: any) => {
            const percentage = ((item.count / totalNodes) * 100).toFixed(1)
            return (
              <Tag
                key={item.category}
                color="blue"
                style={{ fontSize: '13px', padding: '4px 12px' }}
              >
                {item.category}: {item.count} ({percentage}%)
              </Tag>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DataMetrics

