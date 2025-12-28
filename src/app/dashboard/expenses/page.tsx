import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpensesContent from './expenses-content'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Data fetching is now done client-side with caching
  return <ExpensesContent />
}