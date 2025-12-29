'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, Search, Music, Check, X, Download, 
  Upload, Filter, Trash2, Loader2, ChevronDown,
  Clock, Disc, User
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
  rekordbox_id: string | null
  location: string | null
}

type Client = {
  id: string
  name: string
  partner_name?: string
  event_date?: string
}

type Props = {
  client: Client
  songs: Song[]
  selectedSongIds: string[]
}

// Normalize text for Hebrew search - handles different Unicode representations
function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFC') // Normalize Unicode (combines characters)
    .toLowerCase()
    .trim()
    // Remove diacritics/niqqud if present
    .replace(/[\u0591-\u05C7]/g, '')
}

export default function MeetingContent({ client, songs: initialSongs, selectedSongIds: initialSelected }: Props) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [songs, setSongs] = useState(initialSongs)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelected))
  const [filterGenre, setFilterGenre] = useState<string>('all')
  const [filterBpm, setFilterBpm] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false) // Track if user is navigating with arrows
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Database search function
  const searchDatabase = async (query: string) => {
    setSearching(true)
    try {
      const supabase = createClient()
      
      if (!query.trim()) {
        // No search - load first 500 songs
        const { data } = await supabase
          .from('songs')
          .select('*')
          .order('title')
          .limit(500)
        
        if (data) setSongs(data)
      } else {
        // Search with ilike
        const { data } = await supabase
          .from('songs')
          .select('*')
          .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
          .order('title')
          .limit(500)
        
        if (data) setSongs(data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchDatabase(value)
    }, 300)
  }

  // Focus search on load
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Get unique genres for filter
  const genres = useMemo(() => {
    const g = new Set<string>()
    songs.forEach(s => s.genre && g.add(s.genre))
    return Array.from(g).sort()
  }, [songs])

  // Filter songs - search is done by database, only apply genre/BPM filters locally
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      // Genre filter
      const matchesGenre = filterGenre === 'all' || song.genre === filterGenre
      
      // BPM filter
      let matchesBpm = true
      if (filterBpm !== 'all' && song.bpm) {
        const bpm = song.bpm
        switch (filterBpm) {
          case 'slow': matchesBpm = bpm < 100; break
          case 'medium': matchesBpm = bpm >= 100 && bpm < 120; break
          case 'fast': matchesBpm = bpm >= 120 && bpm < 140; break
          case 'veryfast': matchesBpm = bpm >= 140; break
        }
      }
      
      return matchesGenre && matchesBpm
    })
  }, [songs, filterGenre, filterBpm])

  // Reset highlighted index and navigation mode when search changes
  useEffect(() => {
    setHighlightedIndex(0)
    setIsNavigating(false) // Reset navigation mode when typing
  }, [searchQuery, filterGenre, filterBpm])

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && filteredSongs.length > 0) {
      const items = listRef.current.querySelectorAll('[data-song-item]')
      const item = items[highlightedIndex]
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedIndex, filteredSongs.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if search is focused or no input is focused
      const activeElement = document.activeElement
      const isSearchFocused = activeElement === searchRef.current
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'SELECT'
      
      if (!isSearchFocused && isInputFocused) return

      // Arrow Down - move highlight down and enter navigation mode
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIsNavigating(true) // User started navigating
        setHighlightedIndex(prev => 
          prev < filteredSongs.length - 1 ? prev + 1 : prev
        )
      }
      
      // Arrow Up - move highlight up and enter navigation mode
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIsNavigating(true) // User started navigating
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
      }
      
      // Spacebar - only select if user is navigating with arrows
      if (e.key === ' ') {
        // If user is navigating (used arrows), select the song
        if (isNavigating && filteredSongs.length > 0) {
          e.preventDefault()
          const song = filteredSongs[highlightedIndex]
          if (song) {
            toggleSong(song.id, true) // true = clear search after
          }
        }
        // If not navigating, let the space be typed normally in the search
      }
      
      // Enter - always select (useful for quick selection)
      if (e.key === 'Enter') {
        if (isSearchFocused && filteredSongs.length > 0 && searchQuery) {
          e.preventDefault()
          const song = filteredSongs[highlightedIndex]
          if (song) {
            toggleSong(song.id, true)
          }
        }
      }
      
      // Escape - clear search
      if (e.key === 'Escape') {
        handleSearchChange('')
        setIsNavigating(false)
        searchRef.current?.focus()
      }

      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredSongs, highlightedIndex, searchQuery, isNavigating])

  // Toggle song selection
  const toggleSong = async (songId: string, clearSearch = false) => {
    const newSelected = new Set(selectedIds)
    const isAdding = !newSelected.has(songId)
    
    if (isAdding) {
      newSelected.add(songId)
    } else {
      newSelected.delete(songId)
    }
    setSelectedIds(newSelected)

    // Clear search and refocus if requested
    if (clearSearch) {
      handleSearchChange('')
      setHighlightedIndex(0)
      setTimeout(() => searchRef.current?.focus(), 10)
    }

    // Show feedback
    const song = songs.find(s => s.id === songId)
    if (song) {
      if (isAdding) {
        toast.success(`✓ ${song.title}`, { duration: 1500 })
      } else {
        toast(`הוסר: ${song.title}`, { duration: 1500 })
      }
    }

    // Save to database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (isAdding) {
      await supabase.from('client_playlists').insert({
        client_id: client.id,
        song_id: songId,
        user_id: user.id,
        sort_order: newSelected.size,
      })
    } else {
      await supabase.from('client_playlists')
        .delete()
        .eq('client_id', client.id)
        .eq('song_id', songId)
    }
  }

  // Clear all selections
  const clearAll = async () => {
    if (!confirm('למחוק את כל הבחירות?')) return
    
    const supabase = createClient()
    await supabase.from('client_playlists')
      .delete()
      .eq('client_id', client.id)
    
    setSelectedIds(new Set())
    toast.success('הבחירות נמחקו')
  }

  // Export playlist as M3U (Rekordbox Import Playlist)
  const exportPlaylist = () => {
    const selectedSongs = songs.filter(s => selectedIds.has(s.id))
    
    if (selectedSongs.length === 0) {
      toast.error('לא נבחרו שירים')
      return
    }

    // Check if we have file locations
    const songsWithLocation = selectedSongs.filter(s => s.location)
    
    if (songsWithLocation.length === 0) {
      toast.error('השירים לא יובאו מ-Rekordbox XML. יש לייבא את הספרייה מחדש.')
      return
    }

    const playlistName = `${client.name}${client.partner_name ? ' & ' + client.partner_name : ''}`

    // Create M3U playlist with actual file paths
    const m3uContent = `#EXTM3U
#PLAYLIST:${playlistName}
${songsWithLocation.map(song => {
  const artist = song.artist || 'Unknown'
  const title = song.title
  // Convert path for M3U (forward slashes)
  const path = song.location!.replace(/\\/g, '/')
  return `#EXTINF:-1,${artist} - ${title}
${path}`
}).join('\n')}`

    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${playlistName.replace(/\s+/g, '_')}.m3u`
    a.click()
    
    URL.revokeObjectURL(url)
    
    if (songsWithLocation.length < selectedSongs.length) {
      toast.success(`יוצאו ${songsWithLocation.length} שירים (${selectedSongs.length - songsWithLocation.length} ללא נתיב קובץ)`)
    } else {
      toast.success('הפלייליסט יוצא! יבא ב-Rekordbox: File → Import → Playlist')
    }
  }

  // Helper to escape XML special characters
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const selectedSongs = songs.filter(s => selectedIds.has(s.id))

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href={`/dashboard/clients/${client.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              <ArrowRight size={18} />
              חזרה
            </Link>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={20} color="#0ea5e9" />
                <span style={{ fontSize: '18px', fontWeight: 600 }}>פגישת שירים</span>
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                {client.name}{client.partner_name && ` & ${client.partner_name}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px 16px',
              background: selectedIds.size > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 500,
              color: selectedIds.size > 0 ? '#10b981' : '#94a3b8',
            }}>
              ✓ {selectedIds.size} שירים נבחרו
            </div>
            <button
              onClick={exportPlaylist}
              disabled={selectedIds.size === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                background: selectedIds.size > 0 ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                opacity: selectedIds.size > 0 ? 1 : 0.5,
              }}
            >
              <Download size={16} />
              ייצא
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 24px 16px',
          display: 'flex',
          gap: '12px',
        }}>
          <div style={{ 
            flex: 1,
            position: 'relative',
          }}>
            <Search 
              size={20} 
              color="#64748b" 
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="הקלד שם שיר... (↑↓ לניווט, רווח לבחירה)"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 48px 14px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid',
                borderColor: searchQuery ? '#0ea5e9' : 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {searching && (
              <Loader2 
                size={18} 
                color="#94a3b8" 
                style={{ 
                  position: 'absolute', 
                  left: searchQuery ? '44px' : '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            )}
            {searchQuery && (
              <button
                onClick={() => {
                  handleSearchChange('')
                  searchRef.current?.focus()
                }}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '14px 20px',
              background: showFilters ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255,255,255,0.1)',
              border: '1px solid',
              borderColor: showFilters ? '#0ea5e9' : 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: showFilters ? '#0ea5e9' : '#fff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <Filter size={18} />
            פילטרים
            <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 24px 16px',
            display: 'flex',
            gap: '12px',
          }}>
            <select
              value={filterGenre}
              onChange={e => setFilterGenre(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="all">כל הז׳אנרים</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            
            <select
              value={filterBpm}
              onChange={e => setFilterBpm(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="all">כל ה-BPM</option>
              <option value="slow">איטי (&lt;100)</option>
              <option value="medium">בינוני (100-120)</option>
              <option value="fast">מהיר (120-140)</option>
              <option value="veryfast">מאוד מהיר (140+)</option>
            </select>

            {selectedIds.size > 0 && (
              <button
                onClick={clearAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={16} />
                נקה הכל
              </button>
            )}
          </div>
        )}

        {/* Keyboard hints */}
        {searchQuery && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px 12px',
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: '#64748b',
          }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↑↓</kbd> ניווט</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Enter</kbd> בחירה</span>
            {isNavigating && <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>רווח</kbd> בחירה</span>}
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd> נקה</span>
          </div>
        )}
      </div>

      {/* Songs List */}
      <div ref={listRef} style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ 
          fontSize: '13px', 
          color: '#64748b', 
          marginBottom: '12px' 
        }}>
          מציג {filteredSongs.length} מתוך {songs.length} שירים
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredSongs.map((song, index) => {
            const isSelected = selectedIds.has(song.id)
            const isHighlighted = index === highlightedIndex && searchQuery
            return (
              <div
                key={song.id}
                data-song-item
                onClick={() => toggleSong(song.id, !!searchQuery)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: isHighlighted 
                    ? 'rgba(14, 165, 233, 0.3)' 
                    : isSelected 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : 'rgba(255,255,255,0.05)',
                  border: '2px solid',
                  borderColor: isHighlighted 
                    ? '#0ea5e9' 
                    : isSelected 
                      ? 'rgba(16, 185, 129, 0.5)' 
                      : 'transparent',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: isSelected ? '#10b981' : 'rgba(255,255,255,0.1)',
                  border: '2px solid',
                  borderColor: isSelected ? '#10b981' : 'rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
                </div>

                {/* Song Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: 500, 
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {song.title}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {song.artist || 'אמן לא ידוע'}
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  flexShrink: 0,
                }}>
                  {song.bpm && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}>
                      {Math.round(song.bpm)} BPM
                    </div>
                  )}
                  {song.key && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      minWidth: '40px',
                      textAlign: 'center',
                    }}>
                      {song.key}
                    </div>
                  )}
                  {song.genre && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#0ea5e9',
                      maxWidth: '100px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {song.genre}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {filteredSongs.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#64748b',
            }}>
              <Music size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>לא נמצאו שירים</div>
              <div style={{ fontSize: '14px' }}>נסה לשנות את החיפוש או הפילטרים</div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Songs Footer */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 24px',
          zIndex: 100,
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                שירים נבחרים ({selectedIds.size})
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {selectedSongs.slice(0, 5).map(s => s.title).join(', ')}
                {selectedSongs.length > 5 && ` ועוד ${selectedSongs.length - 5}...`}
              </div>
            </div>
            <button
              onClick={exportPlaylist}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '16px',
              }}
            >
              <Download size={18} />
              ייצא פלייליסט
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        input::placeholder {
          color: #64748b;
        }
        select option {
          background: #1e293b;
          color: #fff;
        }
      `}</style>
    </div>
  )
}