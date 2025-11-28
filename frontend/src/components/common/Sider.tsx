import React from 'react'
import {
  HomeOutlined,
  NodeIndexOutlined,
  SearchOutlined,
  BarChartOutlined,
  ExperimentOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/explorer', icon: <NodeIndexOutlined />, label: '智能探索' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '数据分析' },
  { key: '/visualizations', icon: <ExperimentOutlined />, label: '3D可视化' }
]

export const AppSider: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="linear-sidebar">
      <div className="linear-sidebar__brand">
        <div className="linear-sidebar__logo">SN</div>
        <div>
          <p>少纳言</p>
          <span>TCM Graph OS</span>
        </div>
      </div>

      <nav className="linear-sidebar__nav">
        {menuItems.map(item => (
          <button
            key={item.key}
            type="button"
            className={`linear-sidebar__nav-item ${location.pathname === item.key ? 'is-active' : ''}`}
            onClick={() => navigate(item.key)}
          >
            <span className="linear-sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="linear-sidebar__bottom">
        <button type="button" className="linear-sidebar__command">
          打开命令面板
          <kbd>⌘K</kbd>
        </button>
        <p>渲染引擎：Neo4j Aura · Render API</p>
      </div>
    </aside>
  )
}
