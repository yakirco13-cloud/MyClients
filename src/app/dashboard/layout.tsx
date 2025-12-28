'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
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
  { name: 'דשבורד', href: '/dashboard', icon: LayoutDashboard, queryKey: 'dashboard' },
  { name: 'לקוחות', href: '/dashboard/clients', icon: Users, queryKey: 'clients' },
  { name: 'ספריית שירים', href: '/dashboard/songs', icon: Music, queryKey: 'songs' },
  { name: 'חשבוניות', href: '/dashboard/invoices', icon: FileText, queryKey: 'invoices' },
  { name: 'הוצאות', href: '/dashboard/expenses', icon: Receipt, queryKey: 'expenses' },
  { name: 'הגדרות', href: '/dashboard/settings', icon: Settings, queryKey: 'settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const isFetching = useIsFetching()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
      {/* Progress bar - only shows when fetching */}
      {isFetching > 0 && <div className="progress-bar" />}

      {/* Mobile backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <span className="logo"><span className="logo-accent">My</span>Clients</span>
            <div className="logo-subtitle">ניהול לקוחות לעסקים</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="close-btn">
            <X size={20} color="#ffffff" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <div className="user-avatar">מ</div>
            <div className="user-info">
              <div className="user-name">המשתמש שלי</div>
              <div className="user-action">התנתקות</div>
            </div>
            <LogOut size={18} color="#94a3b8" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
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
            <button className="icon-btn"><Bell size={20} /></button>
            <Link href="/dashboard/clients" className="primary-btn" prefetch={true}>
              <Plus size={20} /><span>לקוח חדש</span>
            </Link>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: #f4f7fa;
          display: flex;
          direction: rtl;
        }

        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0ea5e9, #38bdf8, #0ea5e9);
          background-size: 200% 100%;
          animation: progress 1s ease-in-out infinite;
          z-index: 9999;
        }

        @keyframes progress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
          display: flex;
          flex-direction: column;
          z-index: 50;
          transform: translateX(100%);
          transition: transform 0.2s ease;
        }

        .sidebar-open { transform: translateX(0); }

        .sidebar-header {
          padding: 28px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .logo { font-size: 24px; font-weight: 700; color: #ffffff; }
        .logo-accent { color: #38bdf8; }
        .logo-subtitle { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .close-btn { background: none; border: none; cursor: pointer; padding: 4px; }

        @media (min-width: 1024px) {
          .sidebar { position: relative; transform: translateX(0); }
          .sidebar-backdrop { display: none; }
          .menu-btn { display: none !important; }
          .close-btn { display: none !important; }
        }

        .sidebar-nav { padding: 0 16px; flex: 1; }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 14px;
          text-decoration: none;
          margin-bottom: 4px;
          color: #94a3b8;
          transition: all 0.15s ease;
        }

        .nav-link:hover { background: rgba(255,255,255,0.08); color: #ffffff; }
        .nav-link.active { background: #0ea5e9; color: #ffffff; font-weight: 500; }

        .sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.1); }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 12px;
          transition: background 0.15s ease;
        }

        .logout-btn:hover { background: rgba(255,255,255,0.05); }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #0ea5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 600;
        }

        .user-info { flex: 1; text-align: right; }
        .user-name { color: #ffffff; font-size: 14px; font-weight: 500; }
        .user-action { color: #94a3b8; font-size: 12px; }

        .main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .top-header {
          background: #fff;
          padding: 20px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9eef4;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .header-right { display: flex; align-items: center; gap: 16px; }
        .menu-btn { background: none; border: none; cursor: pointer; padding: 8px; margin: -8px; }
        .page-title { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; }
        .page-date { font-size: 13px; color: #64748b; margin: 6px 0 0 0; }
        .header-left { display: flex; align-items: center; gap: 14px; }

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
          transition: all 0.15s ease;
        }

        .icon-btn:hover { border-color: #cbd5e1; background: #f8fafc; }

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
          transition: background 0.15s ease;
        }

        .primary-btn:hover { background: #0284c7; }

        .main-content { padding: 28px 36px; flex: 1; }
      `}</style>
    </div>
  )
}
