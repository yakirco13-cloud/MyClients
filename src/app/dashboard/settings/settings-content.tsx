'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Building, Bell, 
  Check, X, Loader2, ExternalLink, Save,
  Mail, Phone, Link2, ChevronDown, ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type User = {
  id: string
  email?: string
}

type Settings = {
  id?: string
  user_id: string
  business_name?: string
  business_id?: string
  business_type?: string
  phone?: string
  email?: string
  address?: string
  // Green Invoice
  green_invoice_api_key?: string
  green_invoice_api_secret?: string
  green_invoice_connected?: boolean
  // EasyCount
  easycount_api_key?: string
  easycount_developer_email?: string
  easycount_connected?: boolean
  easycount_use_sandbox?: boolean
} | null

type Props = {
  user: User
  settings: Settings
}

export default function SettingsContent({ user, settings: initialSettings }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('business')
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)

  const [businessForm, setBusinessForm] = useState({
    business_name: settings?.business_name || '',
    business_id: settings?.business_id || '',
    business_type: settings?.business_type || 'עוסק פטור',
    phone: settings?.phone || '',
    email: settings?.email || user?.email || '',
    address: settings?.address || '',
  })

  const tabs = [
    { id: 'business', label: 'פרטי העסק', icon: Building },
    { id: 'connections', label: 'חיבורים', icon: Link2 },
    { id: 'account', label: 'חשבון', icon: User },
    { id: 'notifications', label: 'התראות', icon: Bell },
  ]

  const handleSaveBusiness = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      const data = {
        user_id: user.id,
        business_name: businessForm.business_name || null,
        business_id: businessForm.business_id || null,
        business_type: businessForm.business_type || null,
        phone: businessForm.phone || null,
        email: businessForm.email || null,
        address: businessForm.address || null,
      }

      if (settings?.id) {
        await supabase.from('user_settings').update(data).eq('id', settings.id)
      } else {
        const { data: newSettings } = await supabase.from('user_settings').insert(data).select().single()
        if (newSettings) setSettings(newSettings)
      }

      toast.success('הפרטים נשמרו בהצלחה!')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('שגיאה בשמירת הפרטים')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '28px' }}>
      {/* Sidebar Tabs */}
      <div style={{
        width: '240px',
        flexShrink: 0,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e9eef4',
          overflow: 'hidden',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '16px 20px',
                  border: 'none',
                  background: isActive ? '#f0f9ff' : 'transparent',
                  color: isActive ? '#0ea5e9' : '#64748b',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  borderRight: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
                  textAlign: 'right',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {/* Business Details */}
        {activeTab === 'business' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e9eef4',
            padding: '32px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              פרטי העסק
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
              פרטים אלו יופיעו בחשבוניות ובמסמכים
            </p>

            <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
              <InputField
                label="שם העסק"
                value={businessForm.business_name}
                onChange={v => setBusinessForm({...businessForm, business_name: v})}
                placeholder="הכנס את שם העסק"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField
                  label="ח.פ / עוסק מורשה"
                  value={businessForm.business_id}
                  onChange={v => setBusinessForm({...businessForm, business_id: v})}
                  placeholder="מספר עוסק"
                />
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '8px' }}>
                    סוג עסק
                  </label>
                  <select
                    value={businessForm.business_type}
                    onChange={e => setBusinessForm({...businessForm, business_type: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e9eef4',
                      fontSize: '14px',
                      background: '#fff',
                    }}
                  >
                    <option value="עוסק פטור">עוסק פטור</option>
                    <option value="עוסק מורשה">עוסק מורשה</option>
                    <option value="חברה בע״מ">חברה בע״מ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField
                  label="טלפון"
                  value={businessForm.phone}
                  onChange={v => setBusinessForm({...businessForm, phone: v})}
                  placeholder="050-0000000"
                  icon={<Phone size={16} color="#94a3b8" />}
                />
                <InputField
                  label="אימייל"
                  value={businessForm.email}
                  onChange={v => setBusinessForm({...businessForm, email: v})}
                  placeholder="email@example.com"
                  icon={<Mail size={16} color="#94a3b8" />}
                />
              </div>

              <InputField
                label="כתובת"
                value={businessForm.address}
                onChange={v => setBusinessForm({...businessForm, address: v})}
                placeholder="כתובת העסק"
              />

              <button
                onClick={handleSaveBusiness}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#0ea5e9',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: 'fit-content',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                שמור
              </button>
            </div>
          </div>
        )}

        {/* Connections */}
        {activeTab === 'connections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                חיבורים
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                חבר את החשבון שלך למערכת הנהלת חשבונות (ניתן לחבר מערכת אחת בלבד)
              </p>
            </div>

            {/* Info when one is connected */}
            {(settings?.green_invoice_connected || settings?.easycount_connected) && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#3b82f6',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>ℹ️</span>
                <span>
                  אתה מחובר ל{settings?.green_invoice_connected ? 'חשבונית ירוקה' : 'איזיקאונט'}. 
                  כדי להתחבר למערכת אחרת, יש לנתק את החיבור הקיים קודם.
                </span>
              </div>
            )}

            {/* Green Invoice Card */}
            <ConnectionCard
              name="חשבונית ירוקה"
              description="הפקת חשבוניות, קבלות וניהול הוצאות"
              logo="🟢"
              connected={settings?.green_invoice_connected || false}
              disabled={settings?.easycount_connected || false}
              settings={settings}
              user={user}
              onUpdate={setSettings}
              type="greeninvoice"
            />

            {/* EasyCount Card */}
            <ConnectionCard
              name="איזיקאונט"
              description="EasyCount - מערכת חשבוניות והנהלת חשבונות"
              logo="📄"
              connected={settings?.easycount_connected || false}
              disabled={settings?.green_invoice_connected || false}
              settings={settings}
              user={user}
              onUpdate={setSettings}
              type="easycount"
            />
          </div>
        )}

        {/* Account */}
        {activeTab === 'account' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e9eef4',
            padding: '32px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              חשבון
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
              ניהול פרטי החשבון שלך
            </p>

            <div style={{ maxWidth: '400px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '8px' }}>
                  אימייל
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e9eef4',
                    background: '#f8fafc',
                    fontSize: '14px',
                    color: '#64748b',
                  }}
                />
              </div>

              <div style={{
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '1px solid #fee2e2',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>
                  אזור מסוכן
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  מחיקת החשבון היא פעולה בלתי הפיכה
                </p>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fff',
                    color: '#ef4444',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  מחק חשבון
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e9eef4',
            padding: '32px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              התראות
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
              בחר אילו התראות תרצה לקבל
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <ToggleOption label="התראות על תשלומים חדשים" defaultChecked />
              <ToggleOption label="תזכורות לאירועים קרובים" defaultChecked />
              <ToggleOption label="התראות על חשבוניות חדשות" />
              <ToggleOption label="סיכום שבועי במייל" />
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// Connection Card Component
function ConnectionCard({ name, description, logo, connected, disabled, settings, user, onUpdate, type }: {
  name: string
  description: string
  logo: string
  connected: boolean
  disabled: boolean
  settings: Settings
  user: User
  onUpdate: (settings: Settings) => void
  type: 'greeninvoice' | 'easycount'
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Auto-collapse when disabled
  useEffect(() => {
    if (disabled) {
      setExpanded(false)
    }
  }, [disabled])

  // Green Invoice form
  const [giForm, setGiForm] = useState({
    api_key: settings?.green_invoice_api_key || '',
    api_secret: settings?.green_invoice_api_secret || '',
  })

  // EasyCount form
  const [ecForm, setEcForm] = useState({
    api_key: settings?.easycount_api_key || '',
    developer_email: settings?.easycount_developer_email || '',
    use_sandbox: settings?.easycount_use_sandbox ?? true,
  })

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      if (type === 'greeninvoice') {
        const response = await fetch('/api/green-invoice/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: giForm.api_key,
            apiSecret: giForm.api_secret,
          }),
        })
        const data = await response.json()

        if (response.ok && data.success) {
          setTestResult({ success: true, message: 'החיבור הצליח!' })
          await handleSave(true)
          // Collapse after successful connection
          setTimeout(() => setExpanded(false), 1500)
        } else {
          setTestResult({ success: false, message: data.error || 'החיבור נכשל' })
        }
      } else {
        const response = await fetch('/api/easycount/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: ecForm.api_key,
            developerEmail: ecForm.developer_email,
            useSandbox: ecForm.use_sandbox,
          }),
        })
        const data = await response.json()

        if (response.ok && data.success) {
          setTestResult({ success: true, message: 'החיבור הצליח!' })
          await handleSave(true)
          // Collapse after successful connection
          setTimeout(() => setExpanded(false), 1500)
        } else {
          setTestResult({ success: false, message: data.error || 'החיבור נכשל' })
        }
      }
    } catch (error) {
      setTestResult({ success: false, message: 'שגיאה בבדיקת החיבור' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (isConnected = false) => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      let data: Record<string, unknown> = { user_id: user.id }
      
      if (type === 'greeninvoice') {
        data = {
          ...data,
          green_invoice_api_key: giForm.api_key || null,
          green_invoice_api_secret: giForm.api_secret || null,
          green_invoice_connected: isConnected,
        }
      } else {
        data = {
          ...data,
          easycount_api_key: ecForm.api_key || null,
          easycount_developer_email: ecForm.developer_email || null,
          easycount_use_sandbox: ecForm.use_sandbox,
          easycount_connected: isConnected,
        }
      }

      if (settings?.id) {
        await supabase.from('user_settings').update(data).eq('id', settings.id)
        onUpdate({ ...settings, ...data } as Settings)
      } else {
        const { data: newSettings } = await supabase.from('user_settings').insert(data).select().single()
        if (newSettings) onUpdate(newSettings)
      }

      toast.success('הפרטים נשמרו!')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      let data: Record<string, unknown> = {}
      
      if (type === 'greeninvoice') {
        data = {
          green_invoice_api_key: null,
          green_invoice_api_secret: null,
          green_invoice_connected: false,
        }
        setGiForm({ api_key: '', api_secret: '' })
      } else {
        data = {
          easycount_api_key: null,
          easycount_developer_email: null,
          easycount_connected: false,
        }
        setEcForm({ api_key: '', developer_email: '', use_sandbox: true })
      }

      if (settings?.id) {
        await supabase.from('user_settings').update(data).eq('id', settings.id)
        onUpdate({ ...settings, ...data } as Settings)
      }

      setTestResult(null)
      toast.success('החיבור נותק')
    } catch (error) {
      toast.error('שגיאה בניתוק')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e9eef4',
      overflow: 'hidden',
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      {/* Header */}
      <button
        onClick={() => !disabled && setExpanded(!expanded)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '20px 24px',
          border: 'none',
          background: 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'right',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: connected ? '#ecfdf5' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            {logo}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {disabled ? (
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#f1f5f9',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              לא זמין
            </span>
          ) : connected ? (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#ecfdf5',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              <Check size={14} />
              מחובר
            </span>
          ) : (
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#fef2f2',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              לא מחובר
            </span>
          )}
          {!disabled && (expanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />)}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div style={{
          padding: '0 24px 24px 24px',
          borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ paddingTop: '20px' }}>
            {type === 'greeninvoice' ? (
              <>
                {/* Instructions */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0369a1', marginBottom: '10px' }}>
                    📋 איך להשיג את פרטי ה-API?
                  </div>
                  <ol style={{ 
                    fontSize: '13px', 
                    color: '#0c4a6e', 
                    margin: 0, 
                    paddingRight: '20px',
                    lineHeight: 1.8,
                  }}>
                    <li>התחבר לחשבון שלך ב<a href="https://app.greeninvoice.co.il" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9' }}>חשבונית ירוקה</a></li>
                    <li>לחץ על <strong>הגדרות</strong> (סמל גלגל השיניים)</li>
                    <li>בחר <strong>API ואינטגרציות</strong></li>
                    <li>לחץ על <strong>צור מפתח חדש</strong></li>
                    <li>העתק את ה-<strong>API Key</strong> ואת ה-<strong>Secret</strong></li>
                  </ol>
                </div>

                <InputField
                  label="API Key"
                  value={giForm.api_key}
                  onChange={v => setGiForm({...giForm, api_key: v})}
                  placeholder="הכנס API Key"
                  dir="ltr"
                />
                <div style={{ marginTop: '16px' }}>
                  <InputField
                    label="API Secret"
                    value={giForm.api_secret}
                    onChange={v => setGiForm({...giForm, api_secret: v})}
                    placeholder="הכנס API Secret"
                    type="password"
                    dir="ltr"
                  />
                </div>
                <a
                  href="https://app.greeninvoice.co.il/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#0ea5e9',
                    fontSize: '13px',
                    marginTop: '12px',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  פתח הגדרות API בחשבונית ירוקה
                </a>
              </>
            ) : (
              <>
                {/* Instructions */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0369a1', marginBottom: '10px' }}>
                    📋 איך להשיג את פרטי ה-API?
                  </div>
                  <ol style={{ 
                    fontSize: '13px', 
                    color: '#0c4a6e', 
                    margin: 0, 
                    paddingRight: '20px',
                    lineHeight: 1.8,
                  }}>
                    <li>התחבר לחשבון שלך ב<a href="https://www.ezcount.co.il" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9' }}>איזיקאונט</a></li>
                    <li>לחץ על <strong>הגדרות</strong> בתפריט</li>
                    <li>בחר <strong>API</strong> או <strong>התממשקויות</strong></li>
                    <li>העתק את ה-<strong>API Key</strong> (מפתח API)</li>
                    <li>הזן את <strong>כתובת האימייל</strong> שבה נרשמת לאיזיקאונט</li>
                  </ol>
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '10px', 
                    background: '#fef3c7', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#92400e',
                  }}>
                    💡 <strong>טיפ:</strong> לבדיקות, השאר את אפשרות ה-Sandbox מסומנת. בטל את הסימון רק כשאתה מוכן לעבוד עם המערכת האמיתית.
                  </div>
                </div>

                <InputField
                  label="API Key"
                  value={ecForm.api_key}
                  onChange={v => setEcForm({...ecForm, api_key: v})}
                  placeholder="הכנס API Key"
                  dir="ltr"
                />
                <div style={{ marginTop: '16px' }}>
                  <InputField
                    label="אימייל מפתח (Developer Email)"
                    value={ecForm.developer_email}
                    onChange={v => setEcForm({...ecForm, developer_email: v})}
                    placeholder="developer@example.com"
                    dir="ltr"
                  />
                </div>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="sandbox"
                    checked={ecForm.use_sandbox}
                    onChange={e => setEcForm({...ecForm, use_sandbox: e.target.checked})}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="sandbox" style={{ fontSize: '14px', color: '#64748b' }}>
                    השתמש בסביבת בדיקות (Sandbox)
                  </label>
                </div>
                <a
                  href="https://www.ezcount.co.il/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#0ea5e9',
                    fontSize: '13px',
                    marginTop: '12px',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  מידע על API באיזיקאונט
                </a>
              </>
            )}

            {/* Test Result */}
            {testResult && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: testResult.success ? '#ecfdf5' : '#fef2f2',
                color: testResult.success ? '#10b981' : '#ef4444',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {testResult.success ? <Check size={18} /> : <X size={18} />}
                {testResult.message}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={handleTest}
                disabled={testing || saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0ea5e9',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: (testing || saving) ? 0.7 : 1,
                }}
              >
                {testing ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Check size={16} />
                )}
                {testing ? 'בודק...' : 'בדוק ושמור'}
              </button>

              {connected && (
                <button
                  onClick={handleDisconnect}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fff',
                    color: '#ef4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  נתק
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Input Field Component
function InputField({ label, value, onChange, placeholder = '', type = 'text', icon, dir = 'rtl' }: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  dir?: 'rtl' | 'ltr'
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            right: dir === 'rtl' ? '14px' : 'auto',
            left: dir === 'ltr' ? '14px' : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
          }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          style={{
            width: '100%',
            padding: '12px 14px',
            paddingRight: icon && dir === 'rtl' ? '44px' : '14px',
            paddingLeft: icon && dir === 'ltr' ? '44px' : '14px',
            borderRadius: '10px',
            border: '1px solid #e9eef4',
            fontSize: '14px',
            textAlign: dir === 'ltr' ? 'left' : 'right',
          }}
        />
      </div>
    </div>
  )
}

// Toggle Option Component
function ToggleOption({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: '10px',
    }}>
      <span style={{ fontSize: '14px', color: '#1e293b' }}>{label}</span>
      <button
        onClick={() => setChecked(!checked)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          background: checked ? '#0ea5e9' : '#e2e8f0',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '10px',
          background: '#fff',
          position: 'absolute',
          top: '2px',
          right: checked ? '2px' : '22px',
          transition: 'right 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }} />
      </button>
    </div>
  )
}