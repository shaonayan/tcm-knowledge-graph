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
        const errorMessage = err instanceof Error ? err.message : '获取数据失败'
        setError(errorMessage)
        console.error('❌ 获取统计数据失败:', err)
        console.error('错误详情:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined
        })
        // 输出API地址帮助调试
        console.error('当前API地址:', import.meta.env.VITE_API_URL || '使用默认值')
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
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 80px)' }}>
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
              background: 'rgba(0, 0, 0, 0.3)',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: 500 }}>总节点数</span>}
              value={stats?.totalNodes || 0}
              prefix={<NodeIndexOutlined style={{ color: '#ffffff', fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: 500 }}>关系数量</span>}
              value={stats?.totalRelationships || 0}
              prefix={<BranchesOutlined style={{ color: '#ffffff', fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: 500 }}>疾病类术语</span>}
              value={diseaseCount}
              prefix={<SearchOutlined style={{ color: '#ffffff', fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="text-center glass-panel stat-card-modern"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: 500 }}>证候类术语</span>}
              value={syndromeCount}
              prefix={<BarChartOutlined style={{ color: '#ffffff', fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能卡片 */}
      <Row gutter={[20, 20]} className="mt-0">
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>数据概览</span>}
            className="h-full glass-panel"
            extra={<a href="/analytics" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, textDecoration: 'none', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>查看详情 →</a>}
            headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px 24px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>疾病类术语</span>
                  <span style={{ color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>{diseaseCount.toLocaleString()} 条</span>
                </div>
                <Progress 
                  percent={Number(diseasePercent.toFixed(1))} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>证候类术语</span>
                  <span style={{ color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>{syndromeCount.toLocaleString()} 条</span>
                </div>
                <Progress 
                  percent={Number(syndromePercent.toFixed(1))} 
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>数据完整性</span>
                  <span style={{ color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>{stats?.dataCompleteness.toFixed(1) || 0}%</span>
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
            title={<span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>快速操作</span>}
            className="h-full glass-panel"
            headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px 24px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onClick={() => navigate('/explorer')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <NodeIndexOutlined className="text-3xl mb-3" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />
                <h3 className="font-semibold mb-1" style={{ fontSize: '16px', color: '#ffffff', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>图谱探索</h3>
                <p className="text-sm" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' }}>可视化浏览知识图谱</p>
              </div>
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onClick={() => navigate('/search')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <SearchOutlined className="text-3xl mb-3" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />
                <h3 className="font-semibold mb-1" style={{ fontSize: '16px', color: '#ffffff', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>智能搜索</h3>
                <p className="text-sm" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' }}>快速查找相关术语</p>
              </div>
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onClick={() => navigate('/analytics')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <BarChartOutlined className="text-3xl mb-3" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />
                <h3 className="font-semibold mb-1" style={{ fontSize: '16px', color: '#ffffff', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>数据分析</h3>
                <p className="text-sm" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' }}>深入分析数据结构</p>
              </div>
              <div 
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onClick={() => navigate('/visualizations')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <BarChartOutlined className="text-3xl mb-3" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />
                <h3 className="font-semibold mb-1" style={{ fontSize: '16px', color: '#ffffff', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>高级可视化</h3>
                <p className="text-sm" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' }}>3D视图、时间线、演化展示</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
