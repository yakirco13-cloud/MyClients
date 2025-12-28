'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Upload, Receipt, Plus, Trash2, Loader2, Sparkles, 
  Cloud, CloudOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  StatCard, 
  StatsGrid, 
  FilterBar, 
  DataTable, 
  EmptyState,
  Modal,
  FormField,
  FormGrid,
  FormActions,
  Button,
  ActionButton,
  ActionsCell,
  type Column
} from '@/components/shared'

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

const CATEGORIES = [
  { value: 'ציוד', label: 'ציוד' },
  { value: 'תוכנה', label: 'תוכנה' },
  { value: 'דלק', label: 'דלק' },
  { value: 'משרד', label: 'משרד' },
  { value: 'שיווק', label: 'שיווק' },
  { value: 'מוזיקה', label: 'מוזיקה' },
  { value: 'אחר', label: 'אחר' },
]

export default function ExpensesContent({ expenses: initialExpenses, monthTotal }: Props) {
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

  const stats = {
    total: expenses.length,
    synced: expenses.filter(e => e.green_invoice_synced).length,
    monthTotal,
  }

  // File handling for AI scan
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
    toast.success('ההוצאה נמחקה')
  }

  const handleSync = async (expense: Expense) => {
    try {
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

      setExpenses(expenses.map(e => 
        e.id === expense.id ? { ...e, green_invoice_synced: true } : e
      ))

      toast.success('ההוצאה סונכרנה בהצלחה!')
    } catch (error) {
      console.error('Sync error:', error)
      toast.error(error instanceof Error ? error.message : 'שגיאה בסנכרון ההוצאה')
    }
  }

  const openAddModal = () => {
    setScannedData({
      vendor_name: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      category: 'אחר',
    })
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setScannedData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Table columns
  const columns: Column<Expense>[] = [
    {
      key: 'vendor',
      header: 'ספק',
      width: '2fr',
      render: (expense) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
            {expense.vendor_name}
          </div>
          {expense.category && (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{expense.category}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'סכום',
      width: '1fr',
      render: (expense) => (
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>
          ₪{expense.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'vat',
      header: 'מע״מ',
      width: '1fr',
      render: (expense) => (
        <span style={{ color: '#64748b' }}>
          {expense.vat_amount ? `₪${expense.vat_amount.toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'תאריך',
      width: '1fr',
      render: (expense) => (
        <span style={{ color: '#64748b' }}>
          {new Date(expense.expense_date).toLocaleDateString('he-IL')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      render: (expense) => (
        expense.green_invoice_synced ? (
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
            onClick={(e) => {
              e.stopPropagation()
              handleSync(expense)
            }}
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
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (expense) => (
        <ActionsCell>
          <ActionButton
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(expense.id)}
            variant="danger"
            title="מחק"
          />
        </ActionsCell>
      ),
    },
  ]

  // Build category filter options
  const categoryOptions = [
    { value: 'all', label: 'כל הקטגוריות' },
    ...categories.map(cat => ({ value: cat!, label: cat! }))
  ]

  return (
    <div>
      {/* Stats */}
      <StatsGrid columns={3}>
        <StatCard 
          label="הוצאות החודש" 
          value={`₪${stats.monthTotal.toLocaleString()}`}
          valueColor="#ef4444"
        />
        <StatCard label="סה״כ הוצאות" value={stats.total} />
        <StatCard 
          label="סונכרנו לחשבונית ירוקה" 
          value={stats.synced}
          valueColor="#10b981"
        />
      </StatsGrid>

      {/* AI Scan Banner */}
      <AIScanBanner 
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
      />

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="חיפוש הוצאות..."
        filters={categories.length > 0 ? [{
          value: categoryFilter,
          onChange: setCategoryFilter,
          options: categoryOptions,
        }] : undefined}
        actions={
          <Button icon={<Plus size={18} />} onClick={openAddModal}>
            הוצאה חדשה
          </Button>
        }
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        keyExtractor={(expense) => expense.id}
        emptyState={
          <EmptyState
            icon={<Receipt size={48} />}
            title={searchQuery || categoryFilter !== 'all' ? 'לא נמצאו הוצאות תואמות' : 'אין הוצאות עדיין'}
            description="סרוק קבלה או הוסף הוצאה ידנית"
            action={{ label: 'הוסף הוצאה', onClick: openAddModal }}
          />
        }
      />

      {/* Add Modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        initialData={scannedData}
        scanning={scanning}
        onClose={closeModal}
        onSuccess={(expense) => {
          setExpenses([expense, ...expenses])
          closeModal()
        }}
      />
    </div>
  )
}

// AI Scan Banner Component
function AIScanBanner({ fileInputRef, onFileSelect }: {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '20px',
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
          onChange={onFileSelect}
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
  )
}

// Add Expense Modal Component
function AddExpenseModal({ isOpen, initialData, scanning, onClose, onSuccess }: {
  isOpen: boolean
  initialData: Partial<Expense> | null
  scanning: boolean
  onClose: () => void
  onSuccess: (expense: Expense) => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor_name: '',
    amount: '',
    vat_amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'אחר',
    description: '',
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

      const { data, error } = await supabase.from('expenses').insert({
        user_id: user.id,
        vendor_name: formData.vendor_name,
        amount: parseFloat(formData.amount) || 0,
        vat_amount: formData.vat_amount ? parseFloat(formData.vat_amount) : null,
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description || null,
      }).select().single()

      if (error) throw error
      if (!data) throw new Error('No data returned')

      toast.success('ההוצאה נוספה בהצלחה!')
      onSuccess(data)
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error('שגיאה בהוספת הוצאה')
    } finally {
      setLoading(false)
    }
  }

  if (scanning) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="סורק קבלה..." icon={<Loader2 size={24} className="animate-spin" />}>
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
      </Modal>
    )
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData?.vendor_name ? 'פרטי הוצאה (מסריקה)' : 'הוצאה חדשה'}
      icon={<Sparkles size={24} />}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <FormField
            label="שם הספק"
            value={formData.vendor_name}
            onChange={(v) => setFormData({ ...formData, vendor_name: v })}
            required
          />

          <FormGrid columns={2}>
            <FormField
              label="סכום (כולל מע״מ)"
              type="number"
              value={formData.amount}
              onChange={(v) => setFormData({ ...formData, amount: v })}
              placeholder="₪"
              required
            />
            <FormField
              label="מע״מ"
              type="number"
              value={formData.vat_amount}
              onChange={(v) => setFormData({ ...formData, vat_amount: v })}
              placeholder="₪"
            />
          </FormGrid>

          <FormGrid columns={2}>
            <FormField
              label="תאריך"
              type="date"
              value={formData.expense_date}
              onChange={(v) => setFormData({ ...formData, expense_date: v })}
              required
            />
            <FormField
              label="קטגוריה"
              type="select"
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v })}
              options={CATEGORIES}
            />
          </FormGrid>

          <FormField
            label="תיאור"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            placeholder="תיאור אופציונלי..."
          />
        </div>

        <FormActions>
          <Button type="submit" loading={loading}>
            שמור הוצאה
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            ביטול
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
