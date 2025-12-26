import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingContent from './meeting-content'

export default async function MeetingPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) redirect('/dashboard/clients')

  // Get all songs (including rekordbox_id and location for export)
  const { data: songs } = await supabase
    .from('songs')
    .select('id, title, artist, album, bpm, key, duration, genre, rekordbox_id, location')
    .eq('user_id', user.id)
    .order('title')

  // Get selected songs for this client
  const { data: playlist } = await supabase
    .from('client_playlists')
    .select('song_id')
    .eq('client_id', id)

  const selectedSongIds = playlist?.map(p => p.song_id) || []

  return (
    <MeetingContent 
      client={client} 
      songs={songs || []} 
      selectedSongIds={selectedSongIds}
    />
  )
}