import React from 'react'
import { ReactNode } from 'react'

interface PageHeaderProps {
  icon?: ReactNode
  iconText?: string
  title: string
  subtitle?: string
  description?: string
  extra?: ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  iconText,
  title,
  subtitle,
  description,
  extra,
  className = ''
}) => {
  return (
    <div className={`mb-10 ${className}`}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-5 flex-1 min-w-0">
          {(icon || iconText) && (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105" style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.2) inset'
            }}>
              {icon || (
                <span className="text-white font-bold text-2xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>{iconText}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold mb-2 leading-tight" style={{
              letterSpacing: '-0.02em',
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)'
            }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mb-2 leading-tight" style={{
                letterSpacing: '-0.01em',
                color: 'rgba(255, 255, 255, 0.7)',
                textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)'
              }}>{subtitle}</p>
            )}
            {description && (
              <p className="leading-relaxed text-base" style={{
                letterSpacing: '-0.01em',
                color: 'rgba(255, 255, 255, 0.8)',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)'
              }}>{description}</p>
            )}
          </div>
        </div>
        {extra && (
          <div className="flex-shrink-0">{extra}</div>
        )}
      </div>
    </div>
  )
}

