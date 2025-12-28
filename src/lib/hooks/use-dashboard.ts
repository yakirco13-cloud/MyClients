'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type DashboardData = {
  totalClients: number
  activeClients: number
  upcomingEvents: {
    id: string
    name: string
    partner_name?: string
    event_date: string
    venue_name?: string
  }[]
  monthRevenue: number
  pendingInvoices: number
}

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // Fetch all in parallel for speed
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    totalClientsRes,
    activeClientsRes,
    upcomingEventsRes,
    monthPaymentsRes,
    pendingInvoicesRes,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('clients')
      .select('id, name, partner_name, event_date, venue_name')
      .eq('user_id', user.id)
      .gte('event_date', today)
      .lte('event_date', thirtyDaysLater)
      .order('event_date', { ascending: true })
      .limit(5),
    supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)
      .gte('payment_date', startOfMonth)
      .lte('payment_date', endOfMonth),
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending'),
  ])

  const monthRevenue = monthPaymentsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  return {
    totalClients: totalClientsRes.count || 0,
    activeClients: activeClientsRes.count || 0,
    upcomingEvents: upcomingEventsRes.data || [],
    monthRevenue,
    pendingInvoices: pendingInvoicesRes.count || 0,
  }
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    // Dashboard data can be slightly stale
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
