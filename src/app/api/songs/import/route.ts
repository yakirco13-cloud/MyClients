import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  
  // Replace named entities
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char)
  }
  
  // Replace numeric entities (&#1234; or &#x1234;)
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  return result
}

// Sanitize and normalize text for Hebrew support
function sanitizeText(text: string | null | undefined): string | null {
  if (!text) return null
  
  // Decode HTML entities first
  let clean = decodeHtmlEntities(text)
  
  // Remove null bytes and control characters
  clean = clean.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  
  // Normalize Unicode (important for Hebrew)
  clean = clean.normalize('NFC')
  
  // Trim and return null if empty
  clean = clean.trim()
  return clean || null
}

// Format seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Parse XML format (Rekordbox export)
function parseXML(text: string): Array<{
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
}> {
  const songs: Array<{
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
  }> = []
  
  // Simple regex-based XML parsing for TRACK elements
  const trackRegex = /<TRACK\s+([^>]+)>/g
  let match
  
  while ((match = trackRegex.exec(text)) !== null) {
    const attrs = match[1]
    
    // Extract attributes
    const getName = (attr: string) => {
      const m = attrs.match(new RegExp(`${attr}="([^"]*)"`, 'i'))
      return m ? m[1] : null
    }
    
    const title = sanitizeText(getName('Name'))
    if (!title) continue
    
    // Skip sample/sound effect files (usually short WAV files)
    const kind = getName('Kind') || ''
    const totalTime = parseInt(getName('TotalTime') || '0')
    if (kind === 'WAV File' && totalTime < 30) continue // Skip short WAV samples
    
    const artist = sanitizeText(getName('Artist'))
    const album = sanitizeText(getName('Album'))
    const bpmStr = getName('AverageBpm')
    const bpm = bpmStr ? parseFloat(bpmStr) : null
    const key = sanitizeText(getName('Tonality'))
    const duration = totalTime > 0 ? formatDuration(totalTime) : null
    const genre = sanitizeText(getName('Genre'))
    const ratingStr = getName('Rating')
    const rating = ratingStr ? parseInt(ratingStr) : null
    const dateAdded = getName('DateAdded')
    const trackId = getName('TrackID')
    
    // Get file location and decode URL encoding
    let location = getName('Location')
    if (location) {
      // Decode URL encoding (e.g., %20 -> space)
      try {
        location = decodeURIComponent(location)
        // Remove file://localhost/ prefix
        location = location.replace(/^file:\/\/localhost\//, '')
      } catch (e) {
        // Keep as-is if decoding fails
      }
    }
    
    songs.push({
      title,
      artist,
      album,
      bpm: bpm && bpm > 0 ? bpm : null,
      key,
      duration,
      genre,
      rating: rating && rating > 0 ? rating : null,
      date_added: dateAdded,
      rekordbox_id: trackId,
      location: location,
    })
  }
  
  return songs
}

// Parse TXT format (tab-separated)
function parseTXT(text: string): Array<{
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
}> {
  const songs: Array<{
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
  }> = []
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) return songs
  
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split('\t')
    
    // Rekordbox TXT format:
    // 0: # | 1: Artwork | 2: Track Title | 3: Artist | 4: Album | 5: BPM | 6: Key | 7: Time | 8: Genre | 9: Rating | 10: Date Added
    
    const title = sanitizeText(columns[2])
    if (!title) continue
    
    const artist = sanitizeText(columns[3])
    const album = sanitizeText(columns[4])
    const bpmStr = columns[5]?.trim()
    const bpm = bpmStr ? parseFloat(bpmStr) : null
    const key = sanitizeText(columns[6])
    const duration = sanitizeText(columns[7])
    const genre = sanitizeText(columns[8])
    const ratingStr = columns[9]?.trim()
    const rating = ratingStr ? parseInt(ratingStr) : null
    const dateAddedStr = columns[10]?.trim()
    
    let dateAdded = null
    if (dateAddedStr && dateAddedStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateAdded = dateAddedStr
    }

    songs.push({
      title,
      artist,
      album,
      bpm: isNaN(bpm as number) ? null : bpm,
      key,
      duration,
      genre,
      rating: isNaN(rating as number) ? null : rating,
      date_added: dateAdded,
      rekordbox_id: null,
      location: null,
    })
  }
  
  return songs
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file as ArrayBuffer first to handle encoding properly
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Remove UTF-8 BOM if present
    let startIndex = 0
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      startIndex = 3
    }
    
    // Decode as UTF-8
    const decoder = new TextDecoder('utf-8')
    let text = decoder.decode(bytes.slice(startIndex))
    
    // Normalize the text for consistent Hebrew handling
    text = text.normalize('NFC')
    
    const fileName = file.name.toLowerCase()
    
    // Detect format and parse
    let parsedSongs
    if (fileName.endsWith('.xml') || text.trim().startsWith('<?xml')) {
      parsedSongs = parseXML(text)
    } else {
      parsedSongs = parseTXT(text)
    }

    if (parsedSongs.length === 0) {
      return NextResponse.json({ error: 'No valid songs found in file' }, { status: 400 })
    }

    // Insert songs one by one to handle duplicates gracefully
    let imported = 0
    let skipped = 0
    
    for (const song of parsedSongs) {
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
