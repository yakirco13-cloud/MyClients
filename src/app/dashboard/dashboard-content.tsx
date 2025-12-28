'use client'

import { Users, Calendar, TrendingUp, Receipt, Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { 
  StatCard, 
  StatsGrid, 
  DataTable, 
  AvatarCell, 
  BadgeCell,
  EmptyState,
  type Column 
} from '@/components/shared'

type Event = {
  id: string
  name: string
  partner_name?: string
  event_date: string
  venue_name?: string
}

type Props = {
  totalClients: number
  activeClients: number
  upcomingEvents: Event[]
  monthRevenue: number
  pendingInvoices: number
}

// Color rotation for avatars
const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6']
const bgColors = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff']

export default function DashboardContent({ 
  totalClients, 
  activeClients, 
  upcomingEvents, 
  monthRevenue, 
  pendingInvoices 
}: Props) {
  
  // Table columns definition
  const eventColumns: Column<Event>[] = [
    {
      key: 'client',
      header: 'לקוח',
      width: '2fr',
      render: (event, index) => (
        <AvatarCell
          name={event.name + (event.partner_name ? ` & ${event.partner_name}` : '')}
          subtitle="אירוע"
          color={colors[index % 4]}
          bgColor={bgColors[index % 4]}
        />
      ),
    },
    {
      key: 'venue',
      header: 'מיקום',
      width: '1fr',
      render: (event) => (
        <span style={{ color: '#64748b' }}>{event.venue_name || 'לא צוין'}</span>
      ),
    },
    {
      key: 'date',
      header: 'תאריך',
      width: '1fr',
      render: (event) => (
        <span style={{ color: '#64748b' }}>
          {new Date(event.event_date).toLocaleDateString('he-IL')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '120px',
      render: (event) => {
        const daysUntil = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000)
        const label = daysUntil === 0 ? 'היום!' : daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`
        return (
          <BadgeCell 
            label={label} 
            variant={daysUntil <= 7 ? 'error' : 'success'} 
          />
        )
      },
    },
  ]

  return (
    <div className="dashboard-grid">
      {/* Main Column */}
      <div className="main-column">
        {/* Stats */}
        <StatsGrid columns={3}>
          <StatCard
            label="לקוחות פעילים"
            value={totalClients}
            icon={<Users size={22} color="#3b82f6" />}
            iconBg="#eff6ff"
            trend={{ value: '12%', positive: true }}
            subtitle={`${activeClients} פעילים`}
          />
          <StatCard
            label="אירועים קרובים"
            value={upcomingEvents.length}
            icon={<Calendar size={22} color="#eab308" />}
            iconBg="#fefce8"
            subtitle="ב-30 הימים הקרובים"
          />
          <StatCard
            label="הכנסות החודש"
            value={`₪${monthRevenue.toLocaleString()}`}
            icon={<TrendingUp size={22} color="#10b981" />}
            iconBg="#ecfdf5"
            trend={{ value: '23%', positive: true }}
            subtitle="מהחודש שעבר"
          />
        </StatsGrid>

        {/* Events Table */}
        <div className="card">
          <div className="card-header">
            <h3>אירועים קרובים</h3>
            <Link href="/dashboard/clients" className="link">צפה בהכל ←</Link>
          </div>
          
          <DataTable
            columns={eventColumns}
            data={upcomingEvents}
            keyExtractor={(event) => event.id}
            onRowClick={(event) => {
              window.location.href = `/dashboard/clients/${event.id}`
            }}
            emptyState={
              <EmptyState
                icon={<Calendar size={48} />}
                title="אין אירועים קרובים"
                description="אירועים חדשים יופיעו כאן"
              />
            }
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar-column">
        {/* Pending Invoices */}
        <div className="pending-card">
          <h3>חשבוניות ממתינות</h3>
          <div className="pending-box">
            <div className="pending-number">{pendingInvoices}</div>
            <span>ממתינות לתשלום</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>פעולות מהירות</h3>
          <QuickActionLink href="/dashboard/clients" icon={<Plus size={18} />}>
            הוסף לקוח חדש
          </QuickActionLink>
          <QuickActionLink href="/dashboard/invoices" icon={<FileText size={18} />}>
            צור חשבונית
          </QuickActionLink>
          <QuickActionLink href="/dashboard/expenses" icon={<Receipt size={18} />}>
            הוסף הוצאה
          </QuickActionLink>
        </div>
      </div>

      <style jsx>{`
        .dashboard-grid {
          display: flex;
          gap: 28px;
        }
        .main-column { flex: 1; }
        .sidebar-column { width: 300px; flex-shrink: 0; }
        
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          border: 1px solid #e9eef4;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .card-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        
        .card-header :global(.link) {
          font-size: 13px;
          color: #0ea5e9;
          text-decoration: none;
          font-weight: 500;
        }
        
        .pending-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e9eef4;
          margin-bottom: 24px;
        }
        
        .pending-card h3 {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 20px 0;
        }
        
        .pending-box {
          padding: 20px;
          background: #fefce8;
          border-radius: 12px;
          text-align: center;
        }
        
        .pending-number {
          font-size: 32px;
          font-weight: 700;
          color: #a16207;
          margin-bottom: 4px;
        }
        
        .pending-box span {
          font-size: 13px;
          color: #a16207;
        }
        
        .quick-actions {
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
          border-radius: 16px;
          padding: 24px;
        }
        
        .quick-actions h3 {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 20px 0;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            flex-direction: column;
          }
          .sidebar-column {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

// Quick action link component
function QuickActionLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.1)',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 500,
      textDecoration: 'none',
      marginBottom: '10px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {icon}
      {children}
    </Link>
  )
}
