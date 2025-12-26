'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, FileText, Download, Eye, Filter,
  TrendingUp, CheckCircle, Clock, AlertCircle,
  Plus, Receipt, Calendar
} from 'lucide-react'

type Invoice = {
  id: string
  invoice_number?: string
  amount: number
  status: string
  description?: string
  green_invoice_id?: string
  green_invoice_url?: string
  created_at: string
  client_id?: string
  clients?: {
    name: string
    partner_name?: string
  }
}

type Props = {
  invoices: Invoice[]
  monthTotal: number
  totalPaid: number
}

export default function InvoicesContent({ invoices, monthTotal, totalPaid }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = invoice.clients?.name || ''
    const matchesSearch = 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0)
  const pendingAmount = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    monthTotal,
    totalPaid,
    pendingAmount,
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return { background: '#ecfdf5', color: '#10b981' }
      case 'pending':
        return { background: '#fefce8', color: '#ca8a04' }
      case 'cancelled':
        return { background: '#fef2f2', color: '#ef4444' }
      default:
        return { background: '#f1f5f9', color: '#64748b' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'שולם'
      case 'pending': return 'ממתין'
      case 'cancelled': return 'בוטל'
      default: return status
    }
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (invoice.green_invoice_id) {
      window.open(`/api/green-invoice/pdf?id=${invoice.green_invoice_id}`, '_blank')
    }
  }

  return (
    <div>
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '28px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={18} color="#3b82f6" />
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>הכנסות החודש</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
            ₪{stats.monthTotal.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={18} color="#10b981" />
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>סה״כ שולם</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
            ₪{stats.totalPaid.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#fefce8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={18} color="#ca8a04" />
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>ממתין לתשלום</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ca8a04' }}>
            ₪{stats.pendingAmount.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={18} color="#8b5cf6" />
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>סה״כ חשבוניות</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {stats.paid} שולמו • {stats.pending} ממתינות
          </div>
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
            placeholder="חיפוש חשבוניות..."
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

        {/* Filter */}
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
            <option value="paid">שולם</option>
            <option value="pending">ממתין</option>
            <option value="cancelled">בוטל</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 2fr 1fr 1fr 100px 100px',
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e9eef4',
          fontSize: '12px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <div>מספר</div>
          <div>לקוח</div>
          <div>סכום</div>
          <div>תאריך</div>
          <div>סטטוס</div>
          <div></div>
        </div>

        {/* Table Body */}
        {filteredInvoices.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Receipt size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{searchQuery || statusFilter !== 'all' ? 'לא נמצאו חשבוניות תואמות' : 'אין חשבוניות עדיין'}</p>
            <p style={{ fontSize: '13px' }}>חשבוניות ייצרו מדף הלקוח</p>
          </div>
        ) : (
          filteredInvoices.map((invoice, i) => {
            const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316']
            const bgs = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff', '#fff7ed']
            const clientName = invoice.clients?.name || 'לקוח לא ידוע'
            const partnerName = invoice.clients?.partner_name
            
            return (
              <div
                key={invoice.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 2fr 1fr 1fr 100px 100px',
                  padding: '18px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center',
                }}
              >
                {/* Invoice Number */}
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  #{invoice.invoice_number || invoice.id.slice(0, 6)}
                </div>

                {/* Client */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: bgs[i % 5],
                    color: colors[i % 5],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}>
                    {clientName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                      {clientName}{partnerName && ` & ${partnerName}`}
                    </div>
                    {invoice.description && (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{invoice.description}</div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>
                  ₪{invoice.amount.toLocaleString()}
                </div>

                {/* Date */}
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {new Date(invoice.created_at).toLocaleDateString('he-IL')}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    ...getStatusStyle(invoice.status),
                  }}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {invoice.client_id && (
                    <Link
                      href={`/dashboard/clients/${invoice.client_id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: '#64748b',
                        textDecoration: 'none',
                      }}
                    >
                      <Eye size={16} />
                    </Link>
                  )}
                  {invoice.green_invoice_id && (
                    <button
                      onClick={() => handleDownloadPdf(invoice)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        color: '#10b981',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Summary Footer */}
      {invoices.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '20px',
          padding: '20px 24px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>סה״כ הכנסות</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                ₪{totalAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>שולם</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                ₪{stats.totalPaid.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>ממתין</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#ca8a04' }}>
                ₪{stats.pendingAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}