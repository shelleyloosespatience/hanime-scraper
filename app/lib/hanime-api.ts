// app/lib/hanime-api.ts
import crypto from 'crypto';

export class HanimeAPI {
  private readonly BASE_URL = "https://hanime.tv";
  private readonly SEARCH_URL = "https://search.htv-services.com";
  private readonly API_URL = "https://hanime.tv/api/v8";

  private getHeaders() {
    return {
      'X-Signature-Version': 'web2',
      'X-Signature': crypto.randomBytes(32).toString('hex'),
      'X-Time': Math.floor(Date.now() / 1000).toString(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://hanime.tv/',
    };
  }

  async getTrending(time: string = 'week', page: number = 0) {
    const url = `${this.API_URL}/browse-trending?time=${time}&page=${page}&order_by=views&ordering=desc`;
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    return {
      results: data.hentai_videos.map((video: any) => ({
        id: video.id,
        name: video.name,
        slug: video.slug,
        cover_url: video.cover_url,
        poster_url: video.poster_url,
        views: video.views,
        likes: video.likes,
        dislikes: video.dislikes,
        rating: video.rating,
        brand: video.brand,
        duration: video.duration_in_ms,
        is_censored: video.is_censored,
        created_at: video.created_at,
        tags: video.tags || []
      })),
      page,
      has_next: data.hentai_videos.length > 0
    };
  }

  async search(query: string, page: number = 0) {
    const response = await fetch(this.SEARCH_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...this.getHeaders()
      },
      body: JSON.stringify({
        blacklist: [],
        brands: [],
        order_by: "created_at_unix",
        page,
        tags: [],
        search_text: query,
        tags_mode: "AND",
      }),
    });

    if (!response.ok) throw new Error(`Search error: ${response.status}`);

    const data = await response.json();
    const results = JSON.parse(data.hits || '[]');

    return {
      results: results.map((video: any) => ({
        id: video.id,
        name: video.name,
        slug: video.slug,
        cover_url: video.cover_url,
        poster_url: video.poster_url,
        views: video.views,
        likes: video.likes,
        dislikes: video.dislikes,
        brand: video.brand,
        duration: video.duration_in_ms,
        is_censored: video.is_censored,
        tags: video.tags || []
      })),
      total: data.nbHits,
      pages: data.nbPages,
      page
    };
  }

  async getVideo(slug: string) {
    // First, get the video ID from the slug
    const videoUrl = `${this.API_URL}/video?id=${slug}`;
    const response = await fetch(videoUrl, { headers: this.getHeaders() });
    
    if (!response.ok) throw new Error(`Video error: ${response.status}`);
    
    const data = await response.json();
    const video = data.hentai_video;
    const manifest = data.videos_manifest;

    return {
      id: video.id,
      name: video.name,
      slug: video.slug,
      description: video.description,
      poster_url: video.poster_url,
      cover_url: video.cover_url,
      views: video.views,
      likes: video.likes,
      dislikes: video.dislikes,
      downloads: video.downloads,
      brand: video.brand,
      duration: video.duration_in_ms,
      is_censored: video.is_censored,
      created_at: video.created_at,
      released_at: video.released_at,
      tags: data.hentai_tags?.map((tag: any) => ({
        name: tag.text,
        id: tag.id,
        count: tag.count
      })) || [],
      streams: manifest?.servers?.[0]?.streams?.map((stream: any) => ({
        width: stream.width,
        height: stream.height,
        size_mbs: stream.filesize_mbs,
        url: stream.url,
        extension: stream.extension,
        duration_ms: stream.duration_in_ms
      })) || [],
      episodes: data.hentai_franchise_hentai_videos?.map((ep: any) => ({
        id: ep.id,
        name: ep.name,
        slug: ep.slug,
        cover_url: ep.cover_url,
        views: ep.views,
        created_at: ep.created_at
      })) || []
    };
  }

// app/lib/hanime-api.ts - Update the getVideoStreams method
async getVideoStreams(slug: string) {
  // Try the newer API endpoint first
  const url = `${this.API_URL}/video?id=${slug}`;
  
  try {
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    const manifest = data.videos_manifest;
    
    if (manifest?.servers) {
      const streams = manifest.servers
        .flatMap((server: any) => server.streams || [])
        .filter((stream: any) => stream.url)
        .map((stream: any) => ({
          id: stream.id,
          server_id: stream.server_id, 
          url: stream.url,
          width: stream.width,
          height: stream.height,
          quality: `${stream.height}p`,
          size_mbs: stream.filesize_mbs,
          duration_ms: stream.duration_in_ms,
          extension: stream.extension
        }));
      
      return streams;
    }
  } catch (error) {
    console.error('Primary streams endpoint failed:', error);
  }
  
  // Fallback to the alternative endpoint
  const fallbackUrl = `${this.BASE_URL}/rapi/v7/videos_manifests/${slug}`;
  const response = await fetch(fallbackUrl, { headers: this.getHeaders() });
  
  if (!response.ok) throw new Error(`Streams error: ${response.status}`);
  
  const json = await response.json();
  const manifest = json.videos_manifest;
  
  if (!manifest?.servers) throw new Error('No servers found');
  
  const streams = manifest.servers
    .flatMap((server: any) => server.streams || [])
    .filter((stream: any) => stream.url)
    .map((stream: any) => ({
      id: stream.id,
      server_id: stream.server_id,
      url: stream.url,
      width: stream.width,
      height: stream.height, 
      quality: `${stream.height}p`,
      size_mbs: stream.filesize_mbs,
      duration_ms: stream.duration_in_ms,
      extension: stream.extension
    }));
  
  return streams;
}

  async getTags() {
    const url = `${this.API_URL}/browse`;
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) throw new Error(`Tags error: ${response.status}`);
    
    const data = await response.json();
    return data.hentai_tags?.map((tag: any) => ({
      id: tag.id,
      name: tag.text,
      count: tag.count,
      url: `/tags/${tag.text}`
    })) || [];
  }

  async getVideosByTag(tag: string, page: number = 0) {
    const url = `${this.API_URL}/browse/hentai-tags/${encodeURIComponent(tag)}?page=${page}&order_by=views&ordering=desc`;
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) throw new Error(`Tag videos error: ${response.status}`);
    
    const data = await response.json();
    return {
      results: data.hentai_videos.map((video: any) => ({
        id: video.id,
        name: video.name,
        slug: video.slug,
        cover_url: video.cover_url,
        poster_url: video.poster_url,
        views: video.views,
        brand: video.brand,
        duration: video.duration_in_ms,
        is_censored: video.is_censored,
        tags: video.tags || []
      })),
      page,
      has_next: data.hentai_videos.length > 0
    };
  }
}

