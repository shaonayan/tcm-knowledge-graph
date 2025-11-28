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
    <div className="linear-page">
      <section className="linear-page-hero">
        <div>
          <p className="eyebrow">今日概览</p>
          <h1>少纳言知识图谱</h1>
          <p>Neo4j 实时驱动，自动同步 6,800+ 节点与 4.3 万关系，构建苹果式液态玻璃体验。</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="hero-actions__primary" onClick={() => navigate('/explorer')}>
            进入图谱
          </button>
          <button type="button" className="hero-actions__ghost" onClick={() => navigate('/visualizations')}>
            3D 可视化
          </button>
        </div>
      </section>

      <div className="linear-pill-row">
        <span>Neo4j Aura 实时在线</span>
        <span>节点 {stats?.totalNodes?.toLocaleString() ?? '--'}</span>
        <span>关系 {stats?.totalRelationships?.toLocaleString() ?? '--'}</span>
        <span>更新于 {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
      </div>

      <section className="linear-stat-row">
        {[
          {
            title: '总节点',
            value: stats?.totalNodes || 0,
            icon: <NodeIndexOutlined />,
            desc: '标准化术语'
          },
          {
            title: '总关系',
            value: stats?.totalRelationships || 0,
            icon: <BranchesOutlined />,
            desc: '语义连接'
          },
          {
            title: '疾病类术语',
            value: diseaseCount,
            icon: <SearchOutlined />,
            desc: `${diseasePercent.toFixed(1)}% 占比`
          },
          {
            title: '证候类术语',
            value: syndromeCount,
            icon: <BarChartOutlined />,
            desc: `${syndromePercent.toFixed(1)}% 占比`
          }
        ].map(card => (
          <article key={card.title} className="linear-stat-card">
            <div className="linear-stat-card__icon">{card.icon}</div>
            <div>
              <p>{card.title}</p>
              <h3>{card.value.toLocaleString()}</h3>
              <span>{card.desc}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="linear-panels-grid">
        <article className="linear-panel">
          <header>
            <div>
              <p className="eyebrow">数据体温</p>
              <h4>知识结构健康度</h4>
            </div>
            <button type="button" onClick={() => navigate('/analytics')}>
              查看分析
            </button>
          </header>
          <div className="linear-panel__progress">
            <label>疾病类术语</label>
            <Progress percent={Number(diseasePercent.toFixed(1))} strokeColor="#52c41a" showInfo={false} />
            <span>{diseaseCount.toLocaleString()} 条</span>
          </div>
          <div className="linear-panel__progress">
            <label>证候类术语</label>
            <Progress percent={Number(syndromePercent.toFixed(1))} strokeColor="#38bdf8" showInfo={false} />
            <span>{syndromeCount.toLocaleString()} 条</span>
          </div>
          <div className="linear-panel__progress">
            <label>数据完整性</label>
            <Progress percent={Number((stats?.dataCompleteness || 0).toFixed(1))} strokeColor="#fb7185" showInfo={false} />
            <span>{stats?.dataCompleteness?.toFixed(1) ?? 0}%</span>
          </div>
        </article>

        <article className="linear-panel linear-panel--actions">
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
                desc: '搜索节点并可视化知识图谱',
                icon: <NodeIndexOutlined />,
                action: () => navigate('/explorer')
              },
              {
                title: '数据分析',
                desc: '查看统计数据和分类分布',
                icon: <BarChartOutlined />,
                action: () => navigate('/analytics')
              },
              {
                title: '3D可视化',
                desc: '3D / Timeline / Evolution 模式',
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
