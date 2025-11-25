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
          className="fixed bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-r-2xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl"
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
          top: 72,
          height: 'calc(100vh - 72px)',
          zIndex: 999,
          overflow: 'hidden',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(254,247,240,0.92) 100%)',
          borderRight: collapsed ? 'none' : '1px solid rgba(220, 38, 38, 0.08)',
          boxShadow: collapsed ? 'none' : '0 20px 45px rgba(220, 38, 38, 0.08)',
          backdropFilter: collapsed ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: collapsed ? 'none' : 'blur(16px)',
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
              <h2 className="text-sm font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent m-0 tracking-wide">
                少纳言中医知识图谱
              </h2>
              <p className="text-xs text-gray-400 mt-1 m-0">Shonaoyan TCM</p>
            </div>
          )}

          {/* 折叠按钮 */}
          {!collapsed && (
            <div className="mb-4 flex justify-end">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
                onClick={handleToggle}
                title="收起侧边栏"
              >
                <MenuFoldOutlined className="text-gray-600" />
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
