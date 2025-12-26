'use client'

import { Users, Calendar, TrendingUp, Receipt, Plus, FileText } from 'lucide-react'
import Link from 'next/link'

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

export default function DashboardContent({ 
  totalClients, 
  activeClients, 
  upcomingEvents, 
  monthRevenue, 
  pendingInvoices 
}: Props) {
  return (
    <div className="dashboard-grid">
      {/* Main Column */}
      <div className="main-column">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">לקוחות פעילים</span>
              <div className="stat-icon" style={{ background: '#eff6ff' }}>
                <Users size={22} color="#3b82f6" />
              </div>
            </div>
            <div className="stat-value">{totalClients}</div>
            <div className="stat-footer">
              <div className="stat-trend">
                <TrendingUp size={14} />
                <span>12%</span>
              </div>
              <span className="stat-subtitle">{activeClients} פעילים</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">אירועים קרובים</span>
              <div className="stat-icon" style={{ background: '#fefce8' }}>
                <Calendar size={22} color="#eab308" />
              </div>
            </div>
            <div className="stat-value">{upcomingEvents.length}</div>
            <div className="stat-footer">
              <span className="stat-subtitle">ב-30 הימים הקרובים</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">הכנסות החודש</span>
              <div className="stat-icon" style={{ background: '#ecfdf5' }}>
                <TrendingUp size={22} color="#10b981" />
              </div>
            </div>
            <div className="stat-value">₪{monthRevenue.toLocaleString()}</div>
            <div className="stat-footer">
              <div className="stat-trend">
                <TrendingUp size={14} />
                <span>23%</span>
              </div>
              <span className="stat-subtitle">מהחודש שעבר</span>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>אירועים קרובים</h3>
            <Link href="/dashboard/clients" style={{ fontSize: '13px', color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>צפה בהכל ←</Link>
          </div>
          
          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Calendar size={48} style={{ opacity: 0.3 }} />
              <p>אין אירועים קרובים</p>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 120px',
                padding: '14px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                textAlign: 'right',
              }}>
                <div>לקוח</div>
                <div>מיקום</div>
                <div>תאריך</div>
                <div>סטטוס</div>
              </div>
              
              {/* Table Rows */}
              {upcomingEvents.map((event, i) => {
                const daysUntil = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000)
                const colors = ['#3b82f6', '#eab308', '#10b981', '#8b5cf6']
                const bgs = ['#eff6ff', '#fefce8', '#ecfdf5', '#f5f3ff']
                return (
                  <Link 
                    key={event.id} 
                    href={`/dashboard/clients/${event.id}`} 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 120px',
                      padding: '18px 0',
                      borderBottom: '1px solid #f1f5f9',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {/* Client */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '10px', 
                        background: bgs[i % 4], 
                        color: colors[i % 4],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '15px',
                      }}>
                        {event.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                          {event.name}{event.partner_name && ` & ${event.partner_name}`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>אירוע</div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{event.venue_name || 'לא צוין'}</div>
                    
                    {/* Date */}
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{new Date(event.event_date).toLocaleDateString('he-IL')}</div>
                    
                    {/* Status */}
                    <div>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-block',
                        background: daysUntil <= 7 ? '#fef2f2' : '#ecfdf5',
                        color: daysUntil <= 7 ? '#ef4444' : '#10b981',
                      }}>
                        {daysUntil === 0 ? 'היום!' : daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar-column">
        <div className="card pending-card">
          <h3>חשבוניות ממתינות</h3>
          <div className="pending-box">
            <div className="pending-number">{pendingInvoices}</div>
            <span>ממתינות לתשלום</span>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 20px 0' }}>פעולות מהירות</h3>
          <Link href="/dashboard/clients" style={{
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
            <Plus size={18} color="#ffffff" />
            הוסף לקוח חדש
          </Link>
          <Link href="/dashboard/invoices" style={{
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
            <FileText size={18} color="#ffffff" />
            צור חשבונית
          </Link>
          <Link href="/dashboard/expenses" style={{
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
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Receipt size={18} color="#ffffff" />
            הוסף הוצאה
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-grid {
          display: flex;
          gap: 28px;
        }
        .main-column { flex: 1; }
        .sidebar-column { width: 300px; flex-shrink: 0; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 28px;
        }
        
        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e9eef4;
        }
        
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        
        .stat-label {
          font-size: 13px;
          color: #64748b;
        }
        
        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1.5px;
          margin-bottom: 12px;
        }
        
        .stat-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #ecfdf5;
          padding: 4px 10px;
          border-radius: 6px;
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
        }
        
        .stat-subtitle {
          color: #94a3b8;
          font-size: 12px;
        }
        
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
        
        .link {
          font-size: 13px;
          color: #0ea5e9;
          text-decoration: none;
          font-weight: 500;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 0;
          color: #94a3b8;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 18px 0;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        
        .table-row:hover {
          background: #f8fafc;
          margin: 0 -28px;
          padding: 18px 28px;
        }
        
        .client-cell {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        
        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
        }
        
        .client-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }
        
        .client-type {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .cell {
          font-size: 14px;
          color: #64748b;
        }
        
        .badge {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        
        .badge-success {
          background: #ecfdf5;
          color: #10b981;
        }
        
        .badge-warning {
          background: #fef2f2;
          color: #ef4444;
        }
        
        .pending-card {
          margin-bottom: 24px;
          padding: 24px;
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
        
        .action-btn {
          display: flex !important;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .action-btn:last-child {
          margin-bottom: 0;
        }
        
        .action-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            flex-direction: column;
          }
          .sidebar-column {
            width: 100%;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}