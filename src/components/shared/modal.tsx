'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
  maxWidth?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = '500px',
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            {icon && <span className="modal-icon">{icon}</span>}
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
          animation: fadeIn 0.15s ease;
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
        
        .modal-content {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
          animation: slideUp 0.2s ease;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .modal-icon {
          color: #6366f1;
          display: flex;
        }
        
        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        
        .modal-close {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.15s;
        }
        
        .modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        
        .modal-body {
          padding: 28px;
        }
      `}</style>
    </div>
  )
}
