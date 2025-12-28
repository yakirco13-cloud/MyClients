'use client'

import { ReactNode } from 'react'
import { Search } from 'lucide-react'

type FilterOption = {
  value: string
  label: string
}

type FilterBarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: {
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
    placeholder?: string
  }[]
  actions?: ReactNode
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'חיפוש...',
  filters = [],
  actions,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="search-box">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filters & Actions */}
      <div className="filter-actions">
        {filters.map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
            className="filter-select"
          >
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        
        {actions}
      </div>

      <style jsx>{`
        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1px solid #e9eef4;
          border-radius: 10px;
          padding: 12px 16px;
          flex: 1;
          max-width: 400px;
          min-width: 200px;
        }
        
        .search-box :global(.search-icon) {
          color: #94a3b8;
          flex-shrink: 0;
        }
        
        .search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          background: transparent;
          color: #0f172a;
        }
        
        .search-input::placeholder {
          color: #94a3b8;
        }
        
        .filter-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .filter-select {
          padding: 12px 16px;
          padding-left: 36px;
          border-radius: 10px;
          border: 1px solid #e9eef4;
          background: #fff;
          font-size: 14px;
          color: #1e293b;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 12px center;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #0ea5e9;
        }
        
        @media (max-width: 640px) {
          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-box {
            max-width: none;
          }
          
          .filter-actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}
