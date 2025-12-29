import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SongInput = {
  title: string
  artist: string | null
  album: string | null
  bpm: number | null
  key: string | null
  duration: string | null
  genre: string | null
  rating: number | null
  date_added: string | null
  rekordbox_id: string | null
  location: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { songs } = await request.json() as { songs: SongInput[] }
    
    if (!songs || songs.length === 0) {
      return NextResponse.json({ error: 'No songs provided' }, { status: 400 })
    }

    // Add user_id to all songs - NO deduplication, just insert everything
    const songsWithUser = songs.map(song => ({
      user_id: user.id,
      ...song,
    }))

    // Insert in batches
    const BATCH_SIZE = 100
    let imported = 0
    let errors = 0
    
    for (let i = 0; i < songsWithUser.length; i += BATCH_SIZE) {
      const batch = songsWithUser.slice(i, i + BATCH_SIZE)
      
      const { error } = await supabase
        .from('songs')
        .insert(batch)
      
      if (error) {
        console.error('Batch insert error:', error)
        // Try one by one
        for (const song of batch) {
          const { error: singleError } = await supabase
            .from('songs')
            .insert(song)
          
          if (singleError) {
            errors++
          } else {
            imported++
          }
        }
      } else {
        imported += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      message: `${imported} שירים יובאו!${errors > 0 ? ` (${errors} שגיאות)` : ''}`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'שגיאה בייבוא' },
      { status: 500 }
    )
  }
}