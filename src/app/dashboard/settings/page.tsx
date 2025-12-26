import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsContent from './settings-content'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return <SettingsContent user={user} settings={settings} />
}