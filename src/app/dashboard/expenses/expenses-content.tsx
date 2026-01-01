'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Receipt, Plus, Trash2, Sparkles, Cloud, CloudOff } from 'lucide-react'
import { toast } from 'sonner'
import { useExpenses, useAddExpense, useDeleteExpense, useSyncExpense, type Expense } from '@/lib/hooks'
import { 
  StatCard, StatsGrid, FilterBar, DataTable, EmptyState,
  Modal, FormField, FormGrid, FormActions, Button, ActionButton, ActionsCell, type Column
} from '@/components/shared'

const CATEGORIES = [
  { value: 'ציוד', label: 'ציוד' },
  { value: 'תוכנה', label: 'תוכנה' },
  { value: 'דלק', label: 'דלק' },
  { value: 'משרד', label: 'משרד' },
  { value: 'שיווק', label: 'שיווק' },
  { value: 'מוזיקה', label: 'מוזיקה' },
  { value: 'אחר', label: 'אחר' },
]

export default function ExpensesContent() {
  const { data, isLoading } = useExpenses()
  const addExpense = useAddExpense()
  const deleteExpense = useDeleteExpense()
  const syncExpense = useSyncExpense()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState<Partial<Expense> | null>(null)

  if (isLoading && !data) {
    return <ExpensesSkeleton />
  }

  const { expenses = [], monthTotal = 0 } = data || {}

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))]
  const stats = { total: expenses.length, synced: expenses.filter(e => e.synced_at).length, monthTotal }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowAddModal(true)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
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
    } catch {
      toast.error('שגיאה בסריקת הקבלה')
      setScannedData({ vendor_name: '', amount: 0, expense_date: new Date().toISOString().split('T')[0], category: 'אחר' })
    } finally {
      setScanning(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק הוצאה זו?')) return
    try {
      await deleteExpense.mutateAsync(id)
      toast.success('ההוצאה נמחקה')
    } catch {
      toast.error('שגיאה במחיקת ההוצאה')
    }
  }

  const handleSync = async (expense: Expense) => {
    try {
      await syncExpense.mutateAsync(expense)
      toast.success('ההוצאה סונכרנה!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בסנכרון')
    }
  }

  const openAddModal = () => {
    setScannedData({ vendor_name: '', amount: 0, expense_date: new Date().toISOString().split('T')[0], category: 'אחר' })
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setScannedData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const columns: Column<Expense>[] = [
    {
      key: 'vendor', header: 'ספק', width: '2fr',
      render: (expense) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{expense.vendor_name}</div>
          {expense.category && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{expense.category}</div>}
        </div>
      ),
    },
    { key: 'amount', header: 'סכום', width: '1fr', render: (expense) => <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>₪{expense.amount.toLocaleString()}</span> },
    { key: 'vat', header: 'מע״מ', width: '1fr', render: (expense) => <span style={{ color: '#64748b' }}>{expense.vat_amount ? `₪${expense.vat_amount.toLocaleString()}` : '-'}</span> },
    { key: 'date', header: 'תאריך', width: '1fr', render: (expense) => <span style={{ color: '#64748b' }}>{new Date(expense.expense_date).toLocaleDateString('he-IL')}</span> },
    {
      key: 'status', header: 'סטטוס', width: '100px',
      render: (expense) => expense.synced_at ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: '#ecfdf5', color: '#10b981', fontSize: '12px', fontWeight: 500 }}>
          <Cloud size={14} /> מסונכרן
        </span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); handleSync(expense); }} disabled={syncExpense.isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: '#fefce8', color: '#ca8a04', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          <CloudOff size={14} /> סנכרן
        </button>
      ),
    },
    { key: 'actions', header: '', width: '80px', render: (expense) => (
      <ActionsCell><ActionButton icon={<Trash2 size={16} />} onClick={() => handleDelete(expense.id)} variant="danger" title="מחק" /></ActionsCell>
    )},
  ]

  const categoryOptions = [{ value: 'all', label: 'כל הקטגוריות' }, ...categories.map(cat => ({ value: cat!, label: cat! }))]

  return (
    <div className="expenses-page">
      <StatsGrid columns={3}>
        <StatCard label="הוצאות החודש" value={`₪${stats.monthTotal.toLocaleString()}`} valueColor="#ef4444" />
        <StatCard label="סה״כ הוצאות" value={stats.total} />
        <StatCard label="סונכרנו" value={stats.synced} valueColor="#10b981" />
      </StatsGrid>

      <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', borderRadius: '16px', padding: '28px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles size={24} color="#fff" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>סריקת קבלות חכמה</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>העלה תמונה של קבלה והבינה המלאכותית תמלא את הפרטים</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '12px', background: '#fff', color: '#6366f1', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            <Upload size={20} /> סרוק קבלה
          </button>
        </div>
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="חיפוש הוצאות..."
        filters={categories.length > 0 ? [{ value: categoryFilter, onChange: setCategoryFilter, options: categoryOptions }] : undefined}
        actions={<Button icon={<Plus size={18} />} onClick={openAddModal}>הוצאה חדשה</Button>}
      />

      <DataTable columns={columns} data={filteredExpenses} keyExtractor={(e) => e.id}
        emptyState={<EmptyState icon={<Receipt size={48} />} title={searchQuery || categoryFilter !== 'all' ? 'לא נמצאו הוצאות' : 'אין הוצאות עדיין'} description="סרוק קבלה או הוסף ידנית" action={{ label: 'הוסף הוצאה', onClick: openAddModal }} />}
      />

      <AddExpenseModal isOpen={showAddModal} initialData={scannedData} scanning={scanning} onClose={closeModal} />

      <style jsx>{`
        .expenses-page { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

function AddExpenseModal({ isOpen, initialData, scanning, onClose }: { isOpen: boolean; initialData: Partial<Expense> | null; scanning: boolean; onClose: () => void }) {
  const addExpense = useAddExpense()
  const [formData, setFormData] = useState({ vendor_name: '', amount: '', vat_amount: '', expense_date: new Date().toISOString().split('T')[0], category: 'אחר', description: '' })

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
    try {
      await addExpense.mutateAsync({
        vendor_name: formData.vendor_name,
        amount: parseFloat(formData.amount) || 0,
        vat_amount: formData.vat_amount ? parseFloat(formData.vat_amount) : undefined,
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description || undefined,
      })
      toast.success('ההוצאה נוספה!')
      onClose()
    } catch {
      toast.error('שגיאה בהוספת הוצאה')
    }
  }

  if (scanning) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="סורק קבלה...">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: '60px', height: '60px', margin: '0 auto 20px', border: '4px solid #e9eef4', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#64748b' }}>הבינה המלאכותית מנתחת את הקבלה...</p>
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.vendor_name ? 'פרטי הוצאה (מסריקה)' : 'הוצאה חדשה'}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <FormField label="שם הספק" value={formData.vendor_name} onChange={(v) => setFormData({ ...formData, vendor_name: v })} required />
          <FormGrid columns={2}>
            <FormField label="סכום" type="number" value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} placeholder="₪" required />
            <FormField label="מע״מ" type="number" value={formData.vat_amount} onChange={(v) => setFormData({ ...formData, vat_amount: v })} placeholder="₪" />
          </FormGrid>
          <FormGrid columns={2}>
            <FormField label="תאריך" type="date" value={formData.expense_date} onChange={(v) => setFormData({ ...formData, expense_date: v })} required />
            <FormField label="קטגוריה" type="select" value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })} options={CATEGORIES} />
          </FormGrid>
          <FormField label="תיאור" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} placeholder="תיאור אופציונלי..." />
        </div>
        <FormActions>
          <Button type="submit" loading={addExpense.isPending}>שמור הוצאה</Button>
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

function ExpensesSkeleton() {
  return (
    <div className="skeleton">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[1, 2, 3].map(i => (<div key={i} className="skeleton-card"><div className="shimmer" style={{ width: '100px', height: '14px', marginBottom: '12px' }} /><div className="shimmer" style={{ width: '80px', height: '28px' }} /></div>))}
      </div>
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', borderRadius: '16px', height: '100px', marginBottom: '28px' }} />
      <div className="skeleton-card">
        {[1, 2, 3].map(i => (<div key={i} style={{ display: 'flex', gap: '16px', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}><div className="shimmer" style={{ width: '44px', height: '44px', borderRadius: '10px' }} /><div style={{ flex: 1 }}><div className="shimmer" style={{ width: '140px', height: '14px' }} /></div></div>))}
      </div>
      <style jsx>{`
        .skeleton { animation: fadeIn 0.2s ease; }
        .skeleton-card { background: #fff; border-radius: 16px; padding: 24px; border: 1px solid #e9eef4; }
        .shimmer { background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
