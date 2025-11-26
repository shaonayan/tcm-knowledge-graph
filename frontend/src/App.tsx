import React, { Suspense, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppHeader } from './components/common/Header'
import { AppSider } from './components/common/Sider'
import { LoadingSpinner } from './components/common/Loading'
import { StartupScreen } from './components/common/StartupScreen'
import { Background } from './components/common/Background'

// 懒加载页面组件
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Explorer = React.lazy(() => import('./pages/Explorer'))
const Search = React.lazy(() => import('./pages/Search'))
const Analytics = React.lazy(() => import('./pages/Analytics'))
const Visualizations = React.lazy(() => import('./pages/Visualizations'))
const NodeDetail = React.lazy(() => import('./pages/NodeDetail'))

const { Content } = Layout

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true) // 默认收起
  const [showStartup, setShowStartup] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowStartup(false), 2500) // 延长显示时间，让用户能看到完整的动画
    return () => clearTimeout(timer)
  }, [])

  return (
    <ErrorBoundary>
      <StartupScreen visible={showStartup} />
      <Background />
      <Layout className="min-h-screen app-shell" style={{ background: 'transparent' }}>
        {/* 顶部导航栏 */}
        <AppHeader />
        
        <Layout style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', background: 'transparent' }}>
          {/* 侧边导航栏 */}
          <AppSider collapsed={collapsed} onCollapse={setCollapsed} />
          
          {/* 主内容区域 */}
          <Content
            className="transition-all duration-300 ease-in-out app-content-surface"
            style={{
              minHeight: 'calc(100vh - 80px)',
              marginLeft: collapsed ? 0 : '260px',
              width: collapsed ? '100%' : 'calc(100% - 260px)',
              maxWidth: collapsed ? '100%' : 'calc(100% - 260px)',
            }}
          >
            <div className="app-ambient">
              <span className="ambient ambient-one" />
              <span className="ambient ambient-two" />
              <span className="ambient ambient-three" />
            </div>
            <div className="app-content-inner">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/explorer" element={<Explorer />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/visualizations" element={<Visualizations />} />
                  <Route path="/nodes/:code" element={<NodeDetail />} />
                  {/* 404页面 */}
                  <Route
                    path="*"
                    element={
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold mb-4" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>404</h1>
                          <p style={{ color: 'rgba(255, 255, 255, 0.7)', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>页面未找到</p>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
