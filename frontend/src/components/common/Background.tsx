import React, { useState, useEffect } from 'react'

export const Background: React.FC = () => {
  const [bgLoaded, setBgLoaded] = useState(false)
  const [bgError, setBgError] = useState(false)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // 尝试加载背景图片（按优先级：PNG -> JPG -> GIF）
    const tryLoadBackground = (urls: string[], index: number = 0) => {
      if (index >= urls.length) {
        if (isMounted) {
          setBgError(true)
          setBgLoaded(false)
          console.warn('❌ 所有背景图片加载失败，使用CSS渐变')
        }
        return
      }

      const img = new Image()
      const bgUrl = urls[index]
      img.src = bgUrl
      
      // 设置超时，如果5秒内未加载则尝试下一个
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn(`⏱️ ${bgUrl} 加载超时，尝试下一个`)
          tryLoadBackground(urls, index + 1)
        }
      }, 5000)
      
      img.onload = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (isMounted) {
          setBgLoaded(true)
          setBgError(false)
          console.log(`✅ 背景图片加载成功: ${bgUrl}`)
          // 强制刷新背景显示
          setTimeout(() => {
            const bgElement = document.querySelector('[data-background-image]') as HTMLElement
            if (bgElement) {
              bgElement.style.backgroundImage = `url(${bgUrl})`
            }
          }, 100)
        }
      }
      
      img.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (isMounted) {
          console.warn(`❌ ${bgUrl} 加载失败，尝试下一个`)
          tryLoadBackground(urls, index + 1)
        }
      }
    }

    // 按优先级尝试加载
    tryLoadBackground(['/background.png', '/background.jpg', '/background.gif'])

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

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
      
      {/* 主要背景层 - 图片（如果加载成功） */}
      {bgLoaded && (
        <div
          data-background-image
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: 'url(/background.png), url(/background.jpg), url(/background.gif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            zIndex: -999,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.8s ease-in-out',
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

