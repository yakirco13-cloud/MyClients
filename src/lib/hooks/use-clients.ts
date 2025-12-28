'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Client = {
  id: string
  user_id: string
  name: string
  partner_name?: string
  phone?: string
  email?: string
  event_date?: string
  venue_name?: string
  status: string
  total_amount?: number
  amount_paid?: number
  created_at: string
}

// Fetch all clients
async function fetchClients(): Promise<Client[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Fetch single client
async function fetchClient(id: string): Promise<Client | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Hook to get all clients
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  })
}

// Hook to get single client
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
  })
}

// Hook to add client
export function useAddClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (newClient: Partial<Client>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newClient) => {
      // Add to cache immediately
      queryClient.setQueryData(['clients'], (old: Client[] | undefined) => {
        return old ? [newClient, ...old] : [newClient]
      })
    },
  })
}

// Hook to update client
export function useUpdateClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedClient) => {
      // Update in cache
      queryClient.setQueryData(['clients'], (old: Client[] | undefined) => {
        return old?.map(c => c.id === updatedClient.id ? updatedClient : c)
      })
      queryClient.setQueryData(['clients', updatedClient.id], updatedClient)
    },
  })
}

// Hook to delete client
export function useDeleteClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueryData(['clients'], (old: Client[] | undefined) => {
        return old?.filter(c => c.id !== deletedId)
      })
      queryClient.removeQueries({ queryKey: ['clients', deletedId] })
    },
  })
}
