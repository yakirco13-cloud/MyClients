'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Users, Eye, Edit, Trash2, MoreVertical, Loader2 } from 'lucide-react'
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

// Color rotation for avatars
const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316']
const bgColors = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff', '#fff7ed']

// Status helpers
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
  const { data: clients = [], isLoading, error } = useClients()
  const deleteClient = useDeleteClient()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

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
    } catch (error) {
      toast.error('שגיאה במחיקת הלקוח')
    } finally {
      setMenuOpen(null)
    }
  }

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    completed: clients.filter(c => c.status === 'completed').length,
  }

  // Table columns
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
      render: (client) => (
        <span style={{ color: '#64748b' }}>{client.venue_name || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      render: (client) => (
        <BadgeCell label={getStatusLabel(client.status)} variant={getStatusVariant(client.status)} />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (client) => (
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
            }}
          >
            <MoreVertical size={18} color="#64748b" />
          </button>
          
          {menuOpen === client.id && (
            <DropdownMenu
              clientId={client.id}
              onDelete={() => handleDelete(client.id)}
              onClose={() => setMenuOpen(null)}
            />
          )}
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <ClientsSkeleton />
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
        שגיאה בטעינת הנתונים. נסה לרענן את הדף.
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <StatsGrid columns={3}>
        <StatCard label="סה״כ לקוחות" value={stats.total} />
        <StatCard label="לקוחות פעילים" value={stats.active} valueColor="#10b981" />
        <StatCard label="אירועים שהושלמו" value={stats.completed} valueColor="#3b82f6" />
      </StatsGrid>

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="חיפוש לקוחות..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'כל הסטטוסים' },
              { value: 'active', label: 'פעיל' },
              { value: 'completed', label: 'הושלם' },
              { value: 'cancelled', label: 'בוטל' },
            ],
          },
        ]}
        actions={
          <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
            לקוח חדש
          </Button>
        }
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredClients}
        keyExtractor={(client) => client.id}
        onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
        emptyState={
          <EmptyState
            icon={<Users size={48} />}
            title={searchQuery || statusFilter !== 'all' ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
            description={searchQuery || statusFilter !== 'all' ? 'נסה לשנות את החיפוש או הפילטר' : 'הוסף את הלקוח הראשון שלך כדי להתחיל'}
            action={!searchQuery && statusFilter === 'all' ? {
              label: 'הוסף לקוח',
              onClick: () => setShowAddModal(true)
            } : undefined}
          />
        }
      />

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  )
}

// Loading skeleton
function ClientsSkeleton() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e9eef4' }}>
            <div style={{ height: '16px', width: '100px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '28px', width: '60px', background: '#f1f5f9', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', border: '1px solid #e9eef4', textAlign: 'center' }}>
        <Loader2 size={32} color="#0ea5e9" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

// Dropdown Menu Component
function DropdownMenu({ clientId, onDelete, onClose }: { 
  clientId: string
  onDelete: () => void
  onClose: () => void 
}) {
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: '100%',
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid #e9eef4',
      zIndex: 10,
      minWidth: '150px',
      overflow: 'hidden',
    }}>
      <Link
        href={`/dashboard/clients/${clientId}`}
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          fontSize: '14px',
          color: '#1e293b',
          textDecoration: 'none',
        }}
      >
        <Eye size={16} />
        צפייה
      </Link>
      <Link
        href={`/dashboard/clients/${clientId}?edit=true`}
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          fontSize: '14px',
          color: '#1e293b',
          textDecoration: 'none',
        }}
      >
        <Edit size={16} />
        עריכה
      </Link>
      <button
        onClick={onDelete}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          fontSize: '14px',
          color: '#ef4444',
          background: 'none',
          border: 'none',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        <Trash2 size={16} />
        מחיקה
      </button>
    </div>
  )
}

// Add Client Modal Component
function AddClientModal({ isOpen, onClose }: { 
  isOpen: boolean
  onClose: () => void
}) {
  const addClient = useAddClient()
  const [formData, setFormData] = useState({
    name: '',
    partner_name: '',
    phone: '',
    email: '',
    event_date: '',
    venue_name: '',
    total_amount: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addClient.mutateAsync({
        name: formData.name,
        partner_name: formData.partner_name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        event_date: formData.event_date || undefined,
        venue_name: formData.venue_name || undefined,
        status: 'active',
      })

      toast.success('הלקוח נוסף בהצלחה!')
      
      // Reset form
      setFormData({
        name: '',
        partner_name: '',
        phone: '',
        email: '',
        event_date: '',
        venue_name: '',
        total_amount: '',
      })
      
      onClose()
    } catch (error) {
      console.error('Error adding client:', error)
      toast.error('שגיאה בהוספת לקוח')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="לקוח חדש">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <FormField
            label="שם הלקוח"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            required
          />

          <FormField
            label="שם בן/בת הזוג"
            value={formData.partner_name}
            onChange={(v) => setFormData({ ...formData, partner_name: v })}
          />

          <FormGrid columns={2}>
            <FormField
              label="טלפון"
              type="tel"
              value={formData.phone}
              onChange={(v) => setFormData({ ...formData, phone: v })}
              dir="ltr"
            />
            <FormField
              label="אימייל"
              type="email"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
              dir="ltr"
            />
          </FormGrid>

          <FormGrid columns={2}>
            <FormField
              label="תאריך אירוע"
              type="date"
              value={formData.event_date}
              onChange={(v) => setFormData({ ...formData, event_date: v })}
            />
            <FormField
              label="סכום עסקה"
              type="number"
              value={formData.total_amount}
              onChange={(v) => setFormData({ ...formData, total_amount: v })}
              placeholder="₪"
            />
          </FormGrid>

          <FormField
            label="מיקום האירוע"
            value={formData.venue_name}
            onChange={(v) => setFormData({ ...formData, venue_name: v })}
          />
        </div>

        <FormActions>
          <Button type="submit" loading={addClient.isPending}>
            שמור לקוח
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            ביטול
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
