// app/api/hanime/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    console.log('Proxying URL:', url);
    const decodedUrl = decodeURIComponent(url);
    
    // Headers to make request look legitimate
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://hanime.tv/',
      'Origin': 'https://hanime.tv',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };
    
    // Handle range requests for video seeking
    const range = request.headers.get('range');
    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(decodedUrl, { 
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`Proxy failed: ${response.status} for URL: ${decodedUrl}`);
      return NextResponse.json(
        { error: `Proxy failed: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Handle m3u8 playlists - need to rewrite URLs
    if (contentType.includes('mpegurl') || decodedUrl.includes('.m3u8')) {
      const text = await response.text();
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/'));
      
      // Rewrite URLs in the playlist
      const rewrittenText = text.split('\n').map(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || line.trim() === '') {
          return line;
        }
        
        // Handle absolute URLs
        if (line.startsWith('http')) {
          return `/api/hanime/proxy?url=${encodeURIComponent(line)}`;
        }
        
        // Handle relative URLs
        if (line.endsWith('.ts') || line.endsWith('.m3u8')) {
          const absoluteUrl = new URL(line, baseUrl).toString();
          return `/api/hanime/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        }
        
        return line;
      }).join('\n');

      return new NextResponse(rewrittenText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For video segments (.ts files) and other content, stream directly
    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    });

    // Pass through important headers
    const headersToPass = [
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ];
    
    headersToPass.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Stream the response body
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy content', details: error.message },
      { status: 500 }
    );
  }
}