import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Select, Tag, Button } from 'antd'
import { ReloadOutlined, BarChartOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { analyzeGraph } from '@/services/agent'
import type { GraphNode } from '@/services/api'

interface DimensionAnalyzerProps {
  nodes: GraphNode[]
  onFilter?: (dimension: string, value: string) => void
}

const DimensionAnalyzer: React.FC<DimensionAnalyzerProps> = ({
  nodes,
  onFilter
}) => {
  const [dimensionData, setDimensionData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDimension, setSelectedDimension] = useState<'category' | 'level'>('category')

  useEffect(() => {
    loadDimensionData()
  }, [nodes])

  const loadDimensionData = async () => {
    setLoading(true)
    try {
      const result = await analyzeGraph('dimensions')
      setDimensionData(result)
    } catch (error) {
      console.error('Load dimension data error:', error)
      // 降级到本地计算
      calculateLocalDimensions()
    } finally {
      setLoading(false)
    }
  }

  const calculateLocalDimensions = () => {
    const byCategory: Record<string, number> = {}
    const byLevel: Record<number, number> = {}

    nodes.forEach(node => {
      const category = node.category || '未知'
      byCategory[category] = (byCategory[category] || 0) + 1
      
      const level = node.level || 1
      byLevel[level] = (byLevel[level] || 0) + 1
    })

    setDimensionData({
      byCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
      byLevel: Object.entries(byLevel).map(([level, count]) => ({ level: parseInt(level), count }))
    })
  }

  const getChartOption = () => {
    const data = selectedDimension === 'category' 
      ? (dimensionData?.byCategory || [])
      : (dimensionData?.byLevel || [])

    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#ffffff'
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: '#ffffff'
        }
      },
      series: [
        {
          name: selectedDimension === 'category' ? '类别' : '层级',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#1a1a1a',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#ffffff',
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: data.map((item: any) => ({
            value: item.count,
            name: selectedDimension === 'category' ? item.category : `L${item.level}`
          }))
        }
      ]
    }
  }

  const getBarChartOption = () => {
    const data = selectedDimension === 'category' 
      ? (dimensionData?.byCategory || [])
      : (dimensionData?.byLevel || [])

    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#ffffff'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: {
          color: '#ffffff'
        }
      },
      xAxis: {
        type: 'category',
        data: data.map((item: any) => 
          selectedDimension === 'category' ? item.category : `L${item.level}`
        ),
        axisLabel: {
          color: '#ffffff',
          rotate: selectedDimension === 'category' ? 45 : 0
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#ffffff'
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: [
        {
          data: data.map((item: any) => item.count),
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
            color: '#ffffff'
          }
        }
      ]
    }
  }

  const totalNodes = nodes.length
  const categoryCount = dimensionData?.byCategory?.length || 0
  const levelCount = dimensionData?.byLevel?.length || 0

  return (
    <div className="linear-panel">
      <header>
        <div>
          <p className="eyebrow">维度分析</p>
          <h4>多维度数据分布</h4>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadDimensionData}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      </header>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="总节点数"
            value={totalNodes}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#ffffff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="类别数"
            value={categoryCount}
            valueStyle={{ color: '#ffffff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="层级数"
            value={levelCount}
            valueStyle={{ color: '#ffffff' }}
          />
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Select
          value={selectedDimension}
          onChange={(value) => setSelectedDimension(value)}
          style={{ width: '100%' }}
        >
          <Select.Option value="category">按类别分析</Select.Option>
          <Select.Option value="level">按层级分析</Select.Option>
        </Select>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: 12, padding: 16 }}>
            <h5 style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 12 }}>
              {selectedDimension === 'category' ? '类别分布' : '层级分布'}（饼图）
            </h5>
            <ReactECharts
              option={getChartOption()}
              style={{ height: '300px' }}
            />
          </div>
        </Col>
        <Col span={12}>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: 12, padding: 16 }}>
            <h5 style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 12 }}>
              {selectedDimension === 'category' ? '类别分布' : '层级分布'}（柱状图）
            </h5>
            <ReactECharts
              option={getBarChartOption()}
              style={{ height: '300px' }}
            />
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <h5 style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 12 }}>快速筛选</h5>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {selectedDimension === 'category' 
            ? (dimensionData?.byCategory || []).map((item: any) => (
                <Tag
                  key={item.category}
                  color="blue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onFilter?.('category', item.category)}
                >
                  {item.category} ({item.count})
                </Tag>
              ))
            : (dimensionData?.byLevel || []).map((item: any) => (
                <Tag
                  key={item.level}
                  color="purple"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onFilter?.('level', item.level.toString())}
                >
                  L{item.level} ({item.count})
                </Tag>
              ))
          }
        </div>
      </div>
    </div>
  )
}

export default DimensionAnalyzer

