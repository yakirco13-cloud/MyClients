'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Expense = {
  id: string
  user_id: string
  vendor_name: string
  amount: number
  vat_amount?: number
  expense_date: string
  category?: string
  description?: string
  receipt_url?: string
  synced_at?: string
  created_at: string
}

export type ExpensesData = {
  expenses: Expense[]
  monthTotal: number
}

async function fetchExpenses(): Promise<ExpensesData> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const [expensesRes, monthExpensesRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false }),
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('expense_date', startOfMonth)
      .lte('expense_date', endOfMonth),
  ])

  const expenses = expensesRes.data || []
  const monthTotal = monthExpensesRes.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

  return {
    expenses,
    monthTotal,
  }
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  })
}

export function useAddExpense() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (newExpense: Partial<Expense>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...newExpense, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useSyncExpense() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (expense: Expense) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      let response

      if (settings?.easycount_connected && settings.easycount_api_key) {
        response = await fetch('/api/easycount/expense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expenseId: expense.id,
            vendorName: expense.vendor_name,
            amount: expense.amount,
            vatAmount: expense.vat_amount,
            expenseDate: expense.expense_date,
            description: expense.description,
            apiKey: settings.easycount_api_key,
            developerEmail: settings.easycount_developer_email,
            useSandbox: settings.easycount_use_sandbox,
          }),
        })
      } else if (settings?.green_invoice_connected && settings.green_invoice_api_key) {
        response = await fetch('/api/green-invoice/expense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expenseId: expense.id,
            vendor_name: expense.vendor_name,
            amount: expense.amount,
            vat_amount: expense.vat_amount,
            expense_date: expense.expense_date,
            description: expense.description,
          }),
        })
      } else {
        throw new Error('אין מערכת חשבוניות מחוברת')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      return expense.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
