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
      <Row gutter={[20, 20]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
              borderColor: 'rgba(99, 102, 241, 0.2)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>总节点数</span>}
              value={stats?.totalNodes || 0}
              prefix={<NodeIndexOutlined style={{ color: '#6366f1', fontSize: '28px' }} />}
              valueStyle={{ color: '#6366f1', fontSize: '28px', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(245, 87, 108, 0.05) 100%)',
              borderColor: 'rgba(236, 72, 153, 0.2)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>关系数量</span>}
              value={stats?.totalRelationships || 0}
              prefix={<BranchesOutlined style={{ color: '#ec4899', fontSize: '28px' }} />}
              valueStyle={{ color: '#ec4899', fontSize: '28px', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.2)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>疾病类术语</span>}
              value={diseaseCount}
              prefix={<SearchOutlined style={{ color: '#3b82f6', fontSize: '28px' }} />}
              valueStyle={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(56, 249, 215, 0.05) 100%)',
              borderColor: 'rgba(16, 185, 129, 0.2)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>证候类术语</span>}
              value={syndromeCount}
              prefix={<BarChartOutlined style={{ color: '#10b981', fontSize: '28px' }} />}
              valueStyle={{ color: '#10b981', fontSize: '28px', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能卡片 */}
      <Row gutter={[20, 20]} className="mt-0">
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>数据概览</span>}
            className="h-full glass-panel"
            extra={<a href="/analytics" style={{ color: 'var(--primary-color)', fontWeight: 500, textDecoration: 'none' }}>查看详情 →</a>}
            headStyle={{ borderBottom: '1px solid rgba(99, 102, 241, 0.1)', padding: '20px 24px' }}
            bodyStyle={{ padding: '24px' }}
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
            title={<span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>快速操作</span>}
            className="h-full glass-panel"
            headStyle={{ borderBottom: '1px solid rgba(99, 102, 241, 0.1)', padding: '20px 24px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                }}
                onClick={() => navigate('/explorer')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <NodeIndexOutlined className="text-3xl mb-3" style={{ color: '#6366f1' }} />
                <h3 className="font-semibold text-gray-800 mb-1" style={{ fontSize: '16px' }}>图谱探索</h3>
                <p className="text-sm text-gray-600" style={{ fontSize: '13px' }}>可视化浏览知识图谱</p>
              </div>
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(245, 87, 108, 0.05) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                }}
                onClick={() => navigate('/search')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(245, 87, 108, 0.08) 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(236, 72, 153, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(245, 87, 108, 0.05) 100%)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <SearchOutlined className="text-3xl mb-3" style={{ color: '#ec4899' }} />
                <h3 className="font-semibold text-gray-800 mb-1" style={{ fontSize: '16px' }}>智能搜索</h3>
                <p className="text-sm text-gray-600" style={{ fontSize: '13px' }}>快速查找相关术语</p>
              </div>
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(0, 242, 254, 0.05) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                }}
                onClick={() => navigate('/analytics')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(0, 242, 254, 0.08) 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(0, 242, 254, 0.05) 100%)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <BarChartOutlined className="text-3xl mb-3" style={{ color: '#3b82f6' }} />
                <h3 className="font-semibold text-gray-800 mb-1" style={{ fontSize: '16px' }}>数据分析</h3>
                <p className="text-sm text-gray-600" style={{ fontSize: '13px' }}>深入分析数据结构</p>
              </div>
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 249, 215, 0.05) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                }}
                onClick={() => navigate('/visualizations')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 249, 215, 0.08) 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 249, 215, 0.05) 100%)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <BarChartOutlined className="text-3xl mb-3" style={{ color: '#10b981' }} />
                <h3 className="font-semibold text-gray-800 mb-1" style={{ fontSize: '16px' }}>高级可视化</h3>
                <p className="text-sm text-gray-600" style={{ fontSize: '13px' }}>3D视图、时间线、演化展示</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
