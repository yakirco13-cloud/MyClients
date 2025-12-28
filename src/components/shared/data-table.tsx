'use client'

import { ReactNode } from 'react'

// Column definition
export type Column<T> = {
  key: string
  header: string
  width?: string
  render?: (item: T, index: number) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyState?: ReactNode
  isLoading?: boolean
  loadingRows?: number
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  isLoading,
  loadingRows = 3,
}: DataTableProps<T>) {
  const gridTemplateColumns = columns.map(col => col.width || '1fr').join(' ')

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="table-header" style={{ gridTemplateColumns }}>
          {columns.map(col => (
            <div key={col.key} className="header-cell">{col.header}</div>
          ))}
        </div>
        {Array.from({ length: loadingRows }).map((_, i) => (
          <div key={i} className="table-row loading" style={{ gridTemplateColumns }}>
            {columns.map(col => (
              <div key={col.key} className="cell">
                <div className="skeleton" />
              </div>
            ))}
          </div>
        ))}
        <style jsx>{styles}</style>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className="table-container">
        {emptyState}
        <style jsx>{styles}</style>
      </div>
    )
  }

  return (
    <div className="table-container">
      {/* Header */}
      <div className="table-header" style={{ gridTemplateColumns }}>
        {columns.map(col => (
          <div key={col.key} className="header-cell">{col.header}</div>
        ))}
      </div>

      {/* Rows */}
      {data.map((item, index) => (
        <div
          key={keyExtractor(item)}
          className={`table-row ${onRowClick ? 'clickable' : ''}`}
          style={{ gridTemplateColumns }}
          onClick={() => onRowClick?.(item)}
        >
          {columns.map(col => (
            <div key={col.key} className="cell">
              {col.render 
                ? col.render(item, index) 
                : (item as Record<string, unknown>)[col.key] as ReactNode
              }
            </div>
          ))}
        </div>
      ))}

      <style jsx>{styles}</style>
    </div>
  )
}

const styles = `
  .table-container {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e9eef4;
    overflow: hidden;
  }
  
  .table-header {
    display: grid;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e9eef4;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .header-cell {
    text-align: right;
  }
  
  .table-row {
    display: grid;
    padding: 18px 24px;
    border-bottom: 1px solid #f1f5f9;
    align-items: center;
    transition: background 0.15s;
  }
  
  .table-row:last-child {
    border-bottom: none;
  }
  
  .table-row.clickable {
    cursor: pointer;
  }
  
  .table-row.clickable:hover {
    background: #f8fafc;
  }
  
  .table-row.loading {
    pointer-events: none;
  }
  
  .cell {
    font-size: 14px;
    color: #1e293b;
  }
  
  .skeleton {
    height: 16px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    width: 70%;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

// Helper components for table cells

type AvatarCellProps = {
  name: string
  subtitle?: string
  color?: string
  bgColor?: string
}

export function AvatarCell({ name, subtitle, color = '#3b82f6', bgColor = '#eff6ff' }: AvatarCellProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        background: bgColor,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '15px',
        flexShrink: 0,
      }}>
        {name.charAt(0)}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{name}</div>
        {subtitle && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

type BadgeCellProps = {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
}

export function BadgeCell({ label, variant = 'default' }: BadgeCellProps) {
  const styles: Record<string, { bg: string; color: string }> = {
    success: { bg: '#ecfdf5', color: '#10b981' },
    warning: { bg: '#fefce8', color: '#ca8a04' },
    error: { bg: '#fef2f2', color: '#ef4444' },
    info: { bg: '#eff6ff', color: '#3b82f6' },
    default: { bg: '#f1f5f9', color: '#64748b' },
  }
  
  const style = styles[variant]
  
  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      background: style.bg,
      color: style.color,
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

type ActionsCellProps = {
  children: ReactNode
}

export function ActionsCell({ children }: ActionsCellProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      {children}
    </div>
  )
}

type ActionButtonProps = {
  icon: ReactNode
  onClick: (e: React.MouseEvent) => void
  variant?: 'default' | 'success' | 'danger'
  title?: string
}

export function ActionButton({ icon, onClick, variant = 'default', title }: ActionButtonProps) {
  const styles: Record<string, { bg: string; color: string; hoverBg: string }> = {
    default: { bg: '#f1f5f9', color: '#64748b', hoverBg: '#e2e8f0' },
    success: { bg: '#ecfdf5', color: '#10b981', hoverBg: '#d1fae5' },
    danger: { bg: '#fef2f2', color: '#ef4444', hoverBg: '#fee2e2' },
  }
  
  const style = styles[variant]
  
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onClick(e)
      }}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: style.bg,
        color: style.color,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  )
}
