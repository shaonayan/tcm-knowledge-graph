import React, { useState, useEffect, useRef } from 'react'
import { Layout, Menu } from 'antd'
import { 
  HomeOutlined, 
  NodeIndexOutlined, 
  SearchOutlined, 
  BarChartOutlined, 
  ExperimentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

interface AppSiderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const AppSider: React.FC<AppSiderProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isHovering, setIsHovering] = useState(false)
  const siderRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false)

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页仪表板',
    },
    {
      key: '/explorer',
      icon: <NodeIndexOutlined />,
      label: '图谱探索器',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '智能搜索',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/visualizations',
      icon: <ExperimentOutlined />,
      label: '高级可视化',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  // 悬停展开逻辑
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsHovering(true)
    // 只有在收起状态且非手动展开时才通过悬停展开
    if (collapsed && !isManuallyExpanded) {
      onCollapse(false)
    }
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsHovering(false)
    // 延迟收起，给用户时间移动鼠标
    // 只有在非手动展开的情况下才自动收起
    timeoutRef.current = setTimeout(() => {
      if (!isManuallyExpanded && !collapsed) {
        onCollapse(true)
      }
    }, 1000) // 延迟1秒，给用户更多时间
  }

  // 点击切换
  const handleToggle = () => {
    const newCollapsed = !collapsed
    onCollapse(newCollapsed)
    setIsManuallyExpanded(!newCollapsed) // 如果展开，标记为手动展开
    if (newCollapsed) {
      setIsManuallyExpanded(false) // 如果收起，清除手动展开标记
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* 触发按钮 - 当收起时显示在左侧边缘 */}
      {collapsed && (
        <div
          className="fixed rounded-r-2xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderLeft: 'none'
          }}
          style={{
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            marginTop: '36px'
          }}
          onMouseEnter={handleMouseEnter}
          onClick={handleToggle}
          title="展开侧边栏"
        >
          <MenuUnfoldOutlined className="text-white text-base" />
        </div>
      )}

      <Sider
        ref={siderRef}
        width={260}
        collapsed={collapsed}
        collapsedWidth={0}
        collapsible
        trigger={null}
        className="transition-all duration-300 ease-in-out"
        theme="light"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed',
          left: 0,
          top: 80,
          height: 'calc(100vh - 80px)',
          zIndex: 999,
          overflow: 'hidden',
          overflowY: 'auto',
          background: collapsed ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
          borderRight: collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: collapsed ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: collapsed ? 'none' : 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: collapsed ? 'none' : 'blur(20px) saturate(180%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto'
        }}
      >
        <div className="p-4 h-full flex flex-col">
          {/* 标题区域 */}
          {!collapsed && (
            <div className="text-center mb-6 flex-shrink-0">
              <h2 className="text-sm font-bold text-white m-0 tracking-wide" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                少纳言中医知识图谱
              </h2>
              <p className="text-xs mt-1 m-0" style={{ color: 'rgba(255, 255, 255, 0.7)', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>Shonaoyan TCM</p>
            </div>
          )}

          {/* 折叠按钮 */}
          {!collapsed && (
            <div className="mb-4 flex justify-end">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onClick={handleToggle}
                title="收起侧边栏"
              >
                <MenuFoldOutlined style={{ color: '#ffffff' }} />
              </div>
            </div>
          )}
          
          {/* 菜单 */}
          <div className="flex-1 overflow-auto">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              className="border-none"
              inlineCollapsed={false}
            />
          </div>
        </div>
      </Sider>
    </>
  )
}
