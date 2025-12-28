'use client'

import { ReactNode } from 'react'

// Shimmer skeleton for loading states
export function Shimmer({ width = '100%', height = 20, borderRadius = 8 }: {
  width?: string | number
  height?: string | number
  borderRadius?: number
}) {
  return (
    <div
      className="shimmer"
      style={{
        width,
        height,
        borderRadius,
      }}
    >
      <style jsx>{`
        .shimmer {
          background: linear-gradient(
            90deg,
            #f1f5f9 0%,
            #e2e8f0 20%,
            #f1f5f9 40%,
            #f1f5f9 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  )
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e9eef4',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Shimmer width={100} height={14} />
        <Shimmer width={44} height={44} borderRadius={12} />
      </div>
      <Shimmer width={80} height={32} />
      <div style={{ marginTop: '12px' }}>
        <Shimmer width={120} height={12} />
      </div>
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `2fr repeat(${columns - 1}, 1fr)`,
      padding: '18px 24px',
      borderBottom: '1px solid #f1f5f9',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Shimmer width={44} height={44} borderRadius={10} />
        <div>
          <Shimmer width={120} height={14} />
          <div style={{ marginTop: '6px' }}>
            <Shimmer width={80} height={12} />
          </div>
        </div>
      </div>
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <Shimmer key={i} width={80} height={14} />
      ))}
    </div>
  )
}

// Page loading skeleton
export function PageSkeleton({ stats = 3, rows = 4 }: { stats?: number; rows?: number }) {
  return (
    <div className="page-skeleton">
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stats}, 1fr)`,
        gap: '20px',
        marginBottom: '28px',
      }}>
        {Array.from({ length: stats }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '16px',
      }}>
        <Shimmer width={300} height={48} borderRadius={10} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Shimmer width={140} height={48} borderRadius={10} />
          <Shimmer width={120} height={48} borderRadius={10} />
        </div>
      </div>

      {/* Table skeleton */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e9eef4',
        }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} width={60} height={12} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={5} />
        ))}
      </div>

      <style jsx>{`
        .page-skeleton {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Fade wrapper for smooth transitions
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div
      className="fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
      <style jsx>{`
        .fade-in {
          animation: fadeSlideIn 0.4s ease forwards;
          opacity: 0;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
