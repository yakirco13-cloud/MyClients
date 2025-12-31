'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Users, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useClients, useAddClient, useDeleteClient, type Client } from '@/lib/hooks'
import { 
  StatCard, 
  StatsGrid, 
  FilterBar, 
  DataTable, 
  AvatarCell, 
  BadgeCell,
  EmptyState,
  Modal,
  FormField,
  FormGrid,
  FormActions,
  Button,
  type Column
} from '@/components/shared'

const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316']
const bgColors = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff', '#fff7ed']

const getStatusVariant = (status: string): 'success' | 'info' | 'error' | 'default' => {
  switch (status) {
    case 'active': return 'success'
    case 'completed': return 'info'
    case 'cancelled': return 'error'
    default: return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'פעיל'
    case 'completed': return 'הושלם'
    case 'cancelled': return 'בוטל'
    default: return status
  }
}

export default function ClientsContent() {
  const router = useRouter()
  const { data: clients = [], isLoading } = useClients()
  const deleteClient = useDeleteClient()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // Show skeleton only on first load
  if (isLoading && clients.length === 0) {
    return <ClientsSkeleton />
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק לקוח זה?')) return
    try {
      await deleteClient.mutateAsync(id)
      toast.success('הלקוח נמחק בהצלחה')
    } catch {
      toast.error('שגיאה במחיקת הלקוח')
    }
    setMenuOpen(null)
  }

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    completed: clients.filter(c => c.status === 'completed').length,
  }

  const columns: Column<Client>[] = [
    {
      key: 'client',
      header: 'לקוח',
      width: '2fr',
      render: (client, index) => (
        <AvatarCell
          name={client.name + (client.partner_name ? ` & ${client.partner_name}` : '')}
          subtitle={client.email || undefined}
          color={colors[index % 5]}
          bgColor={bgColors[index % 5]}
        />
      ),
    },
    {
      key: 'phone',
      header: 'טלפון',
      width: '1fr',
      render: (client) => (
        <span style={{ color: '#64748b', direction: 'ltr', display: 'block', textAlign: 'right' }}>
          {client.phone || '-'}
        </span>
      ),
    },
    {
      key: 'event_date',
      header: 'תאריך אירוע',
      width: '1fr',
      render: (client) => (
        <span style={{ color: '#64748b' }}>
          {client.event_date ? new Date(client.event_date).toLocaleDateString('he-IL') : '-'}
        </span>
      ),
    },
    {
      key: 'venue',
      header: 'מיקום',
      width: '1fr',
      render: (client) => <span style={{ color: '#64748b' }}>{client.venue_name || '-'}</span>,
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      render: (client) => <BadgeCell label={getStatusLabel(client.status)} variant={getStatusVariant(client.status)} />,
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (client) => (
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
          >
            <MoreVertical size={18} color="#64748b" />
          </button>
          {menuOpen === client.id && (
            <DropdownMenu clientId={client.id} onDelete={() => handleDelete(client.id)} onClose={() => setMenuOpen(null)} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="clients-page">
      <StatsGrid columns={3}>
        <StatCard label="סה״כ לקוחות" value={stats.total} />
        <StatCard label="לקוחות פעילים" value={stats.active} valueColor="#10b981" />
        <StatCard label="אירועים שהושלמו" value={stats.completed} valueColor="#3b82f6" />
      </StatsGrid>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="חיפוש לקוחות..."
        filters={[{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: 'all', label: 'כל הסטטוסים' },
            { value: 'active', label: 'פעיל' },
            { value: 'completed', label: 'הושלם' },
            { value: 'cancelled', label: 'בוטל' },
          ],
        }]}
        actions={<Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>לקוח חדש</Button>}
      />

      <DataTable
        columns={columns}
        data={filteredClients}
        keyExtractor={(client) => client.id}
        onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
        emptyState={
          <EmptyState
            icon={<Users size={48} />}
            title={searchQuery || statusFilter !== 'all' ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
            description={searchQuery || statusFilter !== 'all' ? 'נסה לשנות את החיפוש' : 'הוסף את הלקוח הראשון'}
            action={!searchQuery && statusFilter === 'all' ? { label: 'הוסף לקוח', onClick: () => setShowAddModal(true) } : undefined}
          />
        }
      />

      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      <style jsx>{`
        .clients-page { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function DropdownMenu({ clientId, onDelete, onClose }: { clientId: string; onDelete: () => void; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', left: 0, top: '100%', background: '#fff', borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e9eef4', zIndex: 10, minWidth: '150px', overflow: 'hidden',
    }}>
      <Link href={`/dashboard/clients/${clientId}`} onClick={onClose}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', fontSize: '14px', color: '#1e293b', textDecoration: 'none' }}>
        <Eye size={16} /> צפייה
      </Link>
      <Link href={`/dashboard/clients/${clientId}?edit=true`} onClick={onClose}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', fontSize: '14px', color: '#1e293b', textDecoration: 'none' }}>
        <Edit size={16} /> עריכה
      </Link>
      <button onClick={onDelete}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}>
        <Trash2 size={16} /> מחיקה
      </button>
    </div>
  )
}

function AddClientModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const addClient = useAddClient()
  const [formData, setFormData] = useState({ name: '', partner_name: '', phone: '', email: '', event_date: '', venue_name: '', total_amount: '' })
  const [savingType, setSavingType] = useState<'save' | 'questionnaire' | null>(null)

  const handleSubmit = async (e: React.FormEvent, goToQuestionnaire = false) => {
    e.preventDefault()
    setSavingType(goToQuestionnaire ? 'questionnaire' : 'save')
    try {
      const result = await addClient.mutateAsync({
        name: formData.name,
        partner_name: formData.partner_name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        event_date: formData.event_date || undefined,
        venue_name: formData.venue_name || undefined,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
        status: 'active',
      })
      toast.success('הלקוח נוסף בהצלחה!')
      setFormData({ name: '', partner_name: '', phone: '', email: '', event_date: '', venue_name: '', total_amount: '' })
      onClose()
      
      if (goToQuestionnaire && result?.id) {
        router.push(`/dashboard/clients/${result.id}?tab=questionnaire`)
      }
    } catch {
      toast.error('שגיאה בהוספת לקוח')
    } finally {
      setSavingType(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="לקוח חדש">
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <FormField label="שם הלקוח" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} required />
          <FormField label="שם בן/בת הזוג" value={formData.partner_name} onChange={(v) => setFormData({ ...formData, partner_name: v })} />
          <FormGrid columns={2}>
            <FormField label="טלפון" type="tel" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} dir="ltr" />
            <FormField label="אימייל" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} dir="ltr" />
          </FormGrid>
          <FormGrid columns={2}>
            <DatePickerField 
              label="תאריך אירוע" 
              value={formData.event_date} 
              onChange={(v) => setFormData({ ...formData, event_date: v })} 
            />
            <FormField label="סכום עסקה" type="number" value={formData.total_amount} onChange={(v) => setFormData({ ...formData, total_amount: v })} placeholder="₪" />
          </FormGrid>
          <FormField label="מיקום האירוע" value={formData.venue_name} onChange={(v) => setFormData({ ...formData, venue_name: v })} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <Button type="submit" loading={savingType === 'save'}>שמור לקוח</Button>
          <Button 
            type="button" 
            variant="secondary"
            loading={savingType === 'questionnaire'}
            onClick={(e) => handleSubmit(e as any, true)}
            disabled={!formData.name}
          >
            שמור והמשך לשאלון
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
        </div>
      </form>
    </Modal>
  )
}

// Custom Date Picker with better UX
function DatePickerField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Parse current value
  const currentDate = value ? new Date(value) : null
  const [selectedYear, setSelectedYear] = useState(currentDate?.getFullYear() || new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate?.getMonth() || new Date().getMonth())
  
  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]
  
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i) // 2020-2035
  
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
  
  const handleDayClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(dateStr)
    setIsOpen(false)
  }
  
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type="text"
        value={formatDisplayDate(value)}
        onClick={() => setIsOpen(!isOpen)}
        readOnly
        placeholder="בחר תאריך"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: '10px',
          border: '1px solid #e9eef4',
          fontSize: '14px',
          background: '#fff',
          cursor: 'pointer',
        }}
      />
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e9eef4',
          padding: '16px',
          zIndex: 1000,
          minWidth: '280px',
        }}>
          {/* Month/Year selectors */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e9eef4',
                fontSize: '14px',
              }}
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e9eef4',
                fontSize: '14px',
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '4px' }}>
                {d}
              </div>
            ))}
          </div>
          
          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {/* Empty cells for first week */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} style={{ padding: '8px' }} />
            ))}
            
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const isSelected = currentDate && 
                currentDate.getDate() === day && 
                currentDate.getMonth() === selectedMonth && 
                currentDate.getFullYear() === selectedYear
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? '#0ea5e9' : 'transparent',
                    color: isSelected ? '#fff' : '#0f172a',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
          
          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e9eef4',
                background: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              נקה
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: '#f1f5f9',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ClientsSkeleton() {
  return (
    <div className="skeleton">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card">
            <div className="shimmer" style={{ width: '100px', height: '14px', marginBottom: '12px' }} />
            <div className="shimmer" style={{ width: '60px', height: '28px' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div className="shimmer" style={{ width: '300px', height: '48px', borderRadius: '10px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="shimmer" style={{ width: '140px', height: '48px', borderRadius: '10px' }} />
          <div className="shimmer" style={{ width: '120px', height: '48px', borderRadius: '10px' }} />
        </div>
      </div>
      <div className="skeleton-card">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', gap: '16px', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div className="shimmer" style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ width: '140px', height: '14px', marginBottom: '8px' }} />
              <div className="shimmer" style={{ width: '100px', height: '12px' }} />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .skeleton { animation: fadeIn 0.2s ease; }
        .skeleton-card { background: #fff; border-radius: 16px; padding: 24px; border: 1px solid #e9eef4; }
        .shimmer {
          background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
