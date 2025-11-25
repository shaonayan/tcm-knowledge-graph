import React from 'react'
import { Layout } from 'antd'

const { Header } = Layout

export const AppHeader: React.FC = () => {
  return (
    <Header style={{ position: 'sticky', top: 0, zIndex: 1000, height: 0, padding: 0, minHeight: 0, lineHeight: 0 }} />
  )
}
