// 确保 React 最先加载 - 必须在所有其他导入之前
import React from 'react'
import ReactDOM from 'react-dom/client'

// 确保 graphlib 在全局可用（dagre 需要）
// 使用动态导入确保 CommonJS 模块正确加载
import * as graphlibModule from 'graphlib'
if (typeof window !== 'undefined') {
  // 确保 graphlib 的所有属性都被正确导出
  // graphlib 的导出结构：{ Graph, json, alg, version }
  const graphlib = (graphlibModule as any).default || graphlibModule
  (window as any).graphlib = graphlib
  
  // 验证 graphlib 结构
  if (!graphlib || !graphlib.Graph || !graphlib.alg) {
    console.error('graphlib 结构不完整:', graphlib)
  }
  
  // 同时确保 require 函数可用（dagre 内部使用）
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      if (id === 'graphlib') {
        return graphlib
      }
      throw new Error(`Cannot find module '${id}'`)
    }
  }
}

// 立即验证 React 是否正确加载
if (typeof React === 'undefined' || typeof React.createContext !== 'function') {
  const errorMsg = 'React 未正确加载，请检查依赖安装'
  console.error(errorMsg, { React, createContext: React?.createContext })
  document.body.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: sans-serif;">
      <h1 style="color: #ff4d4f;">React 加载失败</h1>
      <p style="color: #666; margin: 20px 0;">${errorMsg}</p>
      <p style="color: #999; font-size: 12px;">React: ${typeof React}, createContext: ${typeof React?.createContext}</p>
      <button onclick="location.reload()" style="padding: 10px 20px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
        刷新页面
      </button>
    </div>
  `
  throw new Error(errorMsg)
}

// 确保 React 已经加载后再导入其他依赖 React 的库
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Ant Design 必须在 React 之后导入
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App'
import './styles/globals.css'

// 配置dayjs中文
dayjs.locale('zh-cn')

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
})

// Ant Design主题配置
const theme = {
  token: {
    colorPrimary: '#52c41a', // 中医绿
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 6,
    fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, 微软雅黑, Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#f6ffed',
      itemSelectedColor: '#52c41a',
    },
    Card: {
      borderRadiusLG: 8,
    },
    Button: {
      borderRadius: 6,
    },
  },
}

// 确保DOM加载完成后再渲染
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider 
          locale={zhCN}
          theme={theme}
        >
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
