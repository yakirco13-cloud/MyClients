import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientsContent from './clients-content'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Data fetching is now done client-side with caching
  return <ClientsContent />
}