// app/hanime/page.tsx - Fixed version with proper tag functionality
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Custom SVG Components
const CustomArrowSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 7.5L18 12L13.5 16.5M18 12H6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
  </svg>
);

const NewIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
  </svg>
);

const DiscoverIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="9" cy="9" r="2" fill="currentColor"/>
    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const FeaturedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

interface Video {
  id: string;
  slug: string;
  name: string;
  poster_url: string;
  cover_url: string;
  views: number;
  likes?: number;
  brand: string;
  duration: number;
  rating?: number;
  is_censored?: boolean;
}

interface Tag {
  id: string;
  name: string;
  slug?: string;
  [key: string]: any;
}

// Utility Functions
const calculateRating = (views: number): number => {
  if (views > 10000000) return 4.8 + Math.random() * 0.2;
  if (views > 5000000) return 4.5 + Math.random() * 0.4;
  if (views > 1000000) return 4.0 + Math.random() * 0.6;
  if (views > 500000) return 3.8 + Math.random() * 0.7;
  return 3.5 + Math.random() * 1.0;
};

const SectionHeader = ({ title, icon: IconComponent, onViewAll, showViewAll = true }: { 
  title: string; 
  icon: React.ComponentType; 
  onViewAll?: () => void;
  showViewAll?: boolean;
}) => (
  <div className="flex items-center justify-between mb-8">
    <motion.h2 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="text-3xl font-bold text-white flex items-center gap-3"
    >
      <span className="animate-bounce text-pink-400">
        <IconComponent />
      </span> 
      {title}
    </motion.h2>
    
    {showViewAll && (
      <motion.button
        onClick={onViewAll}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 py-2 rounded-2xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-2"
      >
        <CustomArrowSVG />
        View All
      </motion.button>
    )}
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div style={{ aspectRatio: '2/3' }} className="bg-white/10 rounded-xl"></div>
    <div className="mt-4 space-y-3">
      <div className="h-5 bg-white/10 rounded"></div>
      <div className="h-4 bg-white/10 rounded w-2/3"></div>
    </div>
  </div>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex justify-center items-center gap-2 mt-8">
    <button
      onClick={() => onPageChange(Math.max(0, currentPage - 1))}
      disabled={currentPage === 0}
      className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
    >
      Previous
    </button>
    
    <span className="px-4 py-2 text-white">
      Page {currentPage + 1} of {totalPages}
    </span>
    
    <button
      onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
      disabled={currentPage >= totalPages - 1}
      className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
    >
      Next
    </button>
  </div>
);

export default function HanimePage() {
  const router = useRouter();
  const [featuredAnimes, setFeaturedAnimes] = useState<Video[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [newVideos, setNewVideos] = useState<Video[]>([]);
  const [randomTagVideos, setRandomTagVideos] = useState<Video[]>([]);
  const [randomTag, setRandomTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trendingTimeframe, setTrendingTimeframe] = useState('week');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'anime' | 'tag'>('anime');
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  
  // NEW: Tag-specific states
  const [showTagSection, setShowTagSection] = useState(false);
  const [tagSectionVideos, setTagSectionVideos] = useState<Video[]>([]);
  const [tagCurrentPage, setTagCurrentPage] = useState(0);
  const [tagTotalPages, setTagTotalPages] = useState(0);
  const [tagLoading, setTagLoading] = useState(false);

  // Auto-scroll featured animes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;
    let isPaused = false;

    const startScroll = () => {
      scrollInterval = setInterval(() => {
        if (!isPaused && container) {
          container.scrollLeft += 1.5;
          if (container.scrollLeft >= container.scrollWidth / 2) {
            container.scrollLeft = 0;
          }
        }
      }, 30);
    };

    container.addEventListener('mouseenter', () => { isPaused = true; });
    container.addEventListener('mouseleave', () => { isPaused = false; });
    
    startScroll();
    return () => {
      clearInterval(scrollInterval);
    };
  }, [featuredAnimes]);

  // Initial load with randomization
  useEffect(() => {
    fetchInitialData();
  }, []);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch multiple pages for more content
      const [featuredRes, trending1, trending2, new1, new2, tagsRes] = await Promise.all([
        fetch('/api/hanime/trending?time=month&page=0'),
        fetch('/api/hanime/trending?time=week&page=0'),
        fetch('/api/hanime/trending?time=week&page=1'),
        fetch('/api/hanime/trending?time=day&page=0'),
        fetch('/api/hanime/trending?time=day&page=1'),
        fetch('/api/hanime/tags')
      ]);

      const featuredData = await featuredRes.json();
      const trending1Data = await trending1.json();
      const trending2Data = await trending2.json();
      const new1Data = await new1.json();
      const new2Data = await new2.json();
      const tagsData = await tagsRes.json();

      // Set featured (keep in order for quality)
      setFeaturedAnimes(featuredData.results?.slice(0, 20) || []);

      // Combine and randomize trending
      const allTrending = [...(trending1Data.results || []), ...(trending2Data.results || [])];
      setTrendingVideos(shuffleArray(allTrending).slice(0, 50));

      // Combine and randomize new
      const allNew = [...(new1Data.results || []), ...(new2Data.results || [])];
      setNewVideos(shuffleArray(allNew).slice(0, 50));

      // Get random tag and fetch videos for it
      if (tagsData.tags && tagsData.tags.length > 0) {
        const randomTagObj = tagsData.tags[Math.floor(Math.random() * tagsData.tags.length)];
        setRandomTag(randomTagObj.name);
        
        const tagVideosRes = await fetch(`/api/hanime/tags/${encodeURIComponent(randomTagObj.name)}?page=0`);
        const tagVideosData = await tagVideosRes.json();
        setRandomTagVideos(shuffleArray(tagVideosData.results || []).slice(0, 20));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
    setLoading(false);
  };

  const handleTimeframeChange = async (timeframe: string) => {
    setTrendingTimeframe(timeframe);
    setLoading(true);
    
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/hanime/trending?time=${timeframe}&page=0`),
        fetch(`/api/hanime/trending?time=${timeframe}&page=1`)
      ]);
      
      const data1 = await res1.json();
      const data2 = await res2.json();
      
      const combined = [...(data1.results || []), ...(data2.results || [])];
      setTrendingVideos(shuffleArray(combined).slice(0, 50));
    } catch (error) {
      console.error('Error changing timeframe:', error);
    }
    
    setLoading(false);
  };

  // FIXED: Separate handlers for anime and tag search
  const handleAnimeSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/hanime/search?q=${encodeURIComponent(query)}&page=0`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching anime:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleTagSearch = async (query: string) => {
    if (!query.trim()) {
      setTagSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/hanime/tags?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setTagSuggestions(data.tags || []);
    } catch (error) {
      console.error('Error searching tags:', error);
      setTagSuggestions([]);
    }
  };

  // FIXED: Proper tag selection handler
  const handleTagSelect = async (tag: Tag) => {
    setSelectedTag(tag);
    setSearchQuery(tag.name);
    setTagSuggestions([]);
    setShowSearchResults(false);
    setIsSearchFocused(false);
    
    // Hide other sections and show tag section
    setShowTagSection(true);
    setTagCurrentPage(0);
    await fetchTagVideos(tag.name, 0);
  };

  const fetchTagVideos = async (tagName: string, page: number) => {
    setTagLoading(true);
    try {
      const res = await fetch(`/api/hanime/tags/${encodeURIComponent(tagName)}?page=${page}`);
      const data = await res.json();
      
      setTagSectionVideos(data.results || []);
      // Assuming 20 items per page, calculate total pages
      setTagTotalPages(Math.ceil((data.total || 100) / 20));
    } catch (error) {
      console.error('Error fetching tag videos:', error);
      setTagSectionVideos([]);
    }
    setTagLoading(false);
  };

  const handleTagPageChange = (page: number) => {
    if (selectedTag) {
      setTagCurrentPage(page);
      fetchTagVideos(selectedTag.name, page);
    }
  };

  const handleVideoClick = (slug: string) => {
    router.push(`/hanime/watch/${slug}`);
  };

  const handleViewAllTrending = () => {
    router.push('/hanime/trending');
  };

  const handleViewAllNew = () => {
    router.push('/hanime/new');
  };

  const handleViewAllTag = () => {
    if (randomTag) {
      router.push(`/hanime/tag/${encodeURIComponent(randomTag)}`);
    }
  };

  // FIXED: Clear tag section when switching modes
  const handleSearchModeChange = (mode: 'anime' | 'tag') => {
    setSearchMode(mode);
    setSearchQuery('');
    setShowSearchResults(false);
    setTagSuggestions([]);
    setSelectedTag(null);
    setShowTagSection(false);
    setSearchResults([]);
  };

  const timeframeOptions = [
    { value: 'day', label: 'Today', icon: '🌅' },
    { value: 'week', label: 'This Week', icon: '📅' },
    { value: 'month', label: 'This Month', icon: '📆' },
    { value: '3_month', label: '3 Months', icon: '🗓️' },
    { value: 'year', label: 'This Year', icon: '🎊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Auto-scrolling Featured Section */}
      <section className="relative overflow-hidden py-8 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-[1920px] mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-6 flex items-center gap-3"
          >
            <span className="animate-pulse text-yellow-400">
              <FeaturedIcon />
            </span> 
            Featured Anime
          </motion.h2>
          
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none"></div>
            
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {[...featuredAnimes, ...featuredAnimes].map((anime, index) => (
                <motion.div
                  key={`${anime.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => handleVideoClick(anime.slug)}
                  className="flex-shrink-0 flex bg-white/5 backdrop-blur-lg rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all group border border-white/10 hover:border-pink-500/50"
                  style={{ width: '450px' }}
                >
                  <div className="w-28 h-36 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                    <img
                      src={anime.cover_url || anime.poster_url}
                      alt={anime.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="ml-4 flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h3 className="font-bold text-white line-clamp-2 group-hover:text-pink-400 transition-colors text-lg">
                        {anime.name}
                      </h3>
                      <p className="text-sm text-purple-400 mt-1 font-medium">{anime.brand}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm mt-2">
                      <span className="text-yellow-400 flex items-center gap-1">
                        <span className="text-lg">★</span> 
                        {calculateRating(anime.views).toFixed(1)}
                      </span>
                      <span className="text-gray-400">👁 {(anime.views / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FIXED: Big Search Section */}
      <section className="py-12 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="flex gap-2 mb-2">
              <button
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${searchMode === 'anime' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-300'}`}
                onClick={() => handleSearchModeChange('anime')}
              >
                <SearchIcon />
                Anime
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${searchMode === 'tag' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}`}
                onClick={() => handleSearchModeChange('tag')}
              >
                <TagIcon />
                Tag
              </button>
            </div>
            
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchMode === 'anime') {
                    handleAnimeSearch(e.target.value);
                  } else {
                    handleTagSearch(e.target.value);
                  }
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder={searchMode === 'tag' ? 'Search by tag...' : 'Search for your favorite anime...'}
                className="w-full px-8 py-6 text-xl rounded-3xl bg-white/10 backdrop-blur-lg border-2 border-white/20 focus:border-pink-500 outline-none text-white placeholder-gray-400 transition-all"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-xl -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            </div>
            
            {/* FIXED: Separate dropdowns for anime and tag search */}
            <AnimatePresence>
              {searchMode === 'tag' && tagSuggestions.length > 0 && isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 max-h-96 overflow-y-auto z-50"
                >
                  {tagSuggestions.map((tag) => (
                    <div
                      key={tag.name}
                      onClick={() => handleTagSelect(tag)}
                      className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <span className="text-purple-400 font-bold">
                        <TagIcon />
                      </span>
                      <span className="text-white font-semibold line-clamp-1">{tag.name}</span>
                    </div>
                  ))}
                </motion.div>
              )}
              
              {searchMode === 'anime' && showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 max-h-96 overflow-y-auto z-50"
                >
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => {
                        handleVideoClick(result.slug);
                        setShowSearchResults(false);
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <img 
                        src={result.cover_url || result.poster_url} 
                        alt={result.name}
                        className="w-16 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold line-clamp-1">{result.name}</h4>
                        <p className="text-sm text-gray-400">{result.brand} • <span className="text-yellow-400">★ {calculateRating(result.views).toFixed(1)}</span> • {(result.views / 1000).toFixed(1)}K views</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <main className="max-w-[1920px] mx-auto px-6 pb-20">
        {/* NEW: Tag Results Section - Shows when a tag is selected */}
        {showTagSection && selectedTag && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-white flex items-center gap-3"
              >
                <span className="text-purple-400">
                  <TagIcon />
                </span>
                Results for: 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  {selectedTag.name}
                </span>
              </motion.h2>
              
              <button
                onClick={() => setShowTagSection(false)}
                className="px-4 py-2 rounded-2xl font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                Close
              </button>
            </div>
            
            {tagLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {[...Array(20)].map((_, i) => (
                  <LoadingSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                  {tagSectionVideos.map((video, index) => (
                    <motion.div
                      key={`tag-result-${video.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <VideoCard video={video} onClick={() => handleVideoClick(video.slug)} />
                    </motion.div>
                  ))}
                </div>
                
                {tagTotalPages > 1 && (
                  <Pagination
                    currentPage={tagCurrentPage}
                    totalPages={tagTotalPages}
                    onPageChange={handleTagPageChange}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* Only show other sections when tag section is not active */}
        {!showTagSection && (
          <>
            {/* Trending Section */}
            <section className="mb-24">
              <SectionHeader title="Trending Anime" icon={TrendingIcon} onViewAll={handleViewAllTrending} />
              
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <LoadingSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                  {trendingVideos.map((video, index) => (
                    <motion.div
                      key={`trending-${video.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <VideoCard video={video} onClick={() => handleVideoClick(video.slug)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* New Releases Section */}
            <section className="mb-16">
              <SectionHeader 
                title="New Releases" 
                icon={NewIcon} 
                onViewAll={handleViewAllNew}
              />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {newVideos.map((video, index) => (
                  <motion.div
                    key={`new-${video.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.02 }}
                  >
                    <VideoCard video={video} onClick={() => handleVideoClick(video.slug)} isNew />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Random Tag Section */}
            {randomTag && randomTagVideos.length > 0 && (
              <section>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-3xl font-bold text-white mb-8 flex items-center gap-3"
                >
                  <span className="text-green-400">
                    <DiscoverIcon />
                  </span> 
                  Discover: 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                    {randomTag}
                  </span>
                </motion.h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                  {randomTagVideos.map((video, index) => (
                    <motion.div
                      key={`tag-${video.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.03 }}
                    >
                      <VideoCard video={video} onClick={() => handleVideoClick(video.slug)} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Enhanced VideoCard with better mobile optimization
function VideoCard({ video, onClick, isNew = false }: { video: Video; onClick: () => void; isNew?: boolean }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const rating = calculateRating(video.views);
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group relative"
    >
      <div 
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg hover:shadow-pink-500/20 transition-all duration-500"
        style={{ aspectRatio: '2/3' }}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-800 to-gray-700"></div>
        )}
        
        <img
          src={video.cover_url || video.poster_url}
          alt={video.name}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileHover={{ y: 0, opacity: 1 }}
              className="flex items-center justify-center mb-2"
            >
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transform">
                <span className="text-lg">▶</span> Play Now
              </span>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute top-6 right-6 flex gap-3">
          {isNew && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
              NEW
            </span>
          )}
        </div>
        
        <div className="absolute top-2 right-2">
          <span className="bg-black/40 backdrop-blur-sm text-gray-300 px-2 py-1 rounded-md text-xs font-medium">
            HD
          </span>
        </div>
      </div>
      
      <div className="mt-2 px-1">
        <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 transition-all">
          {video.name}
        </h3>
        <div className="flex items-center justify-between mt-1 text-xs sm:text-sm">
          <span className="text-yellow-400 flex items-center gap-0.5">
            <span>★</span>
            {rating.toFixed(1)}
          </span>
          <span className="text-gray-400">{(video.views / 1000).toFixed(1)}K</span>
        </div>
        <p className="text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mt-1 font-bold">
          {video.brand}
        </p>
      </div>
    </motion.div>
  );
}