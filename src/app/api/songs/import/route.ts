import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Allow large file uploads (up to 50MB) and longer timeout
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
}

// Increase timeout for Vercel
export const maxDuration = 60 // seconds

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
  }
  
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char)
  }
  
  // Replace numeric entities
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  return result
}

// Sanitize text
function sanitizeText(text: string | null | undefined): string | null {
  if (!text) return null
  let clean = decodeHtmlEntities(text)
  clean = clean.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  clean = clean.normalize('NFC').trim()
  return clean || null
}

// Format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    logs.push(msg)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    log('Starting XML import...')

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    log(`File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

    // Read file
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Remove UTF-8 BOM if present
    let startIndex = 0
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      startIndex = 3
      log('Removed UTF-8 BOM')
    }
    
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(bytes.slice(startIndex)).normalize('NFC')
    
    log(`Text length: ${text.length} characters`)

    // Parse ALL tracks with regex (handle multi-line TRACK elements)
    const trackRegex = /<TRACK\s+([\s\S]*?)(?:\/>|>[\s\S]*?<\/TRACK>)/g
    let match
    
    type ParsedSong = {
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
    
    const allSongs: ParsedSong[] = []
    let trackCount = 0
    let skippedNoName = 0
    let skippedShortWav = 0
    
    while ((match = trackRegex.exec(text)) !== null) {
      trackCount++
      // Normalize whitespace (collapse newlines/spaces into single space)
      const attrs = match[1].replace(/\s+/g, ' ')
      
      const getAttr = (attr: string): string | null => {
        const m = attrs.match(new RegExp(`${attr}="([^"]*)"`, 'i'))
        return m ? m[1] : null
      }
      
      const title = sanitizeText(getAttr('Name'))
      if (!title) {
        skippedNoName++
        continue
      }
      
      const kind = getAttr('Kind') || ''
      const totalTime = parseInt(getAttr('TotalTime') || '0')
      if (kind === 'WAV File' && totalTime < 30) {
        skippedShortWav++
        continue
      }
      
      let location = getAttr('Location')
      if (location) {
        try {
          location = decodeURIComponent(location).replace(/^file:\/\/localhost\//, '')
        } catch (e) {
          // Keep as-is
        }
      }
      
      // Debug: log first track's location
      if (trackCount === 1) {
        log(`First track location raw: ${getAttr('Location')}`)
        log(`First track location processed: ${location}`)
      }
      
      const bpmStr = getAttr('AverageBpm')
      const ratingStr = getAttr('Rating')
      
      allSongs.push({
        title,
        artist: sanitizeText(getAttr('Artist')),
        album: sanitizeText(getAttr('Album')),
        bpm: bpmStr ? parseFloat(bpmStr) : null,
        key: sanitizeText(getAttr('Tonality')),
        duration: totalTime > 0 ? formatDuration(totalTime) : null,
        genre: sanitizeText(getAttr('Genre')),
        rating: ratingStr ? parseInt(ratingStr) : null,
        date_added: getAttr('DateAdded'),
        rekordbox_id: getAttr('TrackID'),
        location,
      })
    }

    const songsWithLocation = allSongs.filter(s => s.location).length
    log(`Parsed: ${trackCount} tracks, ${skippedNoName} no name, ${skippedShortWav} short WAV`)
    log(`Songs to insert: ${allSongs.length}, with location: ${songsWithLocation}`)

    if (allSongs.length === 0) {
      return NextResponse.json({ 
        error: 'No valid songs found in file',
        logs 
      }, { status: 400 })
    }

    // Insert ALL songs in batches of 500
    const BATCH_SIZE = 500
    let inserted = 0
    let errors = 0
    const errorDetails: string[] = []

    for (let i = 0; i < allSongs.length; i += BATCH_SIZE) {
      const batch = allSongs.slice(i, i + BATCH_SIZE).map(song => ({
        user_id: user.id,
        ...song,
      }))
      
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(allSongs.length / BATCH_SIZE)
      log(`Inserting batch ${batchNum}/${totalBatches} (${batch.length} songs)...`)
      
      const { data, error } = await supabase
        .from('songs')
        .insert(batch)
        .select('id')
      
      if (error) {
        log(`Batch ${batchNum} error: ${error.message}`)
        // Try one by one
        for (const song of batch) {
          const { error: singleError } = await supabase
            .from('songs')
            .insert(song)
          
          if (singleError) {
            errors++
            if (errorDetails.length < 10) {
              errorDetails.push(`${song.title}: ${singleError.message}`)
            }
          } else {
            inserted++
          }
        }
      } else {
        inserted += batch.length
        log(`Batch ${batchNum} success: ${batch.length} inserted`)
      }
    }

    log(`DONE: ${inserted} inserted, ${errors} errors`)

    return NextResponse.json({
      success: true,
      total_tracks: trackCount,
      parsed: allSongs.length,
      inserted,
      errors,
      errorDetails: errorDetails.slice(0, 10),
      logs,
      message: `${inserted} שירים יובאו!${errors > 0 ? ` (${errors} שגיאות)` : ''}`
    })

  } catch (error) {
    log(`FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'שגיאה בייבוא',
      logs
    }, { status: 500 })
  }
}
