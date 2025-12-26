'use client'

import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

// ===================
// BUTTON COMPONENT
// ===================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, variant = 'primary', size = 'md', disabled, style, ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: '10px',
      fontWeight: 500,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.7 : 1,
      border: 'none',
      transition: 'all 0.15s ease',
      fontFamily: 'inherit',
    }

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '8px 14px', fontSize: '13px' },
      md: { padding: '12px 20px', fontSize: '14px' },
      lg: { padding: '14px 28px', fontSize: '15px' },
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: { background: '#0ea5e9', color: '#fff' },
      secondary: { background: '#f1f5f9', color: '#64748b' },
      danger: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' },
      ghost: { background: 'transparent', color: '#64748b' },
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading && <Loader2 size={size === 'sm' ? 14 : 18} style={{ animation: 'spin 1s linear infinite' }} />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ===================
// SKELETON COMPONENT
// ===================
interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}

// ===================
// CARD SKELETON
// ===================
export function CardSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e9eef4',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Skeleton width={100} height={16} />
        <Skeleton width={44} height={44} borderRadius={12} />
      </div>
      <Skeleton width={80} height={36} style={{ marginBottom: '12px' }} />
      <Skeleton width={120} height={14} />
    </div>
  )
}

// ===================
// TABLE ROW SKELETON
// ===================
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      padding: '18px 24px',
      borderBottom: '1px solid #f1f5f9',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width={44} height={44} borderRadius={10} />
        <div>
          <Skeleton width={120} height={14} style={{ marginBottom: '6px' }} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <Skeleton key={i} width={80} height={14} />
      ))}
    </div>
  )
}

// ===================
// PAGE LOADER
// ===================
export function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <Loader2 size={32} color="#0ea5e9" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontSize: '14px' }}>טוען...</span>
      </div>
    </div>
  )
}

// ===================
// EMPTY STATE
// ===================
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        color: '#94a3b8',
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: action ? '24px' : '0' }}>
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ===================
// BADGE COMPONENT
// ===================
interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  children: React.ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variants: Record<string, React.CSSProperties> = {
    success: { background: '#ecfdf5', color: '#10b981' },
    warning: { background: '#fefce8', color: '#ca8a04' },
    danger: { background: '#fef2f2', color: '#ef4444' },
    info: { background: '#eff6ff', color: '#3b82f6' },
    default: { background: '#f1f5f9', color: '#64748b' },
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      ...variants[variant],
    }}>
      {children}
    </span>
  )
}

// ===================
// INPUT COMPONENT
// ===================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
    return (
      <div style={{ marginBottom: '16px' }}>
        {label && (
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748b',
            marginBottom: '8px',
          }}>
            {label}
          </label>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#fff',
          border: `1px solid ${error ? '#fecaca' : '#e9eef4'}`,
          borderRadius: '10px',
          padding: '12px 16px',
        }}>
          {icon && <span style={{ color: '#94a3b8' }}>{icon}</span>}
          <input
            ref={ref}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              background: 'transparent',
              fontFamily: 'inherit',
              ...style,
            }}
            {...props}
          />
        </div>
        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ===================
// MODAL COMPONENT
// ===================
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  const sizes = {
    sm: '400px',
    md: '500px',
    lg: '700px',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: sizes[size],
          maxHeight: '90vh',
          overflow: 'auto',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: '24px',
        }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

// ===================
// GLOBAL STYLES (add to globals.css)
// ===================
export const globalAnimations = `
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
`