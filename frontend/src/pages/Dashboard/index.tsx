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
    <div className="page-wrapper dashboard-human-shell" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <PageHeader
        icon={<BranchesOutlined />}
        title="少纳言中医知识图谱"
        subtitle="Shonaoyan Lab · 2025"
        description="一个持续迭代的数字草本实验室，实时同步 Neo4j Aura 数据，再现 6,000+ 节点与 4 万余条联系。"
        extra={
          <div className="hero-actions">
            <button type="button" className="hero-actions__primary" onClick={() => navigate('/explorer')}>
              立即探索
            </button>
            <button type="button" className="hero-actions__ghost" onClick={() => navigate('/visualizations')}>
              高级可视化
            </button>
          </div>
        }
      />

      <div className="hero-pill-row">
        <span>Neo4j Aura 实时在线</span>
        <span>节点 {stats?.totalNodes?.toLocaleString() ?? '--'}</span>
        <span>关系 {stats?.totalRelationships?.toLocaleString() ?? '--'}</span>
        <span>更新 {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
      </div>

      <section className="human-stat-cluster">
        {[
          {
            title: '总节点',
            value: stats?.totalNodes || 0,
            icon: <NodeIndexOutlined />,
            annotation: '标准化术语',
            accent: 'indigo'
          },
          {
            title: '关系数量',
            value: stats?.totalRelationships || 0,
            icon: <BranchesOutlined />,
            annotation: '语义边',
            accent: 'purple'
          },
          {
            title: '疾病类术语',
            value: diseaseCount,
            icon: <SearchOutlined />,
            annotation: `${diseasePercent.toFixed(1)}% 占比`,
            accent: 'cyan'
          },
          {
            title: '证候类术语',
            value: syndromeCount,
            icon: <BarChartOutlined />,
            annotation: `${syndromePercent.toFixed(1)}% 占比`,
            accent: 'pink'
          }
        ].map(card => (
          <article key={card.title} className={`stat-human-card stat-human-card--${card.accent}`}>
            <div className="stat-human-card__icon">{card.icon}</div>
            <div>
              <p>{card.title}</p>
              <h3>{card.value.toLocaleString()}</h3>
              <span>{card.annotation}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="human-panels-grid">
        <article className="human-panel">
          <header>
            <div>
              <p className="eyebrow">数据体温</p>
              <h4>知识结构健康度</h4>
            </div>
            <button type="button" onClick={() => navigate('/analytics')}>
              查看分析
            </button>
          </header>
          <div className="human-panel__progress">
            <label>疾病类术语</label>
            <Progress percent={Number(diseasePercent.toFixed(1))} strokeColor="#52c41a" showInfo={false} />
            <span>{diseaseCount.toLocaleString()} 条</span>
          </div>
          <div className="human-panel__progress">
            <label>证候类术语</label>
            <Progress percent={Number(syndromePercent.toFixed(1))} strokeColor="#38bdf8" showInfo={false} />
            <span>{syndromeCount.toLocaleString()} 条</span>
          </div>
          <div className="human-panel__progress">
            <label>数据完整性</label>
            <Progress percent={Number((stats?.dataCompleteness || 0).toFixed(1))} strokeColor="#fb7185" showInfo={false} />
            <span>{stats?.dataCompleteness?.toFixed(1) ?? 0}%</span>
          </div>
        </article>

        <article className="human-panel human-panel--actions">
          <header>
            <div>
              <p className="eyebrow">工作流</p>
              <h4>本周推荐入口</h4>
            </div>
          </header>
          <div className="actions-list">
            {[
              {
                title: '图谱探索',
                desc: '以 3D 方式漫游节点与连接',
                icon: <NodeIndexOutlined />,
                action: () => navigate('/explorer')
              },
              {
                title: '智能搜索',
                desc: '输入关键字，定位语义上下文',
                icon: <SearchOutlined />,
                action: () => navigate('/search')
              },
              {
                title: '高级可视化',
                desc: '切换 3D / Timeline / Evolution 模式',
                icon: <BarChartOutlined />,
                action: () => navigate('/visualizations')
              }
            ].map(item => (
              <button key={item.title} className="actions-list__item" type="button" onClick={item.action}>
                <span className="actions-list__icon">{item.icon}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
                <span className="actions-list__chevron">→</span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}

export default Dashboard
