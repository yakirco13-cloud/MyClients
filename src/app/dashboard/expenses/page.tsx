import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpensesContent from './expenses-content'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false })

  // Get this month's total
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', user.id)
    .gte('expense_date', startOfMonth)

  const monthTotal = monthExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

  return <ExpensesContent expenses={expenses || []} monthTotal={monthTotal} />
}