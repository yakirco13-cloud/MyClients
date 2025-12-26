'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, Receipt, Search, Plus, Calendar, Trash2, 
  Check, X, Loader2, Sparkles, FileText, Filter,
  TrendingUp, Cloud, CloudOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Expense = {
  id: string
  vendor_name: string
  amount: number
  vat_amount?: number
  expense_date: string
  category?: string
  description?: string
  receipt_url?: string
  green_invoice_synced?: boolean
  created_at: string
}

type Props = {
  expenses: Expense[]
  monthTotal: number
}

export default function ExpensesContent({ expenses: initialExpenses, monthTotal }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState<Partial<Expense> | null>(null)

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowAddModal(true)

    try {
      const base64 = await fileToBase64(file)
      
      const response = await fetch('/api/expenses/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      if (!response.ok) throw new Error('Scan failed')

      const data = await response.json()
      setScannedData({
        vendor_name: data.vendor_name || '',
        amount: data.amount || 0,
        vat_amount: data.vat_amount || 0,
        expense_date: data.date || new Date().toISOString().split('T')[0],
        category: data.category || 'אחר',
        description: data.description || '',
      })
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('שגיאה בסריקת הקבלה')
      setScannedData({
        vendor_name: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        category: 'אחר',
      })
    } finally {
      setScanning(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק הוצאה זו?')) return
    
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const handleSync = async (expense: Expense) => {
    try {
      // Get user settings to check which accounting system is connected
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      let response

      if (settings?.easycount_connected && settings.easycount_api_key) {
        // Use EasyCount
        response = await fetch('/api/easycount/expense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expenseId: expense.id,
            vendorName: expense.vendor_name,
            amount: expense.amount,
            vatAmount: expense.vat_amount,
            expenseDate: expense.expense_date,
            description: expense.description,
            apiKey: settings.easycount_api_key,
            developerEmail: settings.easycount_developer_email,
            useSandbox: settings.easycount_use_sandbox,
          }),
        })
      } else if (settings?.green_invoice_connected && settings.green_invoice_api_key) {
        // Use Green Invoice
        response = await fetch('/api/green-invoice/expense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expenseId: expense.id,
            vendor_name: expense.vendor_name,
            amount: expense.amount,
            vat_amount: expense.vat_amount,
            expense_date: expense.expense_date,
            description: expense.description,
          }),
        })
      } else {
        toast.error('אין מערכת חשבוניות מחוברת. חבר מערכת בהגדרות.')
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      // Update local state
      setExpenses(expenses.map(e => 
        e.id === expense.id ? { ...e, green_invoice_synced: true } : e
      ))

      toast.success('ההוצאה סונכרנה בהצלחה!')
    } catch (error) {
      console.error('Sync error:', error)
      toast.error(error instanceof Error ? error.message : 'שגיאה בסנכרון ההוצאה')
    }
  }

  const stats = {
    total: expenses.length,
    synced: expenses.filter(e => e.green_invoice_synced).length,
    monthTotal,
  }

  return (
    <div>
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '28px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>הוצאות החודש</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>₪{stats.monthTotal.toLocaleString()}</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>סה״כ הוצאות</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>סונכרנו לחשבונית ירוקה</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{stats.synced}</div>
        </div>
      </div>

      {/* AI Scan Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles size={24} color="#fff" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
              סריקת קבלות חכמה
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            העלה תמונה של קבלה והבינה המלאכותית תמלא את הפרטים אוטומטית
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '12px',
              background: '#fff',
              color: '#6366f1',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={20} />
            סרוק קבלה
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#fff',
          border: '1px solid #e9eef4',
          borderRadius: '10px',
          padding: '12px 16px',
          flex: 1,
          maxWidth: '400px',
        }}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder="חיפוש הוצאות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              background: 'transparent',
            }}
          />
        </div>

        {/* Filter & Add */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #e9eef4',
                background: '#fff',
                fontSize: '14px',
                color: '#1e293b',
                cursor: 'pointer',
              }}
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setScannedData({
                vendor_name: '',
                amount: 0,
                expense_date: new Date().toISOString().split('T')[0],
                category: 'אחר',
              })
              setShowAddModal(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '10px',
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            הוצאה חדשה
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 80px',
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e9eef4',
          fontSize: '12px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <div>ספק</div>
          <div>סכום</div>
          <div>מע״מ</div>
          <div>תאריך</div>
          <div>סטטוס</div>
          <div></div>
        </div>

        {/* Table Body */}
        {filteredExpenses.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Receipt size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{searchQuery || categoryFilter !== 'all' ? 'לא נמצאו הוצאות תואמות' : 'אין הוצאות עדיין'}</p>
            <p style={{ fontSize: '13px' }}>סרוק קבלה או הוסף הוצאה ידנית</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 80px',
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                alignItems: 'center',
              }}
            >
              {/* Vendor */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  {expense.vendor_name}
                </div>
                {expense.category && (
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{expense.category}</div>
                )}
              </div>

              {/* Amount */}
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>
                ₪{expense.amount.toLocaleString()}
              </div>

              {/* VAT */}
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {expense.vat_amount ? `₪${expense.vat_amount.toLocaleString()}` : '-'}
              </div>

              {/* Date */}
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {new Date(expense.expense_date).toLocaleDateString('he-IL')}
              </div>

              {/* Sync Status */}
              <div>
                {expense.green_invoice_synced ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#ecfdf5',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    <Cloud size={14} />
                    מסונכרן
                  </span>
                ) : (
                  <button
                    onClick={() => handleSync(expense)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: '#fefce8',
                      color: '#ca8a04',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <CloudOff size={14} />
                    סנכרן
                  </button>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDelete(expense.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddExpenseModal
          initialData={scannedData}
          scanning={scanning}
          onClose={() => {
            setShowAddModal(false)
            setScannedData(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          onSuccess={(expense) => {
            setExpenses([expense, ...expenses])
            setShowAddModal(false)
            setScannedData(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      )}
    </div>
  )
}

function AddExpenseModal({ initialData, scanning, onClose, onSuccess }: {
  initialData: Partial<Expense> | null
  scanning: boolean
  onClose: () => void
  onSuccess: (expense: Expense) => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor_name: initialData?.vendor_name || '',
    amount: initialData?.amount?.toString() || '',
    vat_amount: initialData?.vat_amount?.toString() || '',
    expense_date: initialData?.expense_date || new Date().toISOString().split('T')[0],
    category: initialData?.category || 'אחר',
    description: initialData?.description || '',
  })

  // Update form when scanned data comes in
  useEffect(() => {
    if (initialData && !scanning) {
      setFormData({
        vendor_name: initialData.vendor_name || '',
        amount: initialData.amount?.toString() || '',
        vat_amount: initialData.vat_amount?.toString() || '',
        expense_date: initialData.expense_date || new Date().toISOString().split('T')[0],
        category: initialData.category || 'אחר',
        description: initialData.description || '',
      })
    }
  }, [initialData, scanning])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          vendor_name: formData.vendor_name,
          amount: parseFloat(formData.amount),
          vat_amount: formData.vat_amount ? parseFloat(formData.vat_amount) : null,
          expense_date: formData.expense_date,
          category: formData.category,
          description: formData.description || null,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        toast.success('ההוצאה נוספה בהצלחה!')
        onSuccess(data)
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error('שגיאה בהוספת הוצאה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          {scanning ? (
            <>
              <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                סורק קבלה...
              </h2>
            </>
          ) : (
            <>
              <Sparkles size={24} color="#6366f1" />
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {initialData?.vendor_name ? 'פרטי הוצאה (מסריקה)' : 'הוצאה חדשה'}
              </h2>
            </>
          )}
        </div>

        {scanning ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              border: '4px solid #e9eef4',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: '#64748b' }}>הבינה המלאכותית מנתחת את הקבלה...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                  שם הספק *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e9eef4',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                    סכום (כולל מע״מ) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e9eef4',
                      fontSize: '14px',
                    }}
                    placeholder="₪"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                    מע״מ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat_amount}
                    onChange={e => setFormData({ ...formData, vat_amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e9eef4',
                      fontSize: '14px',
                    }}
                    placeholder="₪"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                    תאריך *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e9eef4',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                    קטגוריה
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e9eef4',
                      fontSize: '14px',
                    }}
                  >
                    <option value="ציוד">ציוד</option>
                    <option value="תוכנה">תוכנה</option>
                    <option value="דלק">דלק</option>
                    <option value="משרד">משרד</option>
                    <option value="שיווק">שיווק</option>
                    <option value="מוזיקה">מוזיקה</option>
                    <option value="אחר">אחר</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                  תיאור
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e9eef4',
                    fontSize: '14px',
                  }}
                  placeholder="תיאור אופציונלי..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'שומר...' : 'שמור הוצאה'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}