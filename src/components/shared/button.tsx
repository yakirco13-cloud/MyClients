'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'full-width' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="spinner" />
      ) : icon ? (
        <span className="btn-icon">{icon}</span>
      ) : null}
      {children}

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          white-space: nowrap;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .full-width {
          width: 100%;
        }
        
        /* Sizes */
        .btn-sm {
          padding: 8px 14px;
          font-size: 13px;
        }
        
        .btn-md {
          padding: 12px 20px;
          font-size: 14px;
        }
        
        .btn-lg {
          padding: 14px 28px;
          font-size: 15px;
        }
        
        /* Variants */
        .btn-primary {
          background: #0ea5e9;
          color: #fff;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #0284c7;
        }
        
        .btn-secondary {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
          color: #475569;
        }
        
        .btn-outline {
          background: transparent;
          color: #0ea5e9;
          border: 1px solid #0ea5e9;
        }
        
        .btn-outline:hover:not(:disabled) {
          background: #f0f9ff;
        }
        
        .btn-ghost {
          background: transparent;
          color: #64748b;
        }
        
        .btn-ghost:hover:not(:disabled) {
          background: #f1f5f9;
        }
        
        .btn-danger {
          background: #ef4444;
          color: #fff;
        }
        
        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }
        
        .btn :global(.spinner) {
          animation: spin 1s linear infinite;
        }
        
        .btn-icon {
          display: flex;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
