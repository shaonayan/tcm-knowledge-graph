import React from 'react'

export const Background: React.FC = () => {
  return (
    <>
      {/* 层级1: 最底层 - 背景图片 */}
      <div
        id="main-background"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f5e6e8',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
      />
      {/* 层级2: 淡色遮罩层 - 让背景图变浅变柔和 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255, 240, 245, 0.6) 0%, rgba(255, 245, 250, 0.5) 50%, rgba(255, 240, 245, 0.4) 100%)',
          zIndex: -999,
          pointerEvents: 'none'
        }}
      />
    </>
  )
}
