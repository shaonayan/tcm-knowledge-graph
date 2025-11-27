import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Spin, Statistic, Alert, Button, Dropdown, Space, message } from 'antd'
import { 
  BarChartOutlined, 
  PieChartOutlined, 
  LineChartOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  RiseOutlined,
  DownloadOutlined,
  FileImageOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { getAnalyticsOverview, getStats } from '../../services/api'
import type { AnalyticsOverview } from '../../services/api'

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [stats, setStats] = useState<any>(null)
  const categoryChartRef = React.useRef<any>(null)
  const levelChartRef = React.useRef<any>(null)
  const levelCategoryChartRef = React.useRef<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [overviewData, statsData] = await Promise.all([
        getAnalyticsOverview(),
        getStats()
      ])
      setOverview(overviewData)
      setStats(statsData)
    } catch (err: any) {
      setError(err.message || '加载数据失败')
      console.error('加载分析数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 分类分布饼图配置
  const getCategoryPieOption = () => {
    if (!overview?.categoryStats) return {}

    const data = overview.categoryStats.map(item => ({
      value: item.count,
      name: item.category
    }))

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [
        {
          name: '分类分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: data
        }
      ],
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
    }
  }

  // 层级统计柱状图配置
  const getLevelBarOption = () => {
    if (!overview?.levelStats) return {}

    const levels = overview.levelStats.map(item => `L${item.level}`)
    const counts = overview.levelStats.map(item => item.count)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: levels,
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '节点数量'
      },
      series: [
        {
          name: '节点数',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: (params: any) => {
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']
              return colors[params.dataIndex % colors.length]
            },
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        }
      ]
    }
  }

  // 层级分类分布堆叠柱状图配置
  const getLevelCategoryStackedOption = () => {
    if (!overview?.levelCategoryStats) return {}

    const levels = Object.keys(overview.levelCategoryStats).map(Number).sort()
    const categories = ['疾病类', '证候类']
    
    const series = categories.map(category => ({
      name: category,
      type: 'bar',
      stack: 'total',
      data: levels.map(level => overview.levelCategoryStats[level]?.[category] || 0),
      itemStyle: {
        color: category === '疾病类' ? '#5470c6' : '#91cc75'
      }
    }))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: categories,
        top: 'top'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: levels.map(l => `L${l}`)
      },
      yAxis: {
        type: 'value',
        name: '节点数量'
      },
      series: series
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <Spin size="large" tip="加载分析数据中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重试
            </button>
          }
        />
      </div>
    )
  }

  // 导出图表为图片
  const handleExportChart = (chartRef: any, chartName: string) => {
    if (!chartRef) {
      message.warning('图表未找到')
      return
    }
    
    try {
      const echartsInstance = chartRef.getEchartsInstance()
      if (echartsInstance) {
        const url = echartsInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        })
        const link = document.createElement('a')
        link.download = `${chartName}-${Date.now()}.png`
        link.href = url
        link.click()
        message.success('图表导出成功')
      } else {
        message.warning('无法获取图表实例')
      }
    } catch (err) {
      console.error('导出图表失败:', err)
      message.error('导出图表失败')
    }
  }

  return (
    <div className="page-wrapper analytics-human-shell" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="analytics-hero-card">
        <div className="analytics-hero-card__content">
          <div>
            <p className="eyebrow">Insight Studio</p>
            <h1>数据分析</h1>
            <p>少纳言中医知识图谱 · 结构体温监控面板</p>
          </div>
          <div className="analytics-hero-card__actions">
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              刷新数据
            </Button>
          </div>
        </div>
        <div className="analytics-meta-row">
          <span>节点 {stats?.totalNodes?.toLocaleString() ?? '--'}</span>
          <span>关系 {stats?.totalRelationships?.toLocaleString() ?? '--'}</span>
          <span>根节点 {overview?.rootCount ?? '--'}</span>
          <span>更新 {new Date().toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总节点数"
              value={stats?.totalNodes || 0}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总关系数"
              value={stats?.totalRelationships || 0}
              prefix={<BranchesOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="根节点数"
              value={overview?.rootCount || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均子节点数"
              value={overview?.avgChildren || 0}
              precision={2}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="分类分布" 
            extra={
              <Space>
                <PieChartOutlined />
                <Button
                  type="text"
                  size="small"
                  icon={<FileImageOutlined />}
                  onClick={() => handleExportChart(categoryChartRef.current, '分类分布')}
                />
              </Space>
            }
            className="h-96"
          >
            <ReactECharts
              ref={categoryChartRef}
              option={getCategoryPieOption()}
              style={{ height: '350px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="层级统计" 
            extra={
              <Space>
                <BarChartOutlined />
                <Button
                  type="text"
                  size="small"
                  icon={<FileImageOutlined />}
                  onClick={() => handleExportChart(levelChartRef.current, '层级统计')}
                />
              </Space>
            }
            className="h-96"
          >
            <ReactECharts
              ref={levelChartRef}
              option={getLevelBarOption()}
              style={{ height: '350px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card 
            title="层级分类分布" 
            extra={
              <Space>
                <LineChartOutlined />
                <Button
                  type="text"
                  size="small"
                  icon={<FileImageOutlined />}
                  onClick={() => handleExportChart(levelCategoryChartRef.current, '层级分类分布')}
                />
              </Space>
            }
            className="h-96"
          >
            <ReactECharts
              ref={levelCategoryChartRef}
              option={getLevelCategoryStackedOption()}
              style={{ height: '350px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Analytics
