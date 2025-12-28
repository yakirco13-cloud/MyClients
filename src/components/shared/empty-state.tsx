import { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {icon}
      </div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && (
        <button className="empty-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}

      <style jsx>{`
        .empty-state {
          text-align: center;
          padding: 60px 24px;
          color: #94a3b8;
        }
        
        .empty-icon {
          opacity: 0.4;
          margin-bottom: 16px;
        }
        
        .empty-icon :global(svg) {
          width: 48px;
          height: 48px;
        }
        
        .empty-title {
          font-size: 16px;
          font-weight: 500;
          color: #64748b;
          margin: 0 0 8px 0;
        }
        
        .empty-description {
          font-size: 14px;
          color: #94a3b8;
          margin: 0 0 20px 0;
        }
        
        .empty-action {
          padding: 10px 20px;
          border-radius: 8px;
          background: #0ea5e9;
          color: #fff;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        
        .empty-action:hover {
          background: #0284c7;
        }
      `}</style>
    </div>
  )
}
