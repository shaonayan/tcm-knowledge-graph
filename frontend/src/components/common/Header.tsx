import React from 'react'
import { SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'

export const AppHeader: React.FC = () => {
  return (
    <header className="linear-topbar">
      <div className="linear-topbar__trail">
        <span>少纳言 · 图谱控制台</span>
        <div className="linear-topbar__status">
          <span className="dot dot--active" />
          Neo4j Aura 实时在线
        </div>
      </div>
      <div className="linear-topbar__actions">
        <button className="linear-cmd-button" type="button">
          <SearchOutlined />
          <span>搜索 / 快捷命令</span>
          <kbd>⌘K</kbd>
        </button>
        <div className="linear-topbar__meta">
          <div>
            <span>节点</span>
            <strong>6,820+</strong>
          </div>
          <div>
            <span>关系</span>
            <strong>43,542</strong>
          </div>
          <div>
            <ThunderboltOutlined />
            <span>灵境视觉模式</span>
          </div>
        </div>
        <div className="linear-topbar__avatar" aria-label="Shonaoyan">
          SN
        </div>
      </div>
    </header>
  )
}
