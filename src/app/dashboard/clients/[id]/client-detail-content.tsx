'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, Phone, Mail, Calendar, MapPin, Edit, Trash2, 
  Plus, Download, CheckCircle, Clock,
  User, Banknote, Receipt, MoreVertical, X, Loader2, Music
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  notes?: string
  created_at: string
}

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_method?: string
  notes?: string
  pdf_url?: string
  invoice_number?: string
}

type Invoice = {
  id: string
  invoice_number?: string
  amount: number
  status: string
  created_at: string
  green_invoice_id?: string
  pdf_url?: string
}

type Props = {
  client: Client
  payments: Payment[]
  invoices: Invoice[]
}

export default function ClientDetailContent({ client: initialClient, payments: initialPayments, invoices: initialInvoices }: Props) {
  const router = useRouter()
  const [client, setClient] = useState(initialClient)
  const [payments, setPayments] = useState(initialPayments)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = (client.total_amount || 0) - totalPaid
  const progress = client.total_amount ? (totalPaid / client.total_amount) * 100 : 0

  const daysUntilEvent = client.event_date 
    ? Math.ceil((new Date(client.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#ecfdf5', color: '#10b981', label: 'פעיל' }
      case 'lead': return { bg: '#eff6ff', color: '#3b82f6', label: 'ליד' }
      case 'completed': return { bg: '#f1f5f9', color: '#64748b', label: 'הושלם' }
      case 'cancelled': return { bg: '#fef2f2', color: '#ef4444', label: 'בוטל' }
      default: return { bg: '#f1f5f9', color: '#64748b', label: status }
    }
  }

  const statusStyle = getStatusStyle(client.status)

  const handleDelete = async () => {
    if (!confirm('האם למחוק לקוח זה? פעולה זו לא ניתנת לביטול.')) return
    
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('clients').delete().eq('id', client.id)
      if (error) throw error
      
      toast.success('הלקוח נמחק בהצלחה')
      router.push('/dashboard/clients')
    } catch (error) {
      toast.error('שגיאה במחיקת הלקוח')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back Link */}
      <Link
        href="/dashboard/clients"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#64748b',
          fontSize: '14px',
          marginBottom: '20px',
          textDecoration: 'none',
        }}
      >
        <ArrowRight size={18} />
        חזרה לרשימת הלקוחות
      </Link>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        
        {/* Left Column - Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Card */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e9eef4',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                }}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {client.name}{client.partner_name && ` & ${client.partner_name}`}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {statusStyle.label}
                    </span>
                    {daysUntilEvent !== null && daysUntilEvent > 0 && (
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        בעוד {daysUntilEvent} ימים
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/dashboard/clients/${client.id}/meeting`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <Music size={14} />
                  פגישת שירים
                </Link>
                <button
                  onClick={() => setShowEditModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e9eef4',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <Edit size={14} />
                  עריכה
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fff',
                    color: '#ef4444',
                    fontSize: '13px',
                    cursor: 'pointer',
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                  מחיקה
                </button>
              </div>
            </div>

            {/* Quick Info Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #f1f5f9',
            }}>
              {client.phone && (
                <a href={`tel:${client.phone}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Phone size={16} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>טלפון</div>
                    <div style={{ fontSize: '13px', color: '#1e293b', direction: 'ltr', textAlign: 'right' }}>{client.phone}</div>
                  </div>
                </a>
              )}
              
              {client.email && (
                <a href={`mailto:${client.email}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Mail size={16} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>אימייל</div>
                    <div style={{ fontSize: '13px', color: '#1e293b' }}>{client.email}</div>
                  </div>
                </a>
              )}
              
              {client.event_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#fefce8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Calendar size={16} color="#ca8a04" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>תאריך</div>
                    <div style={{ fontSize: '13px', color: '#1e293b' }}>
                      {new Date(client.event_date).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </div>
              )}
              
              {client.venue_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#f5f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MapPin size={16} color="#8b5cf6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>מיקום</div>
                    <div style={{ fontSize: '13px', color: '#1e293b' }}>{client.venue_name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payments */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e9eef4',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                תשלומים
              </h3>
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                הוסף
              </button>
            </div>
              
              <div style={{ maxHeight: '240px', overflow: 'auto' }}>
                {payments.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    אין תשלומים עדיין
                  </div>
                ) : (
                  payments.map(payment => (
                    <div key={payment.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: '1px solid #f8fafc',
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#10b981' }}>
                          ₪{payment.amount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(payment.payment_date).toLocaleDateString('he-IL')}
                          {payment.payment_method && ` • ${payment.payment_method}`}
                          {payment.invoice_number && ` • מס׳ ${payment.invoice_number}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {payment.pdf_url ? (
                          <button
                            onClick={() => window.open(payment.pdf_url, '_blank')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: '#f0fdf4',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            title="הורד קבלה"
                          >
                            <Download size={14} color="#10b981" />
                          </button>
                        ) : (
                          <CheckCircle size={16} color="#10b981" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          {/* Notes */}
          {client.notes && (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e9eef4',
              padding: '20px',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>
                הערות
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                {client.notes}
              </p>
            </div>
          )}

          {/* Questionnaire Button */}
          <QuestionnaireButton clientId={client.id} />
        </div>

        {/* Right Column - Financial Summary */}
        <div>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '24px',
            position: 'sticky',
            top: '20px',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px 0' }}>
              סיכום כספי
            </h3>

            {/* Total Amount */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>סכום העסקה</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
                ₪{(client.total_amount || 0).toLocaleString()}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>התקדמות תשלום</span>
                <span style={{ fontSize: '12px', color: '#fff' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>שולם</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>
                  ₪{totalPaid.toLocaleString()}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#f59e0b" />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>נותר לתשלום</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#f59e0b' }}>
                  ₪{Math.max(remaining, 0).toLocaleString()}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={16} color="#3b82f6" />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>מספר תשלומים</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                  {payments.length}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Plus size={18} />
                הוסף תשלום
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setClient(updated)
            setShowEditModal(false)
            toast.success('הלקוח עודכן בהצלחה')
          }}
        />
      )}

      {showPaymentModal && (
        <AddPaymentModal
          client={client}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(payment, invoice) => {
            setPayments([payment, ...payments])
            if (invoice) {
              setInvoices([invoice, ...invoices])
            }
            setShowPaymentModal(false)
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// Edit Client Modal
function EditClientModal({ client, onClose, onSave }: { 
  client: Client
  onClose: () => void
  onSave: (client: Client) => void 
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client.name,
    partner_name: client.partner_name || '',
    phone: client.phone || '',
    email: client.email || '',
    event_date: client.event_date || '',
    venue_name: client.venue_name || '',
    status: client.status,
    notes: client.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          partner_name: formData.partner_name || null,
          phone: formData.phone || null,
          email: formData.email || null,
          event_date: formData.event_date || null,
          venue_name: formData.venue_name || null,
          status: formData.status,
          notes: formData.notes || null,
        })
        .eq('id', client.id)
        .select()
        .single()

      if (error) throw error
      if (data) onSave(data)
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('שגיאה בעדכון הלקוח')
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
        padding: '28px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        animation: 'slideUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>עריכת לקוח</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="שם הלקוח *" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
              <InputField label="שם בן/בת הזוג" value={formData.partner_name} onChange={v => setFormData({...formData, partner_name: v})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="טלפון" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} type="tel" dir="ltr" />
              <InputField label="אימייל" value={formData.email} onChange={v => setFormData({...formData, email: v})} type="email" dir="ltr" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="תאריך אירוע" value={formData.event_date} onChange={v => setFormData({...formData, event_date: v})} type="date" />
              <InputField label="מיקום" value={formData.venue_name} onChange={v => setFormData({...formData, venue_name: v})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>סטטוס</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9eef4', fontSize: '13px' }}
              >
                <option value="lead">ליד</option>
                <option value="active">פעיל</option>
                <option value="completed">הושלם</option>
                <option value="cancelled">בוטל</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>הערות</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9eef4', fontSize: '13px', resize: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e9eef4', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer'
            }}>ביטול</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0ea5e9', color: '#fff', fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Payment Modal
function AddPaymentModal({ client, onClose, onSuccess }: {
  client: Client
  onClose: () => void
  onSuccess: (payment: Payment, invoice?: Invoice) => void
}) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'מזומן',
    notes: '',
    description: 'שירותי DJ לאירוע',
    document_type: '400', // Default: Receipt (works for all)
  })

  // Map payment methods to EasyCount payment types
  const paymentTypeMap: Record<string, number> = {
    'מזומן': 1,
    'צ׳ק': 2,
    'אשראי': 3,
    'העברה בנקאית': 4,
    'ביט': 10,
    'פייבוקס': 10,
  }

  // Document types
  const documentTypes = [
    { value: '400', label: 'קבלה', description: 'מתאים לכל סוגי העסקים' },
    { value: '320', label: 'חשבונית מס קבלה', description: 'לעוסק מורשה בלבד' },
    { value: '305', label: 'חשבונית מס', description: 'לעוסק מורשה בלבד' },
    { value: '10', label: 'הצעת מחיר', description: 'ללא תשלום' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('שומר תשלום...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Save payment to database
      const { data: paymentData, error: paymentError } = await supabase.from('payments').insert({
        user_id: user.id,
        client_id: client.id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
      }).select().single()

      if (paymentError) throw paymentError

      // 2. Get user settings to check which accounting system is connected
      setStatus('בודק חיבור למערכת חשבוניות...')
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      let invoiceData: Invoice | undefined

      // 3. Create invoice if accounting system is connected
      if (settings?.easycount_connected && settings.easycount_api_key) {
        setStatus('יוצר חשבונית באיזיקאונט...')
        
        const invoiceResponse = await fetch('/api/easycount/invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client.id,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone,
            amount: parseFloat(formData.amount),
            description: formData.description,
            paymentType: paymentTypeMap[formData.payment_method] || 1,
            documentType: parseInt(formData.document_type),
            apiKey: settings.easycount_api_key,
            developerEmail: settings.easycount_developer_email,
            useSandbox: settings.easycount_use_sandbox,
          }),
        })

        const invoiceResult = await invoiceResponse.json()
        console.log('EasyCount result:', invoiceResult)
        
        if (invoiceResult.success) {
          // Save invoice to database
          const { data: savedInvoice, error: invoiceError } = await supabase.from('invoices').insert({
            user_id: user.id,
            client_id: client.id,
            amount: parseFloat(formData.amount),
            status: 'paid',
            invoice_number: invoiceResult.documentNumber,
            green_invoice_id: invoiceResult.documentId,
            pdf_url: invoiceResult.pdfUrl || invoiceResult.documentUrl,
          }).select().single()
          
          // Also update payment with pdf_url for easy access
          if (paymentData?.id) {
            await supabase.from('payments').update({
              pdf_url: invoiceResult.pdfUrl || invoiceResult.documentUrl,
              invoice_number: invoiceResult.documentNumber,
            }).eq('id', paymentData.id)
            
            // Update local payment data
            paymentData.pdf_url = invoiceResult.pdfUrl || invoiceResult.documentUrl
            paymentData.invoice_number = invoiceResult.documentNumber
          }
          
          if (invoiceError) {
            console.error('Error saving invoice to DB:', invoiceError)
            toast.error('המסמך נוצר באיזיקאונט אך לא נשמר במערכת')
          } else {
            invoiceData = savedInvoice
            toast.success('המסמך נוצר בהצלחה!')
          }
        } else {
          console.error('Invoice creation failed:', invoiceResult.error)
          
          // Check for document type not allowed error
          if (invoiceResult.error?.includes("document type") && invoiceResult.error?.includes("can't be created")) {
            toast.error('לא ניתן ליצור סוג מסמך זה עבור סוג העסק שלך. עוסק פטור יכול ליצור קבלה בלבד.', {
              duration: 6000,
            })
          } else {
            toast.error(`התשלום נשמר, אך יצירת המסמך נכשלה: ${invoiceResult.error}`)
          }
        }

      } else if (settings?.green_invoice_connected && settings.green_invoice_api_key) {
        setStatus('יוצר חשבונית בחשבונית ירוקה...')
        
        const invoiceResponse = await fetch('/api/green-invoice/invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client.id,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone,
            amount: parseFloat(formData.amount),
            description: formData.description,
            paymentType: paymentTypeMap[formData.payment_method] || 1,
          }),
        })

        const invoiceResult = await invoiceResponse.json()
        
        if (invoiceResult.success) {
          const { data: savedInvoice } = await supabase.from('invoices').insert({
            user_id: user.id,
            client_id: client.id,
            amount: parseFloat(formData.amount),
            status: 'paid',
            invoice_number: invoiceResult.documentNumber,
            green_invoice_id: invoiceResult.documentId,
          }).select().single()
          
          invoiceData = savedInvoice
          toast.success('חשבונית נוצרה בהצלחה!')
        } else {
          console.error('Invoice creation failed:', invoiceResult.error)
          toast.error(`התשלום נשמר, אך יצירת החשבונית נכשלה: ${invoiceResult.error}`)
        }

      } else {
        // No accounting system connected
        toast.info('התשלום נשמר. חבר מערכת חשבוניות בהגדרות ליצירת חשבוניות אוטומטית.')
      }

      if (paymentData) onSuccess(paymentData, invoiceData)
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('שגיאה בהוספת תשלום')
    } finally {
      setLoading(false)
      setStatus('')
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
        padding: '28px',
        width: '100%',
        maxWidth: '400px',
        animation: 'slideUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>תשלום חדש + חשבונית</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <InputField label="סכום *" value={formData.amount} onChange={v => setFormData({...formData, amount: v})} type="number" required placeholder="₪" />
            <InputField label="תיאור לחשבונית" value={formData.description} onChange={v => setFormData({...formData, description: v})} placeholder="שירותי DJ לאירוע" />
            <InputField label="תאריך" value={formData.payment_date} onChange={v => setFormData({...formData, payment_date: v})} type="date" />
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>אמצעי תשלום</label>
              <select
                value={formData.payment_method}
                onChange={e => setFormData({...formData, payment_method: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9eef4', fontSize: '13px' }}
              >
                <option value="מזומן">מזומן</option>
                <option value="העברה בנקאית">העברה בנקאית</option>
                <option value="אשראי">אשראי</option>
                <option value="צ׳ק">צ׳ק</option>
                <option value="ביט">ביט</option>
                <option value="פייבוקס">פייבוקס</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>סוג מסמך</label>
              <select
                value={formData.document_type}
                onChange={e => setFormData({...formData, document_type: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9eef4', fontSize: '13px' }}
              >
                {documentTypes.map(dt => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label} - {dt.description}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                עוסק פטור יכול ליצור קבלה בלבד
              </p>
            </div>
            <InputField label="הערות" value={formData.notes} onChange={v => setFormData({...formData, notes: v})} />
          </div>

          {status && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#f0f9ff',
              color: '#0ea5e9',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              {status}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e9eef4', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer'
            }}>ביטול</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0ea5e9', color: '#fff', fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'מעבד...' : 'הוסף תשלום'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reusable Input Field
function InputField({ label, value, onChange, type = 'text', required = false, placeholder = '', dir = 'rtl' }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  dir?: 'rtl' | 'ltr'
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={type === 'date' ? '2020-01-01' : undefined}
        max={type === 'date' ? '2035-12-31' : undefined}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #e9eef4',
          fontSize: '13px',
          direction: dir,
          textAlign: dir === 'ltr' ? 'left' : 'right',
        }}
      />
    </div>
  )
}

// Questionnaire Button Component - Opens modal with full questionnaire
function QuestionnaireButton({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [questions, setQuestions] = useState<{
    id: string
    question: string
    type: 'text' | 'textarea' | 'select'
    options?: string[]
    required: boolean
  }[]>([])
  const [answers, setAnswers] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [answeredCount, setAnsweredCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load questions
      const { data: questionsData } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('order_num')
      
      if (questionsData) {
        setQuestions(questionsData)
      }

      // Load answers
      const { data: answersData } = await supabase
        .from('questionnaire_answers')
        .select('question_id, answer')
        .eq('client_id', clientId)
      
      if (answersData) {
        const answersMap = new Map<string, string>()
        answersData.forEach(a => {
          if (a.answer) answersMap.set(a.question_id, a.answer)
        })
        setAnswers(answersMap)
        setAnsweredCount(answersMap.size)
      }

      setLoading(false)
    }
    loadData()
  }, [clientId])

  const handleAnswerChange = async (questionId: string, answer: string) => {
    const newAnswers = new Map(answers)
    if (answer) {
      newAnswers.set(questionId, answer)
    } else {
      newAnswers.delete(questionId)
    }
    setAnswers(newAnswers)
    setAnsweredCount(newAnswers.size)

    // Auto-save
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('questionnaire_answers')
      .upsert({
        client_id: clientId,
        question_id: questionId,
        answer: answer,
        user_id: user.id,
      }, {
        onConflict: 'client_id,question_id',
      })
  }

  if (loading) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        padding: '20px',
        textAlign: 'center',
      }}>
        <Loader2 className="animate-spin" size={20} style={{ color: '#94a3b8' }} />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        padding: '20px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>
          שאלון
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          לא הוגדרו שאלות עדיין. <Link href="/dashboard/settings" style={{ color: '#0ea5e9' }}>הגדר שאלות בהגדרות</Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
              שאלון
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {answeredCount} מתוך {questions.length} שאלות נענו
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Mail size={18} />
            פתח שאלון
          </button>
        </div>
        
        {/* Progress bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(answeredCount / questions.length) * 100}%`,
              background: answeredCount === questions.length ? '#10b981' : '#0ea5e9',
              borderRadius: '3px',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                שאלון לקוח
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#64748b',
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{ marginBottom: index < questions.length - 1 ? '24px' : 0 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#0f172a', 
                    marginBottom: '8px' 
                  }}>
                    {index + 1}. {q.question}
                    {q.required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
                  </label>
                  
                  {q.type === 'text' && (
                    <input
                      type="text"
                      value={answers.get(q.id) || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e9eef4',
                        fontSize: '14px',
                      }}
                    />
                  )}
                  
                  {q.type === 'textarea' && (
                    <textarea
                      value={answers.get(q.id) || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e9eef4',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  )}
                  
                  {q.type === 'select' && (
                    <select
                      value={answers.get(q.id) || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e9eef4',
                        fontSize: '14px',
                        background: '#fff',
                      }}
                    >
                      <option value="">בחר...</option>
                      {q.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                השינויים נשמרים אוטומטית
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                סיום
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}