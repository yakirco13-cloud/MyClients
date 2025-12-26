import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClientDetailContent from './client-detail-content'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) {
    notFound()
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', id)
    .order('payment_date', { ascending: false })

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return (
    <ClientDetailContent 
      client={client} 
      payments={payments || []} 
      invoices={invoices || []} 
    />
  )
}