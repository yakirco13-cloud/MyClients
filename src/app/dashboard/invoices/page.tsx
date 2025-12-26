import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoicesContent from './invoices-content'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(name, partner_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get this month's total
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const { data: monthInvoices } = await supabase
    .from('invoices')
    .select('amount')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth)

  const monthTotal = monthInvoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0

  // Get total paid
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('amount')
    .eq('user_id', user.id)
    .eq('status', 'paid')

  const totalPaid = paidInvoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0

  return <InvoicesContent invoices={invoices || []} monthTotal={monthTotal} totalPaid={totalPaid} />
}