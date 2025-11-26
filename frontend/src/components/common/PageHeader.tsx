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
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105" style={{
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3), 0 1px 0 rgba(255, 255, 255, 0.3) inset'
            }}>
              {icon || (
                <span className="text-white font-bold text-2xl">{iconText}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight" style={{
              letterSpacing: '-0.02em',
              fontWeight: 700
            }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mb-2 leading-tight" style={{
                letterSpacing: '-0.01em'
              }}>{subtitle}</p>
            )}
            {description && (
              <p className="text-gray-600 leading-relaxed text-base" style={{
                letterSpacing: '-0.01em'
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

