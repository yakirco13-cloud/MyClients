'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Plus,
  Music
} from 'lucide-react'

const navigation = [
  { name: 'דשבורד', href: '/dashboard', icon: LayoutDashboard },
  { name: 'לקוחות', href: '/dashboard/clients', icon: Users },
  { name: 'ספריית שירים', href: '/dashboard/songs', icon: Music },
  { name: 'חשבוניות', href: '/dashboard/invoices', icon: FileText },
  { name: 'הוצאות', href: '/dashboard/expenses', icon: Receipt },
  { name: 'הגדרות', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'סקירה כללית'
    if (pathname.includes('/clients')) return 'לקוחות'
    if (pathname.includes('/songs')) return 'ספריית שירים'
    if (pathname.includes('/invoices')) return 'חשבוניות'
    if (pathname.includes('/expenses')) return 'הוצאות'
    if (pathname.includes('/settings')) return 'הגדרות'
    return 'דשבורד'
  }

  return (
    <div className="app-container">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
              <span style={{ color: '#38bdf8' }}>My</span>Clients
            </span>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ניהול לקוחות לעסקים</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }} className="close-btn">
            <X size={20} color="#ffffff" />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  textDecoration: 'none',
                  marginBottom: '4px',
                  background: isActive ? '#0ea5e9' : 'transparent',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={20} strokeWidth={1.8} color={isActive ? '#ffffff' : '#cbd5e1'} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <button onClick={handleLogout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '16px',
            }}>מ</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>המשתמש שלי</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>התנתקות</div>
            </div>
            <LogOut size={18} color="#94a3b8" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="top-header">
          <div className="header-right">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} color="#0f172a" />
            </button>
            <div>
              <h1 className="page-title">{getPageTitle()}</h1>
              <p className="page-date">
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="header-left">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <Link href="/dashboard/clients" className="primary-btn">
              <Plus size={20} />
              לקוח חדש
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: #f4f7fa;
          display: flex;
          direction: rtl;
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 40;
        }

        .sidebar {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 260px;
          background: #0f172a;
          padding: 28px 0;
          display: flex;
          flex-direction: column;
          z-index: 50;
          transform: translateX(100%);
          transition: transform 0.2s ease;
        }

        .sidebar-open {
          transform: translateX(0);
        }

        @media (min-width: 1024px) {
          .sidebar {
            position: relative;
            transform: translateX(0);
          }
          .sidebar-backdrop {
            display: none;
          }
          .menu-btn {
            display: none !important;
          }
          .close-btn {
            display: none !important;
          }
        }

        .sidebar-header {
          padding: 0 28px;
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
        }

        .logo-accent {
          color: #38bdf8;
        }

        .logo-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        .close-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
        }

        .sidebar-nav {
          padding: 0 16px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          color: #94a3b8 !important;
          font-size: 14px;
          text-decoration: none;
          margin-bottom: 4px;
          transition: all 0.15s ease;
          background: transparent;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff !important;
        }

        .nav-item-active {
          background: #0ea5e9 !important;
          color: #ffffff !important;
          font-weight: 500;
        }

        .sidebar-footer {
          padding: 0 16px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          width: 100%;
          cursor: pointer;
          color: #94a3b8;
        }

        .user-avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 16px;
        }

        .user-info {
          flex: 1;
          text-align: right;
        }

        .user-name {
          color: #fff;
          font-weight: 500;
          font-size: 14px;
        }

        .user-action {
          color: #64748b;
          font-size: 12px;
        }

        .main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }

        .top-header {
          background: #fff;
          padding: 20px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9eef4;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #0f172a;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .page-date {
          font-size: 13px;
          color: #64748b;
          margin: 6px 0 0 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #e9eef4;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-radius: 10px;
          background: #0ea5e9;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
        }

        .primary-btn:hover {
          background: #0369a1;
        }

        .main-content {
          padding: 28px 36px;
          flex: 1;
        }
      `}</style>
    </div>
  )
}