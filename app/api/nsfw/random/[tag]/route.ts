import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Reuse the same cache and auth functions
const nsfwTokenCache = { token: null as string | null, expires: 0 };

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {  
  const { tag } = await params; // Await params
  
  try {
    const token = await getNSFWAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const response = await axios.get('https://api.redgifs.com/v2/gifs/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { search_text: tag, count: 100, order: 'trending' }
    });

    const videos = response.data.gifs || [];
    if (videos.length === 0) {
      return NextResponse.json({ success: false, error: 'No content found' }, { status: 404 });
    }

    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    return NextResponse.json({ 
      success: true, 
      video: {
        id: randomVideo.id,
        urls: randomVideo.urls,
        tags: randomVideo.tags,
        duration: randomVideo.duration,
        dimensions: { width: randomVideo.width, height: randomVideo.height }
      }
    });
  } catch (error) {
    console.error('NSFW Random error:', error);
    return NextResponse.json({ success: false, error: 'Random fetch failed' }, { status: 500 });
  }
}