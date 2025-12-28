import { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: string | number
  icon?: ReactNode
  iconBg?: string
  iconColor?: string
  valueColor?: string
  subtitle?: string
  trend?: {
    value: string
    positive?: boolean
  }
}

export function StatCard({
  label,
  value,
  icon,
  iconBg = '#eff6ff',
  iconColor = '#3b82f6',
  valueColor = '#0f172a',
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {icon && (
          <div className="stat-icon" style={{ background: iconBg }}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="stat-value" style={{ color: valueColor }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      {(trend || subtitle) && (
        <div className="stat-footer">
          {trend && (
            <div className={`stat-trend ${trend.positive !== false ? 'positive' : 'negative'}`}>
              <span>{trend.value}</span>
            </div>
          )}
          {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        </div>
      )}

      <style jsx>{`
        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e9eef4;
        }
        
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .stat-label {
          font-size: 13px;
          color: #64748b;
        }
        
        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }
        
        .stat-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .stat-trend.positive {
          background: #ecfdf5;
          color: #10b981;
        }
        
        .stat-trend.negative {
          background: #fef2f2;
          color: #ef4444;
        }
        
        .stat-subtitle {
          color: #94a3b8;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}
