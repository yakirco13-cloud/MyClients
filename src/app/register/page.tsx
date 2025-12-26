'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, Loader2, Eye, EyeOff, Check } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('כתובת האימייל כבר רשומה במערכת')
        } else {
          setError(error.message)
        }
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('שגיאה בהרשמה')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f7fa',
        padding: '40px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '420px',
          border: '1px solid #e9eef4',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Check size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
            נרשמת בהצלחה! 🎉
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
            שלחנו לך אימייל לאימות החשבון. אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 32px',
              borderRadius: '10px',
              background: '#0ea5e9',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            המשך להתחברות
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f4f7fa',
    }}>
      {/* Left Side - Hero */}
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
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            <span style={{ color: '#0ea5e9' }}>My</span>Clients
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}>
            הצטרף לאלפי עסקים שכבר מנהלים את הלקוחות שלהם בצורה חכמה
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            <div style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0ea5e9' }}>1,000+</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>עסקים פעילים</div>
            </div>
            <div style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>50K+</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>חשבוניות נוצרו</div>
            </div>
            <div style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>99%</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>שביעות רצון</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
          {/* Welcome */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
              צור חשבון חדש ✨
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              הרשמה חינמית תוך פחות מדקה
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
                שם מלא
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
                <User size={20} color="#94a3b8" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ישראל ישראלי"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    background: 'transparent',
                  }}
                />
              </div>
            </div>

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

            <div style={{ marginBottom: '20px' }}>
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
                  placeholder="לפחות 6 תווים"
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

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#64748b',
                marginBottom: '8px',
              }}>
                אימות סיסמה
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
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="הקלד שוב את הסיסמה"
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
              {loading ? 'יוצר חשבון...' : 'צור חשבון'}
            </button>
          </form>

          {/* Terms */}
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '20px',
            lineHeight: 1.6,
          }}>
            בהרשמה אתה מסכים ל
            <a href="#" style={{ color: '#0ea5e9', textDecoration: 'none' }}> תנאי השימוש </a>
            ול
            <a href="#" style={{ color: '#0ea5e9', textDecoration: 'none' }}> מדיניות הפרטיות</a>
          </p>

          {/* Login Link */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b',
            marginTop: '24px',
          }}>
            כבר יש לך חשבון?{' '}
            <Link
              href="/login"
              style={{
                color: '#0ea5e9',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              התחבר
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}