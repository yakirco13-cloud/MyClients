import { ReactNode } from 'react'

type StatsGridProps = {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function StatsGrid({ children, columns = 3 }: StatsGridProps) {
  return (
    <div className="stats-grid">
      {children}

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }
        
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
