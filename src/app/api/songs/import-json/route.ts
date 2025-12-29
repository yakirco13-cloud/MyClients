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

// Create a unique key for deduplication
function getSongKey(title: string, artist: string | null): string {
  const normalizedTitle = (title || '').toLowerCase().trim()
  const normalizedArtist = (artist || '').toLowerCase().trim()
  return `${normalizedTitle}|||${normalizedArtist}`
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

    // Step 1: Dedupe incoming songs (keep first occurrence)
    const seenKeys = new Set<string>()
    const uniqueSongs: SongInput[] = []
    
    for (const song of songs) {
      const key = getSongKey(song.title, song.artist)
      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        uniqueSongs.push(song)
      }
    }

    // Step 2: Get all existing songs for this user (title + artist)
    const { data: existingSongs } = await supabase
      .from('songs')
      .select('title, artist')
      .eq('user_id', user.id)
    
    const existingKeys = new Set<string>()
    if (existingSongs) {
      for (const song of existingSongs) {
        existingKeys.add(getSongKey(song.title, song.artist))
      }
    }

    // Step 3: Filter out songs that already exist
    const newSongs = uniqueSongs.filter(song => {
      const key = getSongKey(song.title, song.artist)
      return !existingKeys.has(key)
    })

    const skipped = songs.length - newSongs.length

    if (newSongs.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped,
        message: `כל השירים כבר קיימים בספרייה (${skipped} כפילויות דולגו)`
      })
    }

    // Step 4: Insert new songs in batches
    const songsWithUser = newSongs.map(song => ({
      user_id: user.id,
      ...song,
    }))

    const BATCH_SIZE = 100
    let imported = 0
    
    for (let i = 0; i < songsWithUser.length; i += BATCH_SIZE) {
      const batch = songsWithUser.slice(i, i + BATCH_SIZE)
      
      const { error } = await supabase
        .from('songs')
        .insert(batch)
      
      if (error) {
        console.error('Batch insert error:', error)
        // Try one by one for this batch
        for (const song of batch) {
          const { error: singleError } = await supabase
            .from('songs')
            .insert(song)
          
          if (!singleError) {
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