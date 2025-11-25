import React from 'react'
import { Spin } from 'antd'

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <Spin size="large" tip="加载中..." />
    </div>
  )
}
