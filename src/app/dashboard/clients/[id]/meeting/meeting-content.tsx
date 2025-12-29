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
  const [filterArtist, setFilterArtist] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false) // Track if user is navigating with arrows
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [artists, setArtists] = useState<string[]>([])
  const [popularityCounts, setPopularityCounts] = useState<Map<string, number>>(new Map())
  
  // Categories
  type SongCategory = {
    id: string
    name: string
    color: string
    order_num: number
  }
  const [categories, setCategories] = useState<SongCategory[]>([])
  const [songCategories, setSongCategories] = useState<Map<string, string>>(new Map()) // song_id -> category_id
  const [selectedCategory, setSelectedCategory] = useState<string>('') // Current category for new songs
  const [viewingCategory, setViewingCategory] = useState<string | null>(null) // Category being viewed/edited in modal

  // Load unique artists, popularity, and categories on mount
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Load artists
      const { data: artistData } = await supabase
        .from('songs')
        .select('artist')
        .not('artist', 'is', null)
        .not('artist', 'eq', '')
      
      if (artistData) {
        const uniqueArtists = [...new Set(artistData.map(s => s.artist).filter(Boolean))] as string[]
        uniqueArtists.sort((a, b) => a.localeCompare(b, 'he'))
        setArtists(uniqueArtists)
      }
      
      // Load popularity counts
      const { data: popularityData } = await supabase
        .from('client_playlists')
        .select('song_id')
      
      if (popularityData) {
        const counts = new Map<string, number>()
        for (const row of popularityData) {
          counts.set(row.song_id, (counts.get(row.song_id) || 0) + 1)
        }
        setPopularityCounts(counts)
      }
      
      // Load categories
      const { data: categoryData } = await supabase
        .from('song_categories')
        .select('*')
        .order('order_num')
      
      if (categoryData) {
        setCategories(categoryData)
        // Don't auto-select - user must explicitly choose
      }
      
      // Load song-category assignments for this client
      const { data: songCatData } = await supabase
        .from('client_song_categories')
        .select('song_id, category_id')
        .eq('client_id', client.id)
      
      if (songCatData) {
        const map = new Map<string, string>()
        for (const row of songCatData) {
          map.set(row.song_id, row.category_id)
        }
        setSongCategories(map)
      }
    }
    loadData()
  }, [client.id])

  // Database search function
  const searchDatabase = async (query: string, artist: string = filterArtist) => {
    setSearching(true)
    try {
      const supabase = createClient()
      
      let queryBuilder = supabase
        .from('songs')
        .select('*')
      
      // Apply artist filter
      if (artist !== 'all') {
        queryBuilder = queryBuilder.eq('artist', artist)
      }
      
      // Apply search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
      }
      
      const { data } = await queryBuilder
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

  // Handle artist filter change
  const handleArtistChange = (artist: string) => {
    setFilterArtist(artist)
    searchDatabase(searchQuery, artist)
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

  // Filter songs - search is done by database, only apply genre filter locally
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      // Genre filter
      return filterGenre === 'all' || song.genre === filterGenre
    })
  }, [songs, filterGenre])

  // Reset highlighted index and navigation mode when search changes
  useEffect(() => {
    setHighlightedIndex(0)
    setIsNavigating(false) // Reset navigation mode when typing
  }, [searchQuery, filterGenre])

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
            toggleSong(song.id) // Don't clear search
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
            toggleSong(song.id) // Don't clear search
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
      // Also set category if selected
      if (selectedCategory) {
        const newSongCategories = new Map(songCategories)
        newSongCategories.set(songId, selectedCategory)
        setSongCategories(newSongCategories)
      }
    } else {
      newSelected.delete(songId)
      // Remove category assignment
      const newSongCategories = new Map(songCategories)
      newSongCategories.delete(songId)
      setSongCategories(newSongCategories)
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
    const categoryName = selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : ''
    if (song) {
      if (isAdding) {
        toast.success(`✓ ${song.title}${categoryName ? ` (${categoryName})` : ''}`, { duration: 1500 })
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
      
      // Save category assignment if present
      if (selectedCategory) {
        await supabase.from('client_song_categories').upsert({
          client_id: client.id,
          song_id: songId,
          category_id: selectedCategory,
        })
      }
    } else {
      await supabase.from('client_playlists')
        .delete()
        .eq('client_id', client.id)
        .eq('song_id', songId)
      
      // Remove category assignment
      await supabase.from('client_song_categories')
        .delete()
        .eq('client_id', client.id)
        .eq('song_id', songId)
    }
  }

  // Change category for a song
  const changeSongCategory = async (songId: string, categoryId: string) => {
    const newSongCategories = new Map(songCategories)
    if (categoryId) {
      newSongCategories.set(songId, categoryId)
    } else {
      newSongCategories.delete(songId)
    }
    setSongCategories(newSongCategories)
    
    const supabase = createClient()
    if (categoryId) {
      await supabase.from('client_song_categories').upsert({
        client_id: client.id,
        song_id: songId,
        category_id: categoryId,
      })
    } else {
      await supabase.from('client_song_categories')
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

    const playlistName = `${client.name}${client.partner_name ? ' & ' + client.partner_name : ''}`

    // Check if songs have file locations
    const songsWithLocation = selectedSongs.filter(s => s.location)
    
    // Group songs by category
    const songsByCategory = new Map<string, typeof selectedSongs>()
    const uncategorized: typeof selectedSongs = []
    
    for (const song of selectedSongs) {
      const categoryId = songCategories.get(song.id)
      if (categoryId) {
        if (!songsByCategory.has(categoryId)) {
          songsByCategory.set(categoryId, [])
        }
        songsByCategory.get(categoryId)!.push(song)
      } else {
        uncategorized.push(song)
      }
    }

    // If no songs have location, export as TXT list instead
    if (songsWithLocation.length === 0) {
      const createTXT = (songs: typeof selectedSongs, name: string) => {
        return `${name}\n${'='.repeat(name.length)}\n\n${songs.map(song => {
          const artist = song.artist || ''
          return artist ? `${song.title} - ${artist}` : song.title
        }).join('\n')}`
      }

      // Single file for all songs
      if (categories.length === 0 || songsByCategory.size === 0) {
        const txtContent = createTXT(selectedSongs, playlistName)
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${playlistName.replace(/\s+/g, '_')}.txt`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`יוצאו ${selectedSongs.length} שירים כרשימת טקסט (ללא נתיבי קבצים)`)
        return
      }

      // Multiple TXT files by category
      const downloadTXT = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }

      let downloadCount = 0
      const totalFiles = songsByCategory.size + (uncategorized.length > 0 ? 1 : 0)

      Array.from(songsByCategory.entries()).forEach(([catId, catSongs], index) => {
        const category = categories.find(c => c.id === catId)
        const catName = category?.name || 'Unknown'
        const filename = `${playlistName.replace(/\s+/g, '_')}_${catName.replace(/\s+/g, '_')}.txt`
        
        setTimeout(() => {
          downloadTXT(createTXT(catSongs, `${playlistName} - ${catName}`), filename)
          downloadCount++
          if (downloadCount === totalFiles) {
            toast.success(`יוצאו ${totalFiles} רשימות טקסט (ללא נתיבי קבצים)`)
          }
        }, index * 300)
      })

      if (uncategorized.length > 0) {
        setTimeout(() => {
          const filename = `${playlistName.replace(/\s+/g, '_')}_ללא_קטגוריה.txt`
          downloadTXT(createTXT(uncategorized, `${playlistName} - ללא קטגוריה`), filename)
          downloadCount++
          if (downloadCount === totalFiles) {
            toast.success(`יוצאו ${totalFiles} רשימות טקסט (ללא נתיבי קבצים)`)
          }
        }, songsByCategory.size * 300)
      }
      return
    }

    // Create M3U content for a list of songs (only songs with locations)
    const createM3U = (songs: typeof selectedSongs, name: string) => {
      const songsWithLoc = songs.filter(s => s.location)
      return `#EXTM3U
#PLAYLIST:${name}
${songsWithLoc.map(song => {
  const artist = song.artist || 'Unknown'
  const title = song.title
  const path = song.location!.replace(/\\/g, '/')
  return `#EXTINF:-1,${artist} - ${title}
${path}`
}).join('\n')}`
    }

    // If no categories defined or all songs uncategorized, just download single M3U
    if (categories.length === 0 || (songsByCategory.size === 0 && uncategorized.length > 0)) {
      const m3uContent = createM3U(selectedSongs, playlistName)
      const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${playlistName.replace(/\s+/g, '_')}.m3u`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`יוצאו ${songsWithLocation.length} שירים`)
      return
    }

    // Multiple categories - create separate M3U files
    // Download each one with a small delay
    const downloadM3U = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }

    let downloadCount = 0
    const totalFiles = songsByCategory.size + (uncategorized.length > 0 ? 1 : 0)
    
    // Download category playlists
    Array.from(songsByCategory.entries()).forEach(([catId, catSongs], index) => {
      const category = categories.find(c => c.id === catId)
      const catName = category?.name || 'Unknown'
      const filename = `${playlistName.replace(/\s+/g, '_')}_${catName.replace(/\s+/g, '_')}.m3u`
      
      setTimeout(() => {
        downloadM3U(createM3U(catSongs, `${playlistName} - ${catName}`), filename)
        downloadCount++
        if (downloadCount === totalFiles) {
          toast.success(`יוצאו ${totalFiles} פלייליסטים!`)
        }
      }, index * 300)
    })

    // Download uncategorized if exists
    if (uncategorized.length > 0) {
      setTimeout(() => {
        const filename = `${playlistName.replace(/\s+/g, '_')}_ללא_קטגוריה.m3u`
        downloadM3U(createM3U(uncategorized, `${playlistName} - ללא קטגוריה`), filename)
        downloadCount++
        if (downloadCount === totalFiles) {
          toast.success(`יוצאו ${totalFiles} פלייליסטים!`)
        }
      }, songsByCategory.size * 300)
    }
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
            flexWrap: 'wrap',
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
                maxWidth: '200px',
              }}
            >
              <option value="all">כל הז׳אנרים</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={filterArtist}
              onChange={e => handleArtistChange(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                maxWidth: '200px',
              }}
            >
              <option value="all">כל האמנים</option>
              {artists.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
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
        {/* Category Buttons - Always Visible */}
        {categories.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
              בחר קטגוריה לפני הוספת שירים:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory('')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: !selectedCategory ? '#fff' : 'rgba(255,255,255,0.2)',
                  background: !selectedCategory ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: !selectedCategory ? '#fff' : '#94a3b8',
                  fontSize: '14px',
                  fontWeight: !selectedCategory ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ללא קטגוריה
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '2px solid',
                    borderColor: selectedCategory === cat.id ? cat.color : 'rgba(255,255,255,0.2)',
                    background: selectedCategory === cat.id ? cat.color + '33' : 'rgba(255,255,255,0.05)',
                    color: selectedCategory === cat.id ? cat.color : '#94a3b8',
                    fontSize: '14px',
                    fontWeight: selectedCategory === cat.id ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
                onClick={() => toggleSong(song.id)}
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
                {categories.length > 0 && ` • ${Array.from(new Set(Array.from(selectedIds).map(id => songCategories.get(id)).filter(Boolean))).length} קטגוריות`}
              </div>
              <div style={{ 
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                {categories.filter(c => 
                  Array.from(selectedIds).some(id => songCategories.get(id) === c.id)
                ).map(c => {
                  const count = Array.from(selectedIds).filter(id => songCategories.get(id) === c.id).length
                  return (
                    <button
                      key={c.id}
                      onClick={() => setViewingCategory(c.id)}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: c.color + '33',
                        color: c.color,
                        border: `1px solid ${c.color}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {c.name}: {count}
                    </button>
                  )
                })}
                {Array.from(selectedIds).filter(id => !songCategories.get(id)).length > 0 && (
                  <button
                    onClick={() => setViewingCategory('uncategorized')}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                  >
                    ללא קטגוריה: {Array.from(selectedIds).filter(id => !songCategories.get(id)).length}
                  </button>
                )}
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
              ייצא ל-Rekordbox
            </button>
          </div>
        </div>
      )}

      {/* Category Viewer Modal */}
      {viewingCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                {viewingCategory === 'uncategorized' 
                  ? 'ללא קטגוריה' 
                  : categories.find(c => c.id === viewingCategory)?.name || ''}
              </h3>
              <button
                onClick={() => setViewingCategory(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Songs List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              {Array.from(selectedIds)
                .filter(id => {
                  const catId = songCategories.get(id)
                  if (viewingCategory === 'uncategorized') return !catId
                  return catId === viewingCategory
                })
                .map(songId => {
                  const song = songs.find(s => s.id === songId)
                  if (!song) return null
                  return (
                    <div
                      key={songId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>
                          {song.title}
                        </div>
                        {song.artist && (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {song.artist}
                          </div>
                        )}
                      </div>
                      
                      {/* Category Selector */}
                      <select
                        value={songCategories.get(songId) || ''}
                        onChange={e => changeSongCategory(songId, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">ללא קטגוריה</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => toggleSong(songId)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        הסר
                      </button>
                    </div>
                  )
                })}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setViewingCategory(null)}
                style={{
                  padding: '10px 20px',
                  background: '#0ea5e9',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                סגור
              </button>
            </div>
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