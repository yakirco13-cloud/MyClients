import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SongsContent from './songs-content'

export default async function SongsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get songs
  const { data: songs, count } = await supabase
    .from('songs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('title')
    .limit(500)

  return (
    <SongsContent 
      songs={songs || []} 
      totalCount={count || 0}
    />
  )
}