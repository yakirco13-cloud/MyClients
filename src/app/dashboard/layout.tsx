'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useIsFetching } from '@tanstack/react-query'
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
    <div style={{
      minHeight: '100vh',
      background: '#f4f7fa',
      display: 'flex',
      direction: 'rtl',
    }}>
      {/* Progress bar */}
      {isFetching > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #0ea5e9, #38bdf8, #0ea5e9)',
          backgroundSize: '200% 100%',
          animation: 'progress 1s ease-in-out infinite',
          zIndex: 9999,
        }} />
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }} 
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: sidebarOpen ? 'fixed' : undefined,
        top: 0,
        right: 0,
        height: '100vh',
        width: '260px',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.2s ease',
      }} className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
              <span style={{ color: '#38bdf8' }}>My</span>Clients
            </span>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ניהול לקוחות לעסקים</div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="close-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} color="#ffffff" />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 16px', flex: 1 }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
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
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '12px',
            }}
          >
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          background: '#fff',
          padding: '20px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e9eef4',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="menu-btn" 
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', margin: '-8px' }}
            >
              <Menu size={24} color="#0f172a" />
            </button>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{getPageTitle()}</h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 0' }}>
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              border: '1px solid #e9eef4',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}>
              <Bell size={20} />
            </button>
            <Link 
              href="/dashboard/clients" 
              prefetch={true}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '10px',
                background: '#0ea5e9',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Plus size={20} />
              <span>לקוח חדש</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '28px 36px', flex: 1 }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .sidebar {
          position: fixed;
          transform: translateX(100%);
        }

        .sidebar.sidebar-open {
          transform: translateX(0);
        }

        @media (min-width: 1024px) {
          .sidebar {
            position: relative !important;
            transform: translateX(0) !important;
          }
          .menu-btn {
            display: none !important;
          }
          .close-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
