import React from 'react'
import { Layout } from 'antd'
import {
  ThunderboltOutlined,
  CloudOutlined,
  DotChartOutlined
} from '@ant-design/icons'

const { Header } = Layout

export const AppHeader: React.FC = () => {
  const metaItems = [
    { icon: <CloudOutlined />, label: 'Neo4j Aura', value: '实时在线' },
    { icon: <DotChartOutlined />, label: '知识节点', value: '6,820+' },
    { icon: <ThunderboltOutlined />, label: '探索模式', value: '灵境视觉' }
  ]

  return (
    <Header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo">少</div>
        <div style={{ minWidth: 0, flex: '0 1 auto' }}>
          <div className="app-header__title">少纳言中医知识图谱</div>
          <div className="app-header__subtitle">Shonaoyan TCM Graph</div>
        </div>
      </div>
      <div className="app-header__meta">
        {metaItems.map(item => (
          <div key={item.label} className="app-header__chip" aria-label={item.label}>
            <span className="app-header__chip-icon">{item.icon}</span>
            <span className="app-header__chip-label">{item.label}</span>
            <span className="app-header__chip-value">{item.value}</span>
          </div>
        ))}
      </div>
    </Header>
  )
}
