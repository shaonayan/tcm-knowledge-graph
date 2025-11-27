import React, { ReactNode } from 'react'

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
  const hasIcon = Boolean(icon || iconText)

  return (
    <section className={`page-header-shell ${className}`}>
      <div className="page-header-shell__content">
        {hasIcon && (
          <div className="page-header-shell__icon" aria-hidden="true">
            {icon || <span>{iconText}</span>}
          </div>
        )}

        <div className="page-header-shell__copy">
          {subtitle && <p className="page-header-shell__eyebrow">{subtitle}</p>}
          <h1 className="page-header-shell__title">{title}</h1>
          {description && <p className="page-header-shell__description">{description}</p>}
        </div>

        {extra && <div className="page-header-shell__extra">{extra}</div>}
      </div>
    </section>
  )
}

