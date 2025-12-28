'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, CheckCircle, Clock, FileText, Download, Eye, Receipt } from 'lucide-react'
import { useInvoices, type Invoice } from '@/lib/hooks'
import { 
  StatCard, StatsGrid, FilterBar, DataTable, AvatarCell, BadgeCell,
  ActionsCell, ActionButton, EmptyState, type Column
} from '@/components/shared'

const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316']
const bgColors = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff', '#fff7ed']

const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'warning'
    case 'cancelled': return 'error'
    default: return 'default'
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

export default function InvoicesContent() {
  const { data, isLoading } = useInvoices()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  if (isLoading && !data) {
    return <InvoicesSkeleton />
  }

  const { invoices = [], monthTotal = 0, totalPaid = 0 } = data || {}

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = invoice.clients?.name || ''
    const matchesSearch = 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0)
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
  }

  const handleDownloadPdf = (invoice: Invoice) => {
    if (invoice.green_invoice_id) {
      window.open(`/api/green-invoice/pdf?id=${invoice.green_invoice_id}`, '_blank')
    }
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'number', header: 'מספר', width: '80px',
      render: (invoice) => <span style={{ fontWeight: 500, color: '#1e293b' }}>#{invoice.invoice_number || invoice.id.slice(0, 6)}</span>,
    },
    {
      key: 'client', header: 'לקוח', width: '2fr',
      render: (invoice, index) => {
        const clientName = invoice.clients?.name || 'לקוח לא ידוע'
        const partnerName = invoice.clients?.partner_name
        return (
          <AvatarCell
            name={clientName + (partnerName ? ` & ${partnerName}` : '')}
            subtitle={invoice.description || undefined}
            color={colors[index % 5]}
            bgColor={bgColors[index % 5]}
          />
        )
      },
    },
    {
      key: 'amount', header: 'סכום', width: '1fr',
      render: (invoice) => <span style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>₪{invoice.amount.toLocaleString()}</span>,
    },
    {
      key: 'date', header: 'תאריך', width: '1fr',
      render: (invoice) => <span style={{ color: '#64748b' }}>{new Date(invoice.created_at).toLocaleDateString('he-IL')}</span>,
    },
    {
      key: 'status', header: 'סטטוס', width: '100px',
      render: (invoice) => <BadgeCell label={getStatusLabel(invoice.status)} variant={getStatusVariant(invoice.status)} />,
    },
    {
      key: 'actions', header: '', width: '100px',
      render: (invoice) => (
        <ActionsCell>
          {invoice.client_id && (
            <Link href={`/dashboard/clients/${invoice.client_id}`}>
              <ActionButton icon={<Eye size={16} />} onClick={() => {}} title="צפה בלקוח" />
            </Link>
          )}
          {invoice.green_invoice_id && (
            <ActionButton icon={<Download size={16} />} onClick={() => handleDownloadPdf(invoice)} variant="success" title="הורד PDF" />
          )}
        </ActionsCell>
      ),
    },
  ]

  return (
    <div className="invoices-page">
      <StatsGrid columns={4}>
        <StatCard label="הכנסות החודש" value={`₪${monthTotal.toLocaleString()}`} icon={<TrendingUp size={18} color="#3b82f6" />} iconBg="#eff6ff" valueColor="#3b82f6" />
        <StatCard label="סה״כ שולם" value={`₪${totalPaid.toLocaleString()}`} icon={<CheckCircle size={18} color="#10b981" />} iconBg="#ecfdf5" valueColor="#10b981" />
        <StatCard label="ממתין לתשלום" value={`₪${pendingAmount.toLocaleString()}`} icon={<Clock size={18} color="#ca8a04" />} iconBg="#fefce8" valueColor="#ca8a04" />
        <StatCard label="סה״כ חשבוניות" value={stats.total} icon={<FileText size={18} color="#8b5cf6" />} iconBg="#f5f3ff" subtitle={`${stats.paid} שולמו • ${stats.pending} ממתינות`} />
      </StatsGrid>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="חיפוש חשבוניות..."
        filters={[{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: 'all', label: 'כל הסטטוסים' },
            { value: 'paid', label: 'שולם' },
            { value: 'pending', label: 'ממתין' },
            { value: 'cancelled', label: 'בוטל' },
          ],
        }]}
      />

      <DataTable
        columns={columns}
        data={filteredInvoices}
        keyExtractor={(invoice) => invoice.id}
        emptyState={
          <EmptyState
            icon={<Receipt size={48} />}
            title={searchQuery || statusFilter !== 'all' ? 'לא נמצאו חשבוניות' : 'אין חשבוניות עדיין'}
            description="חשבוניות ייצרו מדף הלקוח"
          />
        }
      />

      <style jsx>{`
        .invoices-page { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

function InvoicesSkeleton() {
  return (
    <div className="skeleton">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="shimmer" style={{ width: '100px', height: '14px', marginBottom: '12px' }} />
            <div className="shimmer" style={{ width: '80px', height: '28px' }} />
          </div>
        ))}
      </div>
      <div className="skeleton-card">
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: '16px', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div className="shimmer" style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
            <div style={{ flex: 1 }}><div className="shimmer" style={{ width: '140px', height: '14px' }} /></div>
          </div>
        ))}
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
