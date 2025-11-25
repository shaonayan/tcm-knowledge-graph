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
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-xl">少</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2 leading-tight">
              少纳言中医知识图谱
            </h1>
            <p className="text-sm text-gray-500 mb-3 leading-tight">Shonaoyan TCM Knowledge Graph</p>
            <p className="text-gray-600 leading-relaxed">
              欢迎使用少纳言中医知识图谱系统，探索传统中医的智慧宝库
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <Statistic
              title="总节点数"
              value={stats?.totalNodes || 0}
              prefix={<NodeIndexOutlined className="text-primary-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <Statistic
              title="关系数量"
              value={stats?.totalRelationships || 0}
              prefix={<BranchesOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <Statistic
              title="疾病类术语"
              value={diseaseCount}
              prefix={<SearchOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <Statistic
              title="证候类术语"
              value={syndromeCount}
              prefix={<BarChartOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能卡片 */}
      <Row gutter={[16, 16]} className="mt-0">
        <Col xs={24} lg={12}>
          <Card 
            title="数据概览" 
            className="h-full"
            extra={<a href="/analytics">查看详情</a>}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>疾病类术语</span>
                  <span>{diseaseCount.toLocaleString()} 条</span>
                </div>
                <Progress percent={Number(diseasePercent.toFixed(1))} strokeColor="#52c41a" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>证候类术语</span>
                  <span>{syndromeCount.toLocaleString()} 条</span>
                </div>
                <Progress percent={Number(syndromePercent.toFixed(1))} strokeColor="#1890ff" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>数据完整性</span>
                  <span>{stats?.dataCompleteness.toFixed(1) || 0}%</span>
                </div>
                <Progress 
                  percent={Number((stats?.dataCompleteness || 0).toFixed(1))} 
                  strokeColor="#fa8c16" 
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="快速操作" 
            className="h-full"
          >
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-4 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors" 
                onClick={() => navigate('/explorer')}
              >
                <NodeIndexOutlined className="text-2xl text-primary-500 mb-2" />
                <h3 className="font-medium text-gray-800 mb-1">图谱探索</h3>
                <p className="text-sm text-gray-600">可视化浏览知识图谱</p>
              </div>
              <div 
                className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => navigate('/search')}
              >
                <SearchOutlined className="text-2xl text-blue-500 mb-2" />
                <h3 className="font-medium text-gray-800 mb-1">智能搜索</h3>
                <p className="text-sm text-gray-600">快速查找相关术语</p>
              </div>
              <div 
                className="p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => navigate('/analytics')}
              >
                <BarChartOutlined className="text-2xl text-orange-500 mb-2" />
                <h3 className="font-medium text-gray-800 mb-1">数据分析</h3>
                <p className="text-sm text-gray-600">深入分析数据结构</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => navigate('/visualizations')}>
                <BarChartOutlined className="text-2xl text-purple-500 mb-2" />
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
