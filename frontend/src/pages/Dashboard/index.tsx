import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Alert } from 'antd'
import { 
  NodeIndexOutlined, 
  BranchesOutlined, 
  SearchOutlined, 
  BarChartOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getStats, type StatsData } from '@/services/api'
import { LoadingSpinner } from '@/components/common/Loading'
import { PageHeader } from '@/components/common/PageHeader'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败')
        console.error('获取统计数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
        />
      </div>
    )
  }

  // 计算统计数据
  const diseaseCount = stats?.labelStats.find(
    s => s.label === 'TcmDiseaseSyndromeClassification'
  )?.count || 0
  const syndromeCount = stats?.labelStats.find(
    s => s.label === 'TcmSyndromeClassification'
  )?.count || 0
  const totalCount = diseaseCount + syndromeCount
  const diseasePercent = totalCount > 0 ? (diseaseCount / totalCount) * 100 : 0
  const syndromePercent = totalCount > 0 ? (syndromeCount / totalCount) * 100 : 0

  return (
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 72px)' }}>
      {/* 页面标题 */}
      <PageHeader
        iconText="少"
        title="少纳言中医知识图谱"
        subtitle="Shonaoyan TCM Knowledge Graph"
        description="欢迎使用少纳言中医知识图谱系统，探索传统中医的智慧宝库"
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center glass-panel">
            <Statistic
              title="总节点数"
              value={stats?.totalNodes || 0}
              prefix={<NodeIndexOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center glass-panel">
            <Statistic
              title="关系数量"
              value={stats?.totalRelationships || 0}
              prefix={<BranchesOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center glass-panel">
            <Statistic
              title="疾病类术语"
              value={diseaseCount}
              prefix={<SearchOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center glass-panel">
            <Statistic
              title="证候类术语"
              value={syndromeCount}
              prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能卡片 */}
      <Row gutter={[16, 16]} className="mt-0">
        <Col xs={24} lg={12}>
          <Card 
            title="数据概览" 
            className="h-full glass-panel"
            extra={<a href="/analytics" style={{ color: 'var(--primary-color)' }}>查看详情 →</a>}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 500 }}>疾病类术语</span>
                  <span style={{ color: '#52c41a', fontWeight: 600 }}>{diseaseCount.toLocaleString()} 条</span>
                </div>
                <Progress 
                  percent={Number(diseasePercent.toFixed(1))} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 500 }}>证候类术语</span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>{syndromeCount.toLocaleString()} 条</span>
                </div>
                <Progress 
                  percent={Number(syndromePercent.toFixed(1))} 
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 500 }}>数据完整性</span>
                  <span style={{ color: '#fa8c16', fontWeight: 600 }}>{stats?.dataCompleteness.toFixed(1) || 0}%</span>
                </div>
                <Progress 
                  percent={Number((stats?.dataCompleteness || 0).toFixed(1))} 
                  strokeColor="#fa8c16"
                  showInfo={false}
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="快速操作" 
            className="h-full glass-panel"
          >
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%)',
                }}
                onClick={() => navigate('/explorer')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(220, 38, 38, 0.06) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%)'
                }}
              >
                <NodeIndexOutlined className="text-2xl mb-2" style={{ color: '#dc2626' }} />
                <h3 className="font-medium text-gray-800 mb-1">图谱探索</h3>
                <p className="text-sm text-gray-600">可视化浏览知识图谱</p>
              </div>
              <div 
                className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.04) 100%)',
                }}
                onClick={() => navigate('/search')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(24, 144, 255, 0.12) 0%, rgba(24, 144, 255, 0.06) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.04) 100%)'
                }}
              >
                <SearchOutlined className="text-2xl mb-2" style={{ color: '#1890ff' }} />
                <h3 className="font-medium text-gray-800 mb-1">智能搜索</h3>
                <p className="text-sm text-gray-600">快速查找相关术语</p>
              </div>
              <div 
                className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(250, 140, 22, 0.08) 0%, rgba(250, 140, 22, 0.04) 100%)',
                }}
                onClick={() => navigate('/analytics')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(250, 140, 22, 0.12) 0%, rgba(250, 140, 22, 0.06) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(250, 140, 22, 0.08) 0%, rgba(250, 140, 22, 0.04) 100%)'
                }}
              >
                <BarChartOutlined className="text-2xl mb-2" style={{ color: '#fa8c16' }} />
                <h3 className="font-medium text-gray-800 mb-1">数据分析</h3>
                <p className="text-sm text-gray-600">深入分析数据结构</p>
              </div>
              <div 
                className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(114, 46, 209, 0.04) 100%)',
                }}
                onClick={() => navigate('/visualizations')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(114, 46, 209, 0.12) 0%, rgba(114, 46, 209, 0.06) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(114, 46, 209, 0.04) 100%)'
                }}
              >
                <BarChartOutlined className="text-2xl mb-2" style={{ color: '#722ed1' }} />
                <h3 className="font-medium text-gray-800 mb-1">高级可视化</h3>
                <p className="text-sm text-gray-600">3D视图、时间线、演化展示</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
