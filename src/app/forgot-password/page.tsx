'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('שגיאה בשליחת האימייל')
    } finally {
      setLoading(false)
    }
  }

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
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Back Link */}
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '14px',
            textDecoration: 'none',
            marginBottom: '32px',
          }}
        >
          <ArrowRight size={18} />
          חזרה להתחברות
        </Link>

        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            <span style={{ color: '#0ea5e9' }}>My</span>Clients
          </h1>
        </div>

        {success ? (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
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
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
              האימייל נשלח!
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              שלחנו לך קישור לאיפוס הסיסמה לכתובת <strong style={{ color: '#0f172a' }}>{email}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
              לא קיבלת? בדוק בתיקיית הספאם
            </p>
          </div>
        ) : (
          <>
            {/* Title */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
                שכחת סיסמה?
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
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
              <div style={{ marginBottom: '24px' }}>
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}