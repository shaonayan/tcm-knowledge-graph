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
    <div className={`mb-8 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {(icon || iconText) && (
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 transition-all hover:scale-105 hover:shadow-xl">
              {icon || (
                <span className="text-white font-bold text-xl">{iconText}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mb-3 leading-tight">{subtitle}</p>
            )}
            {description && (
              <p className="text-gray-600 leading-relaxed">{description}</p>
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

