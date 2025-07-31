import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
const nsfwTokenCache = { token: null as string | null, expires: 0 };
const nsfwContentCache = new Map();
async function getNSFWAuthToken() {
  if (nsfwTokenCache.token && Date.now() < nsfwTokenCache.expires) {
    return nsfwTokenCache.token;
  }
  try {
    const res = await axios.get('https://api.redgifs.com/v2/auth/temporary');
    nsfwTokenCache.token = res.data.token;
    nsfwTokenCache.expires = Date.now() + (24 * 60 * 60 * 1000);
    return nsfwTokenCache.token;
  } catch (error) {
    console.error('NSFW Auth error:', error);
    return null;
  }
}

function cacheContent(key: string, data: any, ttl = 5 * 60 * 1000) {
  nsfwContentCache.set(key, data);
  setTimeout(() => nsfwContentCache.delete(key), ttl);
}
function getCachedContent(key: string) {
  return nsfwContentCache.get(key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  const { query } = await params;
  const { searchParams } = new URL(request.url);
  let count = parseInt(searchParams.get('count') || '20');
  if (isNaN(count) || count < 20) count = 20;
  if (count > 100) count = 100;
  console.log('[NSFW SUGGEST] Incoming:', { query, count });

  // If query is empty or very short, return trending tags
  if (!query || query.trim().length < 2) {
    const cacheKey = `nsfw_trending_tags_${count}`;
    if (nsfwContentCache.has(cacheKey)) {
      console.log('[NSFW SUGGEST] Cache hit for trending:', cacheKey);
      return NextResponse.json(nsfwContentCache.get(cacheKey));
    }
    const token = await getNSFWAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
    try {
      console.log('[NSFW SUGGEST] Fetching trending tags from RedGifs', { count });
      const response = await axios.get('https://api.redgifs.com/v2/tags/trending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          count: count
        },
        validateStatus: () => true
      });
      console.log('[NSFW SUGGEST] RedGifs trending response:', { status: response.status, dataPreview: JSON.stringify(response.data).slice(0, 200) });
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from RedGifs API (not JSON)');
      }
      if (response.status !== 200) {
        throw new Error(response.data?.error?.message || 'RedGifs API error');
      }
      
      // Handle both array and object responses
      let suggestions = [];
      if (Array.isArray(response.data)) {
        suggestions = response.data.map((t: any) => typeof t === 'string' ? t : t.name || t);
      } else if (response.data.tags && Array.isArray(response.data.tags)) {
        suggestions = response.data.tags.map((t: any) => typeof t === 'string' ? t : t.name || t);
      }
      
      const data = {
        success: true,
        suggestions: suggestions
      };
      cacheContent(cacheKey, data, 10 * 60 * 1000);
      return NextResponse.json(data);
    } catch (error: any) {
      console.error('NSFW Trending tags error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        query,
        count
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Trending tags failed',
          details: error.response?.data || error.message
        },
        { status: error.response?.status || 500 }
      );
    }
  }

  // Otherwise, do suggestions as before
  const cacheKey = `nsfw_suggest_${query}_${count}`;
  if (nsfwContentCache.has(cacheKey)) {
    console.log('[NSFW SUGGEST] Cache hit for suggest:', cacheKey);
    return NextResponse.json(nsfwContentCache.get(cacheKey));
  }

  const token = await getNSFWAuthToken();
  if (!token) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }

  try {
    console.log('[NSFW SUGGEST] Fetching suggestions from RedGifs', { query, count });
    const response = await axios.get('https://api.redgifs.com/v2/tags/suggest', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        query: query.trim(),
        order: 'trending',
        count: count
      },
      validateStatus: () => true
    });
    console.log('[NSFW SUGGEST] RedGifs suggest response:', { status: response.status, dataPreview: JSON.stringify(response.data).slice(0, 200) });

    if (!response.data) {
      throw new Error('Invalid response from RedGifs API (no data)');
    }
    if (response.status === 404 && response.data?.error?.code === 'NoMatches') {
      const data = { success: true, suggestions: [] };
      cacheContent(cacheKey, data, 10 * 60 * 1000);
      return NextResponse.json(data);
    }
    if (response.status === 400 && response.data?.error?.code === 'BadTags') {
      const data = { success: true, suggestions: [] };
      cacheContent(cacheKey, data, 10 * 60 * 1000);
      return NextResponse.json(data);
    }
    if (response.status !== 200) {
      throw new Error(response.data?.error?.message || 'RedGifs API error');
    }

    // Handle both array and object responses
    let suggestions = [];
    if (Array.isArray(response.data)) {
      // Direct array response
      suggestions = response.data.map((t: any) => typeof t === 'string' ? t : t.name || t);
    } else if (response.data.tags && Array.isArray(response.data.tags)) {
      // Object with tags property
      suggestions = response.data.tags.map((t: any) => typeof t === 'string' ? t : t.name || t);
    }

    const data = {
      success: true,
      suggestions: suggestions
    };
    cacheContent(cacheKey, data, 10 * 60 * 1000);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.response?.status === 404 && error.response?.data?.error?.code === 'NoMatches') {
      const data = { success: true, suggestions: [] };
      cacheContent(cacheKey, data, 10 * 60 * 1000);
      return NextResponse.json(data);
    }
    if (error.response?.status === 400 && error.response?.data?.error?.code === 'BadTags') {
      const data = { success: true, suggestions: [] };
      cacheContent(cacheKey, data, 10 * 60 * 1000);
      return NextResponse.json(data);
    }
    console.error('NSFW Tag suggestion error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      query,
      count
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Suggestions failed',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}