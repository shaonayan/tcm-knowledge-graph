import React from 'react'
import { Spin } from 'antd'

interface LoadingSpinnerProps {
  tip?: string
  fullScreen?: boolean
  size?: 'small' | 'default' | 'large'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  tip = '加载中...', 
  fullScreen = false,
  size = 'large'
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <Spin size={size} tip={tip} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-64">
      <Spin size={size} tip={tip} />
    </div>
  )
}

// 页面级加载组件
export const PageLoading: React.FC<{ tip?: string }> = ({ tip = '页面加载中...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">{tip}</p>
      </div>
    </div>
  )
}
