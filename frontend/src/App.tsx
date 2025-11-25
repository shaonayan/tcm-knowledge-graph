import React, { Suspense, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppHeader } from './components/common/Header'
import { AppSider } from './components/common/Sider'
import { LoadingSpinner } from './components/common/Loading'

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

  return (
    <ErrorBoundary>
      <Layout className="min-h-screen">
        {/* 顶部导航栏 */}
        <AppHeader />
        
        <Layout style={{ position: 'relative', minHeight: 'calc(100vh - 72px)' }}>
          {/* 侧边导航栏 */}
          <AppSider collapsed={collapsed} onCollapse={setCollapsed} />
          
          {/* 主内容区域 */}
          <Content 
            className="transition-all duration-300 ease-in-out" 
            style={{ 
              minHeight: 'calc(100vh - 72px)',
              marginLeft: collapsed ? 0 : '260px',
              width: collapsed ? '100%' : 'calc(100% - 260px)',
              maxWidth: collapsed ? '100%' : 'calc(100% - 260px)',
              background: 'linear-gradient(135deg, #fef7f0 0%, #fef3e2 50%, #fff7ed 100%)',
              backgroundAttachment: 'fixed',
              position: 'relative',
              zIndex: 1,
              overflowX: 'hidden',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/search" element={<Search />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/visualizations" element={<Visualizations />} />
                <Route path="/nodes/:code" element={<NodeDetail />} />
                {/* 404页面 */}
                <Route path="*" element={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-400 mb-4">404</h1>
                      <p className="text-gray-500">页面未找到</p>
                    </div>
                  </div>
                } />
              </Routes>
            </Suspense>
          </Content>
        </Layout>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
