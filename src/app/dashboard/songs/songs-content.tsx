'use client'

import { useState, useRef } from 'react'
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

  const filteredSongs = songs.filter(song => {
    const query = searchQuery.toLowerCase()
    return !query || 
      song.title.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query)
  })

  // Parse XML in browser with deduplication
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
    
    // Use Map for deduplication (key = title + artist)
    const songMap = new Map<string, ParsedSong>()
    
    // Helper to create unique key
    const getSongKey = (title: string, artist: string | null) => {
      return `${title.toLowerCase().trim()}|||${(artist || '').toLowerCase().trim()}`
    }

    tracks.forEach(track => {
      const title = track.getAttribute('Name')?.trim()
      if (!title) return

      // Skip short WAV samples
      const kind = track.getAttribute('Kind') || ''
      const totalTime = parseInt(track.getAttribute('TotalTime') || '0')
      if (kind === 'WAV File' && totalTime < 30) return

      const artist = track.getAttribute('Artist')?.trim() || null
      const key = getSongKey(title, artist)
      
      // Skip if already seen
      if (songMap.has(key)) return

      const bpmStr = track.getAttribute('AverageBpm')
      const bpm = bpmStr ? parseFloat(bpmStr) : null
      const ratingStr = track.getAttribute('Rating')
      const rating = ratingStr ? parseInt(ratingStr) : null

      // Get and decode location
      let location = track.getAttribute('Location')
      if (location) {
        try {
          location = decodeURIComponent(location).replace(/^file:\/\/localhost\//, '')
        } catch (e) {}
      }

      // Format duration
      const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60)
        const s = secs % 60
        return `${mins}:${s.toString().padStart(2, '0')}`
      }

      songMap.set(key, {
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
      const fileName = file.name.toLowerCase()
      
      let parsedSongs
      
      // Parse XML in browser
      if (fileName.endsWith('.xml') || text.trim().startsWith('<?xml')) {
        setImportProgress('מנתח שירים...')
        parsedSongs = parseXMLInBrowser(text)
      } else {
        // For TXT files, still send to server (small files)
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/songs/import', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Import failed')
        }

        toast.success(result.message)
        router.refresh()
        
        const supabase = createClient()
        const { data, count } = await supabase
          .from('songs')
          .select('*', { count: 'exact' })
          .order('title')
        
        if (data) {
          setSongs(data)
          setTotalCount(count || data.length)
        }
        return
      }

      if (parsedSongs.length === 0) {
        throw new Error('לא נמצאו שירים בקובץ')
      }

      // Send in chunks of 500 songs
      const CHUNK_SIZE = 500
      let totalImported = 0
      let totalSkipped = 0
      
      for (let i = 0; i < parsedSongs.length; i += CHUNK_SIZE) {
        const chunk = parsedSongs.slice(i, i + CHUNK_SIZE)
        const progress = Math.min(i + CHUNK_SIZE, parsedSongs.length)
        setImportProgress(`מייבא ${progress} / ${parsedSongs.length} שירים...`)
        
        const response = await fetch('/api/songs/import-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songs: chunk }),
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Import failed')
        }
        
        const result = await response.json()
        totalImported += result.imported || 0
        totalSkipped += result.skipped || 0
      }

      toast.success(`${totalImported} שירים יובאו בהצלחה!${totalSkipped > 0 ? ` (${totalSkipped} כפילויות דולגו)` : ''}`)
      router.refresh()
      
      // Reload songs with count
      const supabase = createClient()
      const { data, count } = await supabase
        .from('songs')
        .select('*', { count: 'exact' })
        .order('title')
      
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

      // Get all songs
      const { data: allSongs } = await supabase
        .from('songs')
        .select('id, title, artist, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!allSongs || allSongs.length === 0) {
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
                onClick={handleDeleteDuplicates}
                disabled={importing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#fff',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  color: '#d97706',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                מחק כפילויות
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

      {/* Search */}
      {songs.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search 
              size={18} 
              color="#94a3b8" 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              placeholder="חיפוש שיר או אמן..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
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
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>BPM</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Key</th>
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
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                    {song.bpm ? Math.round(song.bpm) : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                    {song.key || '-'}
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