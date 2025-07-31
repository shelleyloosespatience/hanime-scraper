// app/hanime/watch/[slug]/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Hls from 'hls.js';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [video, setVideo] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('');
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (slug) {
      loadVideo(slug);
      
      // Cleanup on unmount
      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }
  }, [slug]);

  useEffect(() => {
    if (currentStreamUrl && videoRef.current) {
      playVideo(currentStreamUrl);
    }
  }, [currentStreamUrl]);

  const loadVideo = async (videoSlug: string) => {
    setLoading(true);
    setError('');
    
    try {
      const [videoRes, streamsRes] = await Promise.all([
        fetch(`/api/hanime/video/${videoSlug}`),
        fetch(`/api/hanime/streams/${videoSlug}`)
      ]);
      
      if (!videoRes.ok || !streamsRes.ok) {
        throw new Error('Failed to load video data');
      }
      
      const videoData = await videoRes.json();
      const streamsData = await streamsRes.json();
      
      setVideo(videoData);
      setStreams(streamsData.streams || []);
      
      // Load related videos
      if (videoData.brand) {
        const relatedRes = await fetch(`/api/hanime/search?q=${encodeURIComponent(videoData.brand)}&page=0`);
        const relatedData = await relatedRes.json();
        setRelatedVideos(relatedData.results?.filter((v: any) => v.slug !== videoSlug).slice(0, 12) || []);
      }
      
      // Auto-select best quality
      if (streamsData.streams?.length > 0) {
        const bestStream = streamsData.streams.sort((a: any, b: any) => b.height - a.height)[0];
        setCurrentStreamUrl(bestStream.url);
      } else {
        setError('No streams available for this video');
      }
    } catch (error: any) {
      console.error('Error loading video:', error);
      setError(error.message || 'Failed to load video');
    }
    setLoading(false);
  };

  const playVideo = useCallback((streamUrl: string) => {
    if (!videoRef.current) return;
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    const proxiedUrl = `/api/hanime/proxy?url=${encodeURIComponent(streamUrl)}`;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 600,
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data);
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError(`Fatal error: ${data.type}`);
              hls.destroy();
              break;
          }
        }
      });
      
      hls.loadSource(proxiedUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(e => {
          console.log('Autoplay prevented:', e);
        });
      });
      
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = proxiedUrl;
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    }
  }, []);

  // Add calculateRating utility
  const calculateRating = (views: number): number => {
    if (views > 10000000) return 4.8 + Math.random() * 0.2;
    if (views > 5000000) return 4.5 + Math.random() * 0.4;
    if (views > 1000000) return 4.0 + Math.random() * 0.6;
    if (views > 500000) return 3.8 + Math.random() * 0.7;
    return 3.5 + Math.random() * 1.0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">⚠️ {error}</p>
          <button
            onClick={() => router.push('/hanime')}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-lg sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hanime')}
              className="text-white hover:text-pink-400 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Watch Hanime
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Section */}
          <div className="lg:col-span-2">
            {video && (
              <>
                <h1 className="text-3xl font-bold text-white mb-6">{video.name}</h1>
                
                <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full"
                    poster={video.cover_url || video.poster_url}
                    playsInline
                  />
                </div>

                {/* Quality Selector */}
                {streams.length > 0 && (
                  <div className="bg-gray-900/50 backdrop-blur rounded-xl p-4 mb-6">
                    <h3 className="text-white font-semibold mb-3">Quality Options:</h3>
                    <div className="flex gap-2 flex-wrap">
                      {streams.map((stream: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => playVideo(stream.url)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            currentStreamUrl === stream.url
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {stream.quality} • {Math.round(stream.size_mbs)}MB
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Info */}
                <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Views</p>
                      <p className="text-2xl font-bold text-white">{video.views?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Likes</p>
                      <p className="text-2xl font-bold text-white">{video.likes?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Rating</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        ★ {calculateRating(video.views).toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {video.description && (
                    <div className="mb-6">
                      <h4 className="text-white font-semibold mb-2">Description</h4>
                      <div 
                        className="text-gray-300 prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: video.description }}
                      />
                    </div>
                  )}

                  {video.tags?.length > 0 && (
                    <div>
                      <h4 className="text-white font-semibold mb-3">Tags</h4>
                      <div className="flex gap-2 flex-wrap">
                        {video.tags.map((tag: any) => (
                          <span 
                            key={tag.id}
                            className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300 hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {video?.episodes?.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-4">Episodes</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {video.episodes.map((ep: any) => (
                    <button
                      key={ep.id}
                      onClick={() => router.push(`/hanime/watch/${ep.slug}`)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        ep.slug === slug 
                          ? 'bg-pink-600 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="w-16 h-20 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={ep.cover_url} 
                          alt={ep.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-left line-clamp-2">{ep.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4">More from {video?.brand}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedVideos.slice(0, 6).map((related: any) => (
                    <div
                      key={related.id}
                      onClick={() => router.push(`/hanime/watch/${related.slug}`)}
                      className="cursor-pointer group"
                    >
                      <div className="aspect-[3/2] rounded-xl overflow-hidden mb-2 shadow-lg">
                        <img 
                          src={related.cover_url || related.poster_url}
                          alt={related.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-yellow-400 font-bold flex items-center gap-1 text-sm">
                          <span>★</span> {calculateRating(related.views).toFixed(1)}
                        </span>
                        <span className="text-gray-400 text-xs">{(related.views / 1000).toFixed(1)}K</span>
                      </div>
                      <p className="text-sm text-white line-clamp-2 group-hover:text-pink-400 transition-colors font-semibold">
                        {related.name}
                      </p>
                      <p className="text-xs text-purple-400 font-bold mt-0.5">{related.brand}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}