'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Music, Upload, Search, Trash2, Loader2, 
  FileText, Check, X, Download, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Song = {
  id: string
  title: string
  artist: string | null
  album: string | null
  bpm: number | null
  key: string | null
  duration: string | null
  genre: string | null
  date_added: string | null
}

type Props = {
  songs: Song[]
  totalCount: number
}

export default function SongsContent({ songs: initialSongs, totalCount: initialCount }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [songs, setSongs] = useState(initialSongs)
  const [totalCount, setTotalCount] = useState(initialCount)
  const [searchQuery, setSearchQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [artistFilter, setArtistFilter] = useState<string>('all')
  const [artists, setArtists] = useState<string[]>([])

  // Load unique artists on mount
  useEffect(() => {
    const loadArtists = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('songs')
        .select('artist')
        .not('artist', 'is', null)
        .not('artist', 'eq', '')
      
      if (data) {
        const uniqueArtists = [...new Set(data.map(s => s.artist).filter(Boolean))] as string[]
        uniqueArtists.sort((a, b) => a.localeCompare(b, 'he'))
        setArtists(uniqueArtists)
      }
    }
    loadArtists()
  }, [])

  // Get popularity counts (how many times each song was picked)
  const [popularityCounts, setPopularityCounts] = useState<Map<string, number>>(new Map())
  
  useEffect(() => {
    const loadPopularity = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('client_playlists')
        .select('song_id')
      
      if (data) {
        const counts = new Map<string, number>()
        for (const row of data) {
          counts.set(row.song_id, (counts.get(row.song_id) || 0) + 1)
        }
        setPopularityCounts(counts)
      }
    }
    loadPopularity()
  }, [])

  // Search database when query or artist filter changes
  const searchDatabase = async (query: string, artist: string = artistFilter) => {
    setSearching(true)
    try {
      const supabase = createClient()
      
      let queryBuilder = supabase
        .from('songs')
        .select('*', { count: 'exact' })
      
      // Apply artist filter
      if (artist !== 'all') {
        queryBuilder = queryBuilder.eq('artist', artist)
      }
      
      // Apply search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      }
      
      const { data, count } = await queryBuilder
        .order('title')
        .limit(500)
      
      if (data) {
        // Sort by popularity (most picked first)
        const sortedData = [...data].sort((a, b) => {
          const countA = popularityCounts.get(a.id) || 0
          const countB = popularityCounts.get(b.id) || 0
          if (countB !== countA) return countB - countA
          return a.title.localeCompare(b.title, 'he')
        })
        setSongs(sortedData)
        setTotalCount(count || data.length)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  // Debounced search - wait 300ms after typing stops
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchDatabase(value)
    }, 300)
  }

  // Handle artist filter change
  const handleArtistChange = (artist: string) => {
    setArtistFilter(artist)
    searchDatabase(searchQuery, artist)
  }

  // Use songs directly (no local filtering needed)
  const filteredSongs = songs

  // Parse XML in browser WITH deduplication
  const parseXMLInBrowser = (text: string) => {
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const tracks = xml.querySelectorAll('TRACK')
    
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
    
    // Use Map to deduplicate by TITLE ONLY
    const songMap = new Map<string, ParsedSong>()

    tracks.forEach(track => {
      const title = track.getAttribute('Name')?.trim()
      if (!title) return

      // Skip short WAV samples (sound effects)
      const kind = track.getAttribute('Kind') || ''
      const totalTime = parseInt(track.getAttribute('TotalTime') || '0')
      if (kind === 'WAV File' && totalTime < 30) return

      // Dedupe by TITLE ONLY (lowercase)
      const dedupeKey = title.toLowerCase()
      
      // Skip if we already have this title
      if (songMap.has(dedupeKey)) return

      const artist = track.getAttribute('Artist')?.trim() || null
      const bpmStr = track.getAttribute('AverageBpm')
      const bpm = bpmStr ? parseFloat(bpmStr) : null
      const ratingStr = track.getAttribute('Rating')
      const rating = ratingStr ? parseInt(ratingStr) : null

      // Get and decode location
      let location = track.getAttribute('Location') || null
      if (location) {
        try {
          location = decodeURIComponent(location).replace(/^file:\/\/localhost\//, '')
        } catch (e) {
          // Keep as-is
        }
      }

      // Format duration
      const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60)
        const s = secs % 60
        return `${mins}:${s.toString().padStart(2, '0')}`
      }

      songMap.set(dedupeKey, {
        title,
        artist,
        album: track.getAttribute('Album')?.trim() || null,
        bpm: bpm && bpm > 0 ? bpm : null,
        key: track.getAttribute('Tonality')?.trim() || null,
        duration: totalTime > 0 ? formatDuration(totalTime) : null,
        genre: track.getAttribute('Genre')?.trim() || null,
        rating: rating && rating > 0 ? rating : null,
        date_added: track.getAttribute('DateAdded') || null,
        rekordbox_id: track.getAttribute('TrackID') || null,
        location,
      })
    })

    return Array.from(songMap.values())
  }

  const [importProgress, setImportProgress] = useState<string | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportProgress('קורא קובץ...')
    
    try {
      const text = await file.text()
      console.log(`File size: ${(text.length / 1024 / 1024).toFixed(2)} MB`)
      
      setImportProgress('מנתח שירים...')
      const parsedSongs = parseXMLInBrowser(text)
      const songsWithLocation = parsedSongs.filter(s => s.location).length
      console.log(`Parsed ${parsedSongs.length} songs from XML, ${songsWithLocation} with location`)
      if (parsedSongs.length > 0) {
        console.log('First song:', JSON.stringify(parsedSongs[0]))
      }
      
      if (parsedSongs.length === 0) {
        throw new Error('לא נמצאו שירים בקובץ')
      }

      // Send chunks in PARALLEL (10 at a time)
      const CHUNK_SIZE = 100
      const PARALLEL_REQUESTS = 10
      let totalImported = 0
      let totalErrors = 0
      
      const chunks: typeof parsedSongs[] = []
      for (let i = 0; i < parsedSongs.length; i += CHUNK_SIZE) {
        chunks.push(parsedSongs.slice(i, i + CHUNK_SIZE))
      }
      
      console.log(`Sending ${chunks.length} chunks in parallel batches of ${PARALLEL_REQUESTS}`)
      
      for (let i = 0; i < chunks.length; i += PARALLEL_REQUESTS) {
        const batch = chunks.slice(i, i + PARALLEL_REQUESTS)
        const batchNum = Math.floor(i / PARALLEL_REQUESTS) + 1
        const totalBatches = Math.ceil(chunks.length / PARALLEL_REQUESTS)
        
        setImportProgress(`מייבא ${batchNum}/${totalBatches} (${Math.min((i + PARALLEL_REQUESTS) * CHUNK_SIZE, parsedSongs.length)}/${parsedSongs.length})...`)
        
        const results = await Promise.all(
          batch.map(async (chunk) => {
            try {
              const response = await fetch('/api/songs/import-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs: chunk }),
              })
              const result = await response.json()
              return { imported: result.imported || 0, errors: result.errors || 0 }
            } catch (e) {
              return { imported: 0, errors: chunk.length }
            }
          })
        )
        
        for (const r of results) {
          totalImported += r.imported
          totalErrors += r.errors
        }
        
        console.log(`Batch ${batchNum}/${totalBatches}: +${results.reduce((a, r) => a + r.imported, 0)} songs`)
      }

      console.log(`DONE: ${totalImported} imported, ${totalErrors} errors`)

      // Show result
      if (totalErrors > 0) {
        toast.error(`יובאו ${totalImported} שירים (${totalErrors} שגיאות)`)
      } else {
        toast.success(`${totalImported} שירים יובאו בהצלחה!`)
      }

      router.refresh()
      
      // Reload songs with count (with pagination)
      const supabase = createClient()
      const { count } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
      
      const { data } = await supabase
        .from('songs')
        .select('*')
        .order('title')
        .limit(500)
      
      if (data) {
        setSongs(data)
        setTotalCount(count || data.length)
      }
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'שגיאה בייבוא')
    } finally {
      setImporting(false)
      setImportProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את השיר?')) return
    
    setDeleting(id)
    try {
      const supabase = createClient()
      await supabase.from('songs').delete().eq('id', id)
      setSongs(songs.filter(s => s.id !== id))
      setTotalCount(prev => prev - 1)
      toast.success('השיר נמחק')
    } catch (error) {
      toast.error('שגיאה במחיקה')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('למחוק את כל השירים? פעולה זו לא ניתנת לביטול!')) return
    
    setImporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('songs').delete().eq('user_id', user.id)
      setSongs([])
      setTotalCount(0)
      toast.success('כל השירים נמחקו')
    } catch (error) {
      toast.error('שגיאה במחיקה')
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteDuplicates = async () => {
    if (!confirm('למחוק שירים כפולים? יישמר רק העותק הראשון של כל שיר.')) return
    
    setImporting(true)
    setImportProgress('מחפש כפילויות...')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get ALL songs with pagination
      const allSongs: Array<{ id: string; title: string; artist: string | null; created_at: string }> = []
      let page = 0
      const PAGE_SIZE = 1000
      
      while (true) {
        const { data: pageSongs } = await supabase
          .from('songs')
          .select('id, title, artist, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        
        if (!pageSongs || pageSongs.length === 0) break
        allSongs.push(...pageSongs)
        if (pageSongs.length < PAGE_SIZE) break
        page++
      }

      if (allSongs.length === 0) {
        toast.info('אין שירים בספרייה')
        return
      }

      // Find duplicates (keep first occurrence)
      const seen = new Map<string, string>() // key -> first id
      const duplicateIds: string[] = []

      for (const song of allSongs) {
        const key = `${(song.title || '').toLowerCase().trim()}|||${(song.artist || '').toLowerCase().trim()}`
        
        if (seen.has(key)) {
          duplicateIds.push(song.id)
        } else {
          seen.set(key, song.id)
        }
      }

      if (duplicateIds.length === 0) {
        toast.success('לא נמצאו שירים כפולים!')
        return
      }

      setImportProgress(`מוחק ${duplicateIds.length} כפילויות...`)

      // Delete duplicates in batches
      const BATCH_SIZE = 100
      for (let i = 0; i < duplicateIds.length; i += BATCH_SIZE) {
        const batch = duplicateIds.slice(i, i + BATCH_SIZE)
        await supabase
          .from('songs')
          .delete()
          .in('id', batch)
      }

      // Refresh songs list
      const { data: updatedSongs, count } = await supabase
        .from('songs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('title')

      if (updatedSongs) {
        setSongs(updatedSongs)
        setTotalCount(count || updatedSongs.length)
      }

      toast.success(`נמחקו ${duplicateIds.length} שירים כפולים!`)
      
    } catch (error) {
      console.error('Delete duplicates error:', error)
      toast.error('שגיאה במחיקת כפילויות')
    } finally {
      setImporting(false)
      setImportProgress(null)
    }
  }

  // Smart Duplicate Review
  type DuplicateGroup = {
    songs: Array<{ id: string; title: string; artist: string | null; created_at: string }>
    keepIds: Set<string>
  }
  
  const [showDuplicateReview, setShowDuplicateReview] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)

  // Clean title for comparison - remove noise
  const cleanTitle = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      // Remove common quality/source markers
      .replace(/\(?\d{2,3}\s*kbps\)?/gi, '')
      .replace(/mp3conv\.ru/gi, '')
      .replace(/yt1s\.com/gi, '')
      .replace(/\(\s*\)/g, '') // empty parentheses
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Extract core song identity (title without artist prefix)
  const extractCoreSong = (title: string, artist: string | null): string => {
    let core = cleanTitle(title)
    
    // If title starts with artist name, remove it
    if (artist) {
      const cleanArtist = artist.toLowerCase().trim()
      if (core.startsWith(cleanArtist + ' - ')) {
        core = core.substring(cleanArtist.length + 3)
      } else if (core.startsWith(cleanArtist + ' ')) {
        core = core.substring(cleanArtist.length + 1)
      }
    }
    
    // Remove leading dashes
    core = core.replace(/^[\s\-]+/, '').trim()
    
    return core
  }

  // Levenshtein distance
  const levenshtein = (a: string, b: string): number => {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length
    
    const matrix: number[][] = []
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[b.length][a.length]
  }

  // Check if two songs are likely duplicates
  const areDuplicates = (
    song1: { title: string; artist: string | null },
    song2: { title: string; artist: string | null }
  ): boolean => {
    const core1 = extractCoreSong(song1.title, song1.artist)
    const core2 = extractCoreSong(song2.title, song2.artist)
    
    // Exact match after cleaning
    if (core1 === core2 && core1.length > 3) return true
    
    // One contains the other (and significant overlap)
    if (core1.length > 5 && core2.length > 5) {
      if (core1.includes(core2) && core2.length / core1.length > 0.7) return true
      if (core2.includes(core1) && core1.length / core2.length > 0.7) return true
    }
    
    // Levenshtein similarity (very strict - 90%+)
    const maxLen = Math.max(core1.length, core2.length)
    if (maxLen > 5) {
      const distance = levenshtein(core1, core2)
      const similarity = 1 - (distance / maxLen)
      if (similarity >= 0.9) return true
    }
    
    return false
  }

  const handleReviewDuplicates = async () => {
    if (!confirm('לסרוק את הספרייה לשירים דומים? זה עלול לקחת מספר שניות.')) return

    setReviewLoading(true)
    setImportProgress('טוען שירים...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all songs
      const allSongs: Array<{ id: string; title: string; artist: string | null; created_at: string }> = []
      let page = 0
      const PAGE_SIZE = 1000

      while (true) {
        setImportProgress(`טוען שירים... (${allSongs.length})`)
        const { data: pageSongs } = await supabase
          .from('songs')
          .select('id, title, artist, created_at')
          .eq('user_id', user.id)
          .order('title')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        
        if (!pageSongs || pageSongs.length === 0) break
        allSongs.push(...pageSongs)
        if (pageSongs.length < PAGE_SIZE) break
        page++
      }

      if (allSongs.length === 0) {
        toast.info('אין שירים בספרייה')
        setReviewLoading(false)
        setImportProgress(null)
        return
      }

      setImportProgress(`מנתח ${allSongs.length} שירים...`)
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Pre-compute cleaned titles for all songs
      const songsWithClean = allSongs.map(song => ({
        ...song,
        cleanedTitle: extractCoreSong(song.title, song.artist)
      }))

      // Group by first 10 chars of cleaned title (optimization)
      const buckets = new Map<string, typeof songsWithClean>()
      for (const song of songsWithClean) {
        const key = song.cleanedTitle.substring(0, 10)
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key)!.push(song)
      }

      setImportProgress('מחפש כפילויות...')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Find duplicates within each bucket
      const groups: DuplicateGroup[] = []
      const processed = new Set<string>()
      let bucketsProcessed = 0
      const totalBuckets = buckets.size

      for (const [, bucket] of buckets) {
        bucketsProcessed++
        if (bucketsProcessed % 100 === 0) {
          setImportProgress(`מחפש כפילויות... (${Math.round(bucketsProcessed / totalBuckets * 100)}%)`)
          await new Promise(resolve => setTimeout(resolve, 0))
        }

        // Only check within bucket (songs with similar prefix)
        for (let i = 0; i < bucket.length; i++) {
          if (processed.has(bucket[i].id)) continue

          const similar: typeof allSongs = [bucket[i]]
          processed.add(bucket[i].id)

          for (let j = i + 1; j < bucket.length; j++) {
            if (processed.has(bucket[j].id)) continue

            // Quick check - if cleaned titles are very different length, skip
            if (Math.abs(bucket[i].cleanedTitle.length - bucket[j].cleanedTitle.length) > 5) continue

            if (areDuplicates(bucket[i], bucket[j])) {
              similar.push(bucket[j])
              processed.add(bucket[j].id)
            }
          }

          if (similar.length > 1) {
            const keepIds = new Set<string>([similar[0].id])
            groups.push({ songs: similar, keepIds })
          }
        }
      }

      setImportProgress(null)

      if (groups.length === 0) {
        toast.success('לא נמצאו שירים דומים!')
        setShowDuplicateReview(false)
      } else {
        setDuplicateGroups(groups)
        setShowDuplicateReview(true)
        toast.info(`נמצאו ${groups.length} קבוצות של שירים דומים`)
      }

    } catch (error) {
      console.error('Review duplicates error:', error)
      toast.error('שגיאה בסריקת כפילויות')
    } finally {
      setReviewLoading(false)
      setImportProgress(null)
    }
  }

  const toggleKeepSong = (groupIndex: number, songId: string) => {
    setDuplicateGroups(prev => {
      const newGroups = [...prev]
      const group = newGroups[groupIndex]
      const newKeepIds = new Set(group.keepIds)
      
      if (newKeepIds.has(songId)) {
        // Don't allow deselecting if it's the last one
        if (newKeepIds.size > 1) {
          newKeepIds.delete(songId)
        }
      } else {
        newKeepIds.add(songId)
      }
      
      newGroups[groupIndex] = { ...group, keepIds: newKeepIds }
      return newGroups
    })
  }

  const handleDeleteReviewedDuplicates = async () => {
    const toDelete: string[] = []
    
    for (const group of duplicateGroups) {
      for (const song of group.songs) {
        if (!group.keepIds.has(song.id)) {
          toDelete.push(song.id)
        }
      }
    }

    if (toDelete.length === 0) {
      toast.info('לא נבחרו שירים למחיקה')
      return
    }

    if (!confirm(`למחוק ${toDelete.length} שירים?`)) return

    setReviewLoading(true)
    setImportProgress(`מוחק ${toDelete.length} שירים...`)

    try {
      const supabase = createClient()
      
      // Delete in batches
      const BATCH_SIZE = 100
      for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE)
        await supabase.from('songs').delete().in('id', batch)
      }

      // Refresh
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, count } = await supabase
          .from('songs')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('title')
          .limit(500)
        
        if (data) {
          setSongs(data)
          setTotalCount(count || data.length)
        }
      }

      toast.success(`נמחקו ${toDelete.length} שירים!`)
      setShowDuplicateReview(false)
      setDuplicateGroups([])

    } catch (error) {
      console.error('Delete error:', error)
      toast.error('שגיאה במחיקה')
    } finally {
      setReviewLoading(false)
      setImportProgress(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            ספריית שירים
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            {totalCount} שירים בספרייה
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {songs.length > 0 && (
            <>
              <button
                onClick={handleReviewDuplicates}
                disabled={importing || reviewLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#fff',
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px',
                  color: '#7c3aed',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <Search size={16} />
                סקור כפילויות
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={importing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#fff',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={16} />
                מחק הכל
              </button>
            </>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#0ea5e9',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: importing ? 0.7 : 1,
            }}
          >
            {importing ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={18} />
            )}
            {importing ? (importProgress || 'מייבא...') : 'ייבא מ-Rekordbox'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.xml"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Instructions Card */}
      {songs.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Music size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
            ייבא את ספריית השירים שלך
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', maxWidth: '400px', marginInline: 'auto' }}>
            ייצא את הפלייליסט מ-Rekordbox כקובץ טקסט והעלה אותו כאן
          </p>
          
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'right',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
              איך לייצא מ-Rekordbox:
            </div>
            <ol style={{ 
              fontSize: '13px', 
              color: '#64748b', 
              margin: 0, 
              paddingRight: '20px',
              lineHeight: 1.8,
            }}>
              <li>פתח את Rekordbox</li>
              <li>בחר את הפלייליסט או כל השירים</li>
              <li>לחץ ימני → Export → Export to File</li>
              <li>שמור כקובץ .txt</li>
              <li>העלה את הקובץ כאן</li>
            </ol>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: '#0ea5e9',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '24px',
            }}
          >
            <Upload size={20} />
            בחר קובץ לייבוא
          </button>
        </div>
      )}

      {/* Duplicate Review Modal */}
      {showDuplicateReview && duplicateGroups.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid #c4b5fd',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              סקירת שירים דומים ({duplicateGroups.length} קבוצות)
            </h3>
            <button
              onClick={() => setShowDuplicateReview(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} color="#64748b" />
            </button>
          </div>
          
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            סמן את השירים שברצונך לשמור. השירים הלא מסומנים יימחקו.
          </p>

          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
            {duplicateGroups.map((group, groupIndex) => (
              <div key={groupIndex} style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  קבוצה {groupIndex + 1} - {group.songs.length} שירים דומים
                </div>
                {group.songs.map(song => (
                  <div
                    key={song.id}
                    onClick={() => toggleKeepSong(groupIndex, song.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px',
                      background: group.keepIds.has(song.id) ? '#ecfdf5' : '#fef2f2',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      border: group.keepIds.has(song.id) ? '1px solid #10b981' : '1px solid #fecaca',
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: group.keepIds.has(song.id) ? '#10b981' : '#fff',
                      border: group.keepIds.has(song.id) ? 'none' : '1px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {group.keepIds.has(song.id) && <Check size={14} color="#fff" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                        {song.title}
                      </div>
                      {song.artist && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {song.artist}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDuplicateReview(false)}
              style={{
                padding: '10px 20px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ביטול
            </button>
            <button
              onClick={handleDeleteReviewedDuplicates}
              disabled={reviewLoading}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                opacity: reviewLoading ? 0.7 : 1,
              }}
            >
              {reviewLoading ? 'מוחק...' : 'מחק לא מסומנים'}
            </button>
          </div>
        </div>
      )}

      {/* Search and Artist Filter */}
      {songs.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: '400px', flex: 1 }}>
            <Search 
              size={18} 
              color="#94a3b8" 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              placeholder="חיפוש שיר..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {searching && (
              <Loader2 
                size={16} 
                color="#94a3b8" 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            )}
          </div>
          
          {/* Artist Filter */}
          <select
            value={artistFilter}
            onChange={e => handleArtistChange(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              minWidth: '180px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="all">כל האמנים</option>
            {artists.map(artist => (
              <option key={artist} value={artist}>{artist}</option>
            ))}
          </select>
        </div>
      )}

      {/* Songs Table */}
      {songs.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e9eef4',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e9eef4' }}>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>שיר</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>אמן</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ז׳אנר</th>
                <th style={{ padding: '12px 16px', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredSongs.map(song => (
                <tr key={song.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
                    {song.title}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {song.artist || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8' }}>
                    {song.genre || '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleDelete(song.id)}
                      disabled={deleting === song.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {deleting === song.id ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSongs.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              לא נמצאו שירים
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}