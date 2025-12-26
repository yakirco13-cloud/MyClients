'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        if (error.message.includes('Invalid login')) {
          setError('אימייל או סיסמה שגויים')
        } else {
          setError(error.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f4f7fa',
    }}>
      {/* Left Side - Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              <span style={{ color: '#0ea5e9' }}>My</span>Clients
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
              ניהול לקוחות לעסקים
            </p>
          </div>

          {/* Welcome */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
              ברוכים הבאים 👋
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              התחבר לחשבון שלך כדי להמשיך
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '24px',
              border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#64748b',
                marginBottom: '8px',
              }}>
                אימייל
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fff',
                border: '1px solid #e9eef4',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <Mail size={20} color="#94a3b8" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    background: 'transparent',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#64748b',
                marginBottom: '8px',
              }}>
                סיסמה
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fff',
                border: '1px solid #e9eef4',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <Lock size={20} color="#94a3b8" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    background: 'transparent',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#94a3b8" />
                  ) : (
                    <Eye size={20} color="#94a3b8" />
                  )}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b',
                cursor: 'pointer',
              }}>
                <input type="checkbox" style={{ accentColor: '#0ea5e9' }} />
                זכור אותי
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: '#0ea5e9',
                  textDecoration: 'none',
                }}
              >
                שכחת סיסמה?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '10px',
                background: '#0ea5e9',
                color: '#fff',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b',
            marginTop: '28px',
          }}>
            אין לך חשבון?{' '}
            <Link
              href="/register"
              style={{
                color: '#0ea5e9',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              הירשם עכשיו
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '400px' }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'rgba(14, 165, 233, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '16px',
          }}>
            נהל את הלקוחות שלך בקלות
          </h2>
          
          <p style={{
            fontSize: '15px',
            color: '#94a3b8',
            lineHeight: 1.7,
            marginBottom: '40px',
          }}>
            מערכת מתקדמת לניהול לקוחות, אירועים, תשלומים וחשבוניות - הכל במקום אחד
          </p>

          {/* Features */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'right',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span style={{ fontSize: '14px', color: '#fff' }}>ניהול לקוחות ואירועים</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <span style={{ fontSize: '14px', color: '#fff' }}>חשבוניות אוטומטיות עם חשבונית ירוקה</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fefce8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span style={{ fontSize: '14px', color: '#fff' }}>סריקת קבלות חכמה עם AI</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        
        @media (max-width: 900px) {
          .hero-side {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}