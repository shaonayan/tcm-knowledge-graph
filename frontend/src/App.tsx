import React, { Suspense, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppHeader } from './components/common/Header'
import { AppSider } from './components/common/Sider'
import { LoadingSpinner } from './components/common/Loading'
import { StartupScreen } from './components/common/StartupScreen'
import { Background } from './components/common/Background'

// 懒加载页面组件
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Explorer = React.lazy(() => import('./pages/Explorer'))
const Analytics = React.lazy(() => import('./pages/Analytics'))
const Visualizations = React.lazy(() => import('./pages/Visualizations'))
const NodeDetail = React.lazy(() => import('./pages/NodeDetail'))

const App: React.FC = () => {
  const [showStartup, setShowStartup] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowStartup(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AntApp>
      <ErrorBoundary>
        <StartupScreen visible={showStartup} />
        <Background />
        <div className="linear-shell">
          <AppSider />
          <div className="linear-main">
            <AppHeader />
            <div className="linear-content-shell">
              <div className="app-ambient">
                <span className="ambient ambient-one" />
                <span className="ambient ambient-two" />
                <span className="ambient ambient-three" />
              </div>
              <div className="linear-content-inner">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/explorer" element={<Explorer />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/visualizations" element={<Visualizations />} />
                    <Route path="/nodes/:code" element={<NodeDetail />} />
                    {/* 保留search路由以兼容旧链接，重定向到explorer */}
                    <Route path="/search" element={<Explorer />} />
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
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </AntApp>
  )
}

export default App
