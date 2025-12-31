'use client'

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

type BaseProps = {
  label: string
  icon?: ReactNode
  error?: string
  hint?: string
}

type InputProps = BaseProps & {
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password'
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  dir?: 'rtl' | 'ltr'
}

type SelectProps = BaseProps & {
  type: 'select'
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

type TextareaProps = BaseProps & {
  type: 'textarea'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}

type FormFieldProps = InputProps | SelectProps | TextareaProps

export function FormField(props: FormFieldProps) {
  const { label, icon, error, hint } = props

  const renderInput = () => {
    if (props.type === 'select') {
      const { value, onChange, options, placeholder, required, disabled } = props
      return (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={`form-input form-select ${error ? 'has-error' : ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (props.type === 'textarea') {
      const { value, onChange, placeholder, required, disabled, rows = 3 } = props
      return (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`form-input form-textarea ${error ? 'has-error' : ''}`}
        />
      )
    }

    const { type = 'text', value, onChange, placeholder, required, disabled, dir = 'rtl' } = props
    return (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        dir={dir}
        min={type === 'date' ? '2020-01-01' : undefined}
        max={type === 'date' ? '2035-12-31' : undefined}
        className={`form-input ${error ? 'has-error' : ''} ${icon ? 'has-icon' : ''}`}
        style={{
          paddingRight: icon && dir === 'rtl' ? '44px' : undefined,
          paddingLeft: icon && dir === 'ltr' ? '44px' : undefined,
          textAlign: dir === 'ltr' ? 'left' : 'right',
        }}
      />
    )
  }

  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {props.type !== 'select' && props.type !== 'textarea' && props.required && (
          <span className="required-mark"> *</span>
        )}
      </label>
      
      <div className="input-wrapper">
        {icon && (
          <div className="input-icon">
            {icon}
          </div>
        )}
        {renderInput()}
      </div>
      
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}

      <style jsx>{`
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }
        
        .required-mark {
          color: #ef4444;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          display: flex;
          pointer-events: none;
        }
        
        .form-field :global(.form-input) {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e9eef4;
          font-size: 14px;
          background: #fff;
          color: #0f172a;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        
        .form-field :global(.form-input:focus) {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        
        .form-field :global(.form-input:disabled) {
          background: #f8fafc;
          cursor: not-allowed;
        }
        
        .form-field :global(.form-input.has-error) {
          border-color: #ef4444;
        }
        
        .form-field :global(.form-input::placeholder) {
          color: #94a3b8;
        }
        
        .form-field :global(.form-select) {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 12px center;
          padding-left: 40px;
        }
        
        .form-field :global(.form-textarea) {
          resize: vertical;
          min-height: 80px;
        }
        
        .form-error {
          font-size: 12px;
          color: #ef4444;
        }
        
        .form-hint {
          font-size: 12px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  )
}

// Grid helper for form layouts
type FormGridProps = {
  children: ReactNode
  columns?: 1 | 2 | 3
  gap?: string
}

export function FormGrid({ children, columns = 2, gap = '16px' }: FormGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
    }}>
      {children}
    </div>
  )
}

// Form actions (buttons row)
type FormActionsProps = {
  children: ReactNode
  align?: 'start' | 'end' | 'center'
}

export function FormActions({ children, align = 'start' }: FormActionsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
      justifyContent: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
    }}>
      {children}
    </div>
  )
}
