'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, Phone, Mail, Calendar, MapPin, MoreVertical, Edit, Trash2, Eye, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button, EmptyState, TableRowSkeleton } from '@/components/ui/custom-ui'

type Client = {
  id: string
  name: string
  partner_name?: string
  phone?: string
  email?: string
  event_date?: string
  venue_name?: string
  status: string
  total_amount?: number
  amount_paid?: number
  created_at: string
}

type Props = {
  clients: Client[]
}

export default function ClientsContent({ clients: initialClients }: Props) {
  const router = useRouter()
  const [clients, setClients] = useState(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

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
    
    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('clients').delete().eq('id', id)
      
      if (error) throw error
      
      setClients(clients.filter(c => c.id !== id))
      toast.success('הלקוח נמחק בהצלחה')
    } catch (error) {
      toast.error('שגיאה במחיקת הלקוח')
    } finally {
      setDeleting(null)
      setMenuOpen(null)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { background: '#ecfdf5', color: '#10b981' }
      case 'completed':
        return { background: '#eff6ff', color: '#3b82f6' }
      case 'cancelled':
        return { background: '#fef2f2', color: '#ef4444' }
      default:
        return { background: '#f1f5f9', color: '#64748b' }
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

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    completed: clients.filter(c => c.status === 'completed').length,
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
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>סה״כ לקוחות</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>לקוחות פעילים</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{stats.active}</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>אירועים שהושלמו</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{stats.completed}</div>
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
            placeholder="חיפוש לקוחות..."
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="all">כל הסטטוסים</option>
            <option value="active">פעיל</option>
            <option value="completed">הושלם</option>
            <option value="cancelled">בוטל</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
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
            לקוח חדש
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 60px',
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e9eef4',
          fontSize: '12px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <div>לקוח</div>
          <div>טלפון</div>
          <div>תאריך אירוע</div>
          <div>מיקום</div>
          <div>סטטוס</div>
          <div></div>
        </div>

        {/* Table Body */}
        {filteredClients.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title={searchQuery || statusFilter !== 'all' ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
            description={searchQuery || statusFilter !== 'all' ? 'נסה לשנות את החיפוש או הפילטר' : 'הוסף את הלקוח הראשון שלך כדי להתחיל'}
            action={!searchQuery && statusFilter === 'all' ? {
              label: 'הוסף לקוח',
              onClick: () => setShowAddModal(true)
            } : undefined}
          />
        ) : (
          filteredClients.map((client, i) => {
            const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316']
            const bgs = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff', '#fff7ed']
            
            return (
              <div
                key={client.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 60px',
                  padding: '18px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              >
                {/* Client Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: bgs[i % 5],
                    color: colors[i % 5],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '16px',
                  }}>
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                      {client.name}{client.partner_name && ` & ${client.partner_name}`}
                    </div>
                    {client.email && (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{client.email}</div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div style={{ fontSize: '14px', color: '#64748b', direction: 'ltr', textAlign: 'right' }}>
                  {client.phone || '-'}
                </div>

                {/* Event Date */}
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {client.event_date ? new Date(client.event_date).toLocaleDateString('he-IL') : '-'}
                </div>

                {/* Venue */}
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {client.venue_name || '-'}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    ...getStatusStyle(client.status),
                  }}>
                    {getStatusLabel(client.status)}
                  </span>
                </div>

                {/* Actions */}
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
                        href={`/dashboard/clients/${client.id}`}
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
                        href={`/dashboard/clients/${client.id}?edit=true`}
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
                        onClick={() => handleDelete(client.id)}
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
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={(newClient) => {
            setClients([newClient, ...clients])
            setShowAddModal(false)
          }} 
        />
      )}
    </div>
  )
}

function AddClientModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (client: Client) => void }) {
  const [loading, setLoading] = useState(false)
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
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('clients').insert({
        user_id: user.id,
        name: formData.name,
        partner_name: formData.partner_name || null,
        phone: formData.phone || null,
        email: formData.email || null,
        event_date: formData.event_date || null,
        venue_name: formData.venue_name || null,
        status: 'active',
      }).select().single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned')
      }

      toast.success('הלקוח נוסף בהצלחה!')
      onSuccess(data)
    } catch (error) {
      console.error('Error adding client:', error)
      toast.error('שגיאה בהוספת לקוח')
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
      animation: 'fadeIn 0.15s ease',
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        animation: 'slideUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
          לקוח חדש
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                שם הלקוח *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                שם בן/בת הזוג
              </label>
              <input
                type="text"
                value={formData.partner_name}
                onChange={e => setFormData({ ...formData, partner_name: e.target.value })}
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
                  טלפון
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e9eef4',
                    fontSize: '14px',
                    direction: 'ltr',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                  אימייל
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e9eef4',
                    fontSize: '14px',
                    direction: 'ltr',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                  תאריך אירוע
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={e => setFormData({ ...formData, event_date: e.target.value })}
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
                  סכום עסקה
                </label>
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                מיקום האירוע
              </label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={e => setFormData({ ...formData, venue_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e9eef4',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-start' }}>
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
              {loading ? 'שומר...' : 'שמור לקוח'}
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
      </div>
    </div>
  )
}