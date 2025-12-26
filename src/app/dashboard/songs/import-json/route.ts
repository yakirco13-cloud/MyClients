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

    // Insert songs one by one to handle duplicates gracefully
    let imported = 0
    let skipped = 0
    
    for (const song of songs) {
      const { error } = await supabase
        .from('songs')
        .insert({
          user_id: user.id,
          ...song,
        })
      
      if (error) {
        if (error.code === '23505') {
          skipped++
        } else {
          console.error('Error inserting song:', error, song)
        }
      } else {
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      message: `${imported} שירים יובאו בהצלחה!${skipped > 0 ? ` (${skipped} כפילויות דולגו)` : ''}`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'שגיאה בייבוא' },
      { status: 500 }
    )
  }
}