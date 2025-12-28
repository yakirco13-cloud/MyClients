'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Invoice = {
  id: string
  user_id: string
  client_id?: string
  invoice_number?: string
  amount: number
  status: string
  description?: string
  green_invoice_id?: string
  green_invoice_url?: string
  created_at: string
  clients?: {
    name: string
    partner_name?: string
  }
}

export type InvoicesData = {
  invoices: Invoice[]
  monthTotal: number
  totalPaid: number
}

async function fetchInvoices(): Promise<InvoicesData> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const [invoicesRes, monthInvoicesRes] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          partner_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('amount, status')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),
  ])

  const invoices = invoicesRes.data || []
  const monthInvoices = monthInvoicesRes.data || []

  const monthTotal = monthInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  return {
    invoices,
    monthTotal,
    totalPaid,
  }
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
