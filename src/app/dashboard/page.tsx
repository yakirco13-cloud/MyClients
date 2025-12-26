import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const { data: upcomingEvents } = await supabase
    .from('clients')
    .select('id, name, partner_name, event_date, venue_name')
    .eq('user_id', user.id)
    .gte('event_date', today)
    .lte('event_date', thirtyDaysLater)
    .order('event_date', { ascending: true })
    .limit(5)

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('user_id', user.id)
    .gte('payment_date', startOfMonth)
    .lte('payment_date', endOfMonth)

  const monthRevenue = monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const { count: pendingInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  return (
    <DashboardContent 
      totalClients={totalClients || 0}
      activeClients={activeClients || 0}
      upcomingEvents={upcomingEvents || []}
      monthRevenue={monthRevenue}
      pendingInvoices={pendingInvoices || 0}
    />
  )
}