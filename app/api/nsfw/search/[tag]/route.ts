// app/api/nsfw/search/[tag]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Global cache objects (shared across all route files)
const nsfwTokenCache = { token: null as string | null, expires: 0 };
const nsfwContentCache = new Map();

async function getNSFWAuthToken() {
  if (nsfwTokenCache.token && Date.now() < nsfwTokenCache.expires) {
    return nsfwTokenCache.token;
  }
  try {
    const res = await axios.get('https://api.redgifs.com/v2/auth/temporary', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    nsfwTokenCache.token = res.data.token;
    nsfwTokenCache.expires = Date.now() + (23 * 60 * 60 * 1000); // 23 hours to be safe
    return nsfwTokenCache.token;
  } catch (error) {
    console.error('NSFW Auth error:', error);
    return null;
  }
}

function cacheContent(key: string, data: any, ttl = 5 * 60 * 1000) {
  nsfwContentCache.set(key, { data, expires: Date.now() + ttl });
  // Clean up expired entries
  setTimeout(() => {
    const entry = nsfwContentCache.get(key);
    if (entry && Date.now() > entry.expires) {
      nsfwContentCache.delete(key);
    }
  }, ttl);
}

function getCachedContent(key: string) {
  const entry = nsfwContentCache.get(key);
  if (entry && Date.now() < entry.expires) {
    return entry.data;
  }
  nsfwContentCache.delete(key);
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const { searchParams } = new URL(request.url);
    const count = Math.min(parseInt(searchParams.get('count') || '20'), 80); // RedGifs limit
    const order = searchParams.get('order') || 'trending';
    const offset = Math.min(parseInt(searchParams.get('offset') || '0'), 1000);
    
    const cacheKey = `nsfw_search_${tag}_${count}_${order}_${offset}`;
    const cached = getCachedContent(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const token = await getNSFWAuthToken();
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed',
        videos: []
      }, { status: 200 }); // Return 200 with empty data instead of 500
    }

    const response = await axios.get('https://api.redgifs.com/v2/gifs/search', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      params: { 
        search_text: decodeURIComponent(tag), 
        count, 
        order,
        page: Math.floor(offset / count) + 1
      },
      timeout: 15000
    });

    const gifs = response.data?.gifs || [];
    const data = {
      success: true,
      count: gifs.length,
      videos: gifs.map((gif: any) => ({
        id: gif.id,
        title: gif.title || '',
        urls: {
          hd: gif.urls?.hd,
          sd: gif.urls?.sd || gif.urls?.mobile
        },
        tags: gif.tags || [],
        duration: gif.duration || 0,
        thumbnail: gif.urls?.thumbnail || gif.urls?.poster
      })),
      nextPage: gifs.length >= count ? `${offset + count}` : null
    };

    cacheContent(cacheKey, data, 3 * 60 * 1000); // 3 minutes cache
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('NSFW Search error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Return a valid response instead of throwing
    return NextResponse.json({ 
      success: false, 
      error: 'Search temporarily unavailable',
      videos: [],
      count: 0
    }, { status: 200 });
  }
}
