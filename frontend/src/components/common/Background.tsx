import React, { useState, useEffect } from 'react'

export const Background: React.FC = () => {
  const [bgLoaded, setBgLoaded] = useState(false)
  const [bgError, setBgError] = useState(false)

  useEffect(() => {
    // 尝试加载背景GIF
    const img = new Image()
    const bgUrl = '/background.gif'
    img.src = bgUrl
    
    // 设置超时，如果5秒内未加载则使用备用方案
    const timeout = setTimeout(() => {
      if (!bgLoaded) {
        setBgError(true)
        console.warn('⏱️ 背景GIF加载超时，使用备用方案')
      }
    }, 5000)
    
    img.onload = () => {
      clearTimeout(timeout)
      setBgLoaded(true)
      setBgError(false)
      console.log('✅ 背景GIF加载成功')
      // 强制刷新背景显示
      setTimeout(() => {
        const bgElement = document.querySelector('[data-background-gif]') as HTMLElement
        if (bgElement) {
          bgElement.style.display = 'none'
          setTimeout(() => {
            bgElement.style.display = 'block'
          }, 10)
        }
      }, 100)
    }
    
    img.onerror = () => {
      clearTimeout(timeout)
      setBgError(true)
      setBgLoaded(false)
      console.warn('❌ 背景GIF加载失败，使用备用方案')
    }
    
    return () => clearTimeout(timeout)
  }, [bgLoaded])

  return (
    <>
      {/* 基础渐变背景（始终显示，作为备用） */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 15s ease infinite',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
      />
      
      {/* 主要背景层 - GIF（如果加载成功） */}
      {bgLoaded && (
        <div
          data-background-gif
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: 'url(/background.gif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            zIndex: -999,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.8s ease-in-out',
            filter: 'brightness(1.15) contrast(1.1) saturate(1.1)',
            willChange: 'opacity'
          }}
        />
      )}
      
      {/* 备用背景层 - CSS动画渐变（如果GIF加载失败） */}
      {bgError && (
        <div
          className="animated-background"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -3,
            pointerEvents: 'none',
            opacity: 0.9,
            transition: 'opacity 0.5s ease-in-out'
          }}
        />
      )}
    </>
  )
}

