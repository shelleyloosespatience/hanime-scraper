'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Shuffle, Download, Volume2, VolumeX, 
  ChevronLeft, ChevronRight, Loader2, Play, Pause,
  Maximize2, Minimize2, SkipBack, SkipForward,
  Settings, X, RotateCcw
} from 'lucide-react'

interface Video {
  id: string
  title?: string
  tags?: string[]
  duration?: number
  urls?: {
    hd?: string
    sd?: string
  }
}

interface ApiResponse {
  success: boolean
  videos?: Video[]
  suggestions?: string[]
}

const API_BASE = '/api/nsfw'

export default function NsfwHub() {
  // State management
  const [videos, setVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [quality, setQuality] = useState<'hd' | 'sd'>('hd')
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  
  // UI state
  const [controlsVisible, setControlsVisible] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [isTouching, setIsTouching] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)
  const [indicatorType, setIndicatorType] = useState<'play' | 'pause' | 'forward' | 'backward'>('play')
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const indicatorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const controlsAreaRef = useRef<HTMLDivElement>(null)

  const currentVideo = videos[currentIndex]

  // Utility functions
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const showActionIndicator = useCallback((type: typeof indicatorType) => {
    setIndicatorType(type)
    setShowIndicator(true)
    
    if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current)
    indicatorTimeoutRef.current = setTimeout(() => {
      setShowIndicator(false)
    }, 600)
  }, [])

  // Controls visibility management
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
    setControlsVisible(true)
  }, [])

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const inactive = Date.now() - lastActivity > 3000
      const shouldHide = inactive && isPlaying && !isTouching && !showSearch && !showSettings && !showVolume
      
      if (shouldHide && controlsVisible) {
        setControlsVisible(false)
      } else if (!shouldHide && !controlsVisible) {
        setControlsVisible(true)
      }
    }, 100)

    return () => clearInterval(checkInactivity)
  }, [lastActivity, isPlaying, isTouching, showSearch, showSettings, showVolume, controlsVisible])

  // API calls
  const fetchVideos = useCallback(async (query: string) => {
    if (loading || !query.trim()) return
    
    setLoading(true)
    setError('')
    setSearchQuery(query)
    
    try {
      const response = await fetch(`${API_BASE}/search/${encodeURIComponent(query)}?count=30`)
      const data = await response.json() as ApiResponse
      
      if (data.success && data.videos?.length) {
        const shuffled = shuffleArray(data.videos)
        setVideos(shuffled)
        setCurrentIndex(0)
        setShowSearch(false)
        setSearchInput('')
      } else {
        setError('No videos found')
      }
    } catch (err) {
      setError('Failed to load videos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [loading])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    
    try {
      const response = await fetch(`${API_BASE}/suggest/${encodeURIComponent(query)}?count=6`)
      const data = await response.json()
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (err) {
      console.error('Suggestions error:', err)
      setSuggestions([])
    }
  }, [])

  const fetchRandom = useCallback(async () => {
    const categories = [
      'anime', 'hentai', 'japanese', 'asian', 'cosplay',
      'teen', 'milf', 'amateur', 'pov', 'blowjob'
    ]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    await fetchVideos(randomCategory)
  }, [fetchVideos])

  // Video controls
  const loadVideo = useCallback((video: Video) => {
    if (!videoRef.current) return
    
    const url = video.urls?.[quality] || video.urls?.hd || video.urls?.sd
    if (!url) {
      setError('No video URL available')
      return
    }
    
    const proxyUrl = `${API_BASE}/proxy?url=${encodeURIComponent(url)}`
    
    videoRef.current.src = proxyUrl
    videoRef.current.playbackRate = playbackRate
    videoRef.current.load()
    
    // Auto-play if page is visible
    if (!document.hidden) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, user needs to interact
      })
    }
  }, [quality, playbackRate])

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
      showActionIndicator('pause')
    } else {
      videoRef.current.play().catch(console.error)
      showActionIndicator('play')
    }
  }, [isPlaying, showActionIndicator])

  const navigate = useCallback((direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % videos.length
      : (currentIndex - 1 + videos.length) % videos.length
    
    setCurrentIndex(newIndex)
    showActionIndicator(direction === 'next' ? 'forward' : 'backward')
  }, [currentIndex, videos.length, showActionIndicator])

  const seek = useCallback((time: number) => {
    if (!videoRef.current || isNaN(time)) return
    videoRef.current.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  const seekRelative = useCallback((seconds: number) => {
    seek(progress + seconds)
    showActionIndicator(seconds > 0 ? 'forward' : 'backward')
  }, [progress, seek, showActionIndicator])

  const setVideoVolume = useCallback((newVolume: number) => {
    if (!videoRef.current) return
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    videoRef.current.volume = clampedVolume
    setVolume(clampedVolume)
    videoRef.current.muted = clampedVolume === 0
    setIsMuted(clampedVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    
    if (isMuted || volume === 0) {
      videoRef.current.muted = false
      const newVolume = volume > 0 ? volume : 1
      videoRef.current.volume = newVolume
      setIsMuted(false)
      setVolume(newVolume)
    } else {
      videoRef.current.muted = true
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  const downloadVideo = useCallback(() => {
    if (!currentVideo) return
    
    const url = currentVideo.urls?.[quality] || currentVideo.urls?.hd || currentVideo.urls?.sd
    if (!url) return
    
    const a = document.createElement('a')
    a.href = `${API_BASE}/proxy?url=${encodeURIComponent(url)}`
    a.download = `video-${currentVideo.id}.mp4`
    a.click()
  }, [currentVideo, quality])

  // Event handlers
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    
    // Three zones: left 30%, middle 40%, right 30%
    if (x < width * 0.3) {
      seekRelative(-10)
    } else if (x > width * 0.7) {
      seekRelative(10)
    } else {
      togglePlayPause()
    }
    
    updateActivity()
  }, [seekRelative, togglePlayPause, updateActivity])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    seek(percentage * duration)
  }, [duration, seek])

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    setVideoVolume(percentage)
  }, [setVideoVolume])

  // Touch handlers for mobile
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsTouching(true)
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsTouching(false)
    
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - touchStartRef.current.x
    const deltaY = endY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    
    // Quick tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const x = endX - rect.left
        const width = rect.width
        
        if (x < width * 0.3) {
          seekRelative(-10)
        } else if (x > width * 0.7) {
          seekRelative(10)
        } else {
          togglePlayPause()
        }
      }
    }
    // Horizontal swipe
    else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      seekRelative(deltaX > 0 ? 10 : -10)
    }
    // Vertical swipe
    else if (Math.abs(deltaY) > 50) {
      navigate(deltaY > 0 ? 'prev' : 'next')
    }
  }, [seekRelative, togglePlayPause, navigate])

  // Effects
  useEffect(() => {
    if (!videos.length && !loading && !error) {
      fetchRandom()
    }
  }, [videos.length, loading, error, fetchRandom])

  useEffect(() => {
    if (currentVideo) {
      loadVideo(currentVideo)
    }
  }, [currentVideo, loadVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlers = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      timeupdate: () => {
        setProgress(video.currentTime)
        setDuration(video.duration || 0)
      },
      progress: () => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1)
          const percent = video.duration ? (bufferedEnd / video.duration) * 100 : 0
          setBuffered(percent)
        }
      },
      ended: () => navigate('next'),
      volumechange: () => {
        setVolume(video.volume)
        setIsMuted(video.muted)
      },
      ratechange: () => setPlaybackRate(video.playbackRate)
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        video.removeEventListener(event, handler)
      })
    }
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearch && e.key !== 'Escape') return
      
      updateActivity()
      
      const actions: Record<string, () => void> = {
        ' ': () => { e.preventDefault(); togglePlayPause() },
        'ArrowLeft': () => { e.preventDefault(); seekRelative(-5) },
        'ArrowRight': () => { e.preventDefault(); seekRelative(5) },
        'ArrowUp': () => { e.preventDefault(); setVideoVolume(volume + 0.1) },
        'ArrowDown': () => { e.preventDefault(); setVideoVolume(volume - 0.1) },
        'j': () => seekRelative(-10),
        'l': () => seekRelative(10),
        'k': () => togglePlayPause(),
        ',': () => navigate('prev'),
        '.': () => navigate('next'),
        'm': () => toggleMute(),
        'f': () => toggleFullscreen(),
        '/': () => { e.preventDefault(); setShowSearch(true) },
        'Escape': () => {
          if (showSettings) setShowSettings(false)
          if (showSearch) setShowSearch(false)
          if (document.fullscreenElement) toggleFullscreen()
        }
      }
      
      actions[e.key]?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    togglePlayPause, seekRelative, setVideoVolume, volume, 
    navigate, toggleMute, toggleFullscreen, showSearch, showSettings,
    updateActivity
  ])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Mouse movement handler
  const handleMouseMove = useCallback(() => {
    updateActivity()
  }, [updateActivity])

  // Prevent context menu on mobile
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    document.addEventListener('contextmenu', preventDefault)
    return () => document.removeEventListener('contextmenu', preventDefault)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-black overflow-hidden select-none ${
        controlsVisible ? 'cursor-default' : 'cursor-none'
      }`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <div className="absolute inset-0 flex items-center justify-center">
        {loading && videos.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-white/30" />
            <p className="text-white/50 text-sm font-medium">Loading videos...</p>
          </div>
        ) : error ? (
          <div className="text-center p-4">
            <p className="text-white/50 mb-4">{error}</p>
            <button
              onClick={fetchRandom}
              className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all inline-flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        ) : currentVideo ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            onClick={handleVideoClick}
            poster=""
          />
        ) : null}
      </div>

      {/* Action Indicators */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-5">
              {indicatorType === 'play' && <Play size={40} className="text-white" />}
              {indicatorType === 'pause' && <Pause size={40} className="text-white" />}
              {indicatorType === 'forward' && <SkipForward size={40} className="text-white" />}
              {indicatorType === 'backward' && <SkipBack size={40} className="text-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex flex-col"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full p-4 md:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-2xl mx-auto">
                <div className="relative mb-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value)
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
                      searchDebounceRef.current = setTimeout(() => {
                        fetchSuggestions(e.target.value)
                      }, 300)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchInput.trim()) {
                        fetchVideos(searchInput.trim())
                      } else if (e.key === 'Escape') {
                        setShowSearch(false)
                      }
                    }}
                    placeholder="Search videos..."
                    className="w-full pl-12 pr-12 py-4 bg-white/5 backdrop-blur-sm rounded-2xl text-white placeholder-white/30 border border-white/10 focus:border-white/30 focus:bg-white/10 focus:outline-none text-base md:text-lg transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSearch(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto scrollbar-none">
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
                    >
                      {suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchInput(suggestion)
                            fetchVideos(suggestion)
                          }}
                          className="w-full px-4 py-3.5 text-left text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm md:text-base first:rounded-t-2xl last:rounded-b-2xl"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-medium">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white/50 hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Quality */}
                <div>
                  <label className="text-white/70 text-sm mb-3 block">Quality</label>
                  <div className="flex gap-2">
                    {(['sd', 'hd'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q)
                          if (currentVideo) loadVideo(currentVideo)
                        }}
                        className={`flex-1 py-3 rounded-xl transition-all font-medium ${
                          quality === q 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playback Speed */}
                <div>
                  <label className="text-white/70 text-sm mb-3 block">Playback Speed</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.playbackRate = rate
                            setPlaybackRate(rate)
                          }
                        }}
                        className={`py-3 rounded-xl transition-all text-sm font-medium ${
                          playbackRate === rate 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {controlsVisible && (
          <>
            {/* Top Bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 p-4 md:p-6"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))'
              }}
            >
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowSearch(true)
                    setSearchInput('')
                    setSuggestions([])
                  }}
                  className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={fetchRandom}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  <Shuffle size={18} />
                </button>
              </div>
            </motion.div>

            {/* Bottom Controls */}
            <motion.div
              ref={controlsAreaRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))'
              }}
              onMouseEnter={() => setShowVolume(false)}
            >
              <div className="px-4 pb-4 pt-8 md:px-6 md:pb-6">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div 
                    className="relative h-1.5 md:h-1 bg-white/20 rounded-full cursor-pointer group hover:h-2 transition-all"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="absolute h-full bg-white/30 rounded-full transition-all"
                      style={{ width: `${buffered}%` }}
                    />
                    <div 
                      className="absolute h-full bg-white rounded-full transition-all"
                      style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                    />
                    <div 
                      className="absolute w-4 h-4 bg-white rounded-full -top-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ 
                        left: `${duration > 0 ? (progress / duration) * 100 : 0}%`, 
                        transform: 'translateX(-50%)' 
                      }}
                    />
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    className="p-2.5 md:p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>

                  {/* Mobile Navigation */}
                  <div className="flex items-center gap-1 md:hidden">
                    <button
                      onClick={() => navigate('prev')}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <SkipBack size={18} />
                    </button>
                    <button
                      onClick={() => navigate('next')}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <SkipForward size={18} />
                    </button>
                  </div>

                  {/* Time */}
                  <div className="text-white/70 text-sm tabular-nums select-none">
                    {formatTime(progress)} / {formatTime(duration)}
                  </div>

                  <div className="flex-1" />

                  {/* Volume - Desktop Only */}
                  <div className="relative items-center hidden md:flex">
                    <button
                      onClick={toggleMute}
                      onMouseEnter={() => setShowVolume(true)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    
                    <AnimatePresence>
                      {showVolume && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 100, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="ml-2 h-8 flex items-center"
                          onMouseEnter={() => {
                            if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current)
                          }}
                          onMouseLeave={() => {
                            volumeTimeoutRef.current = setTimeout(() => {
                              setShowVolume(false)
                            }, 1000)
                          }}
                        >
                          <div 
                            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer flex-1"
                            onClick={handleVolumeChange}
                          >
                            <div 
                              className="absolute h-full bg-white rounded-full"
                              style={{ width: `${volume * 100}%` }}
                            />
                            <div 
                              className="absolute w-3 h-3 bg-white rounded-full -top-[3px] shadow-lg"
                              style={{ 
                                left: `${volume * 100}%`, 
                                transform: 'translateX(-50%)' 
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Settings */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <Settings size={18} />
                  </button>

                  {/* Download */}
                  <button
                    onClick={downloadVideo}
                    className="p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <Download size={18} />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Side Navigation - Desktop Only */}
            {videos.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.7, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ opacity: 1 }}
                  onClick={() => navigate('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all hidden md:block"
                >
                  <ChevronLeft size={28} />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 0.7, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ opacity: 1 }}
                  onClick={() => navigate('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all hidden md:block"
                >
                  <ChevronRight size={28} />
                </motion.button>
              </>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}