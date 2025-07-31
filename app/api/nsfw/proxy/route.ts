import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  }

  try {
    console.log('Proxying URL:', url)
    
    // Important: Pass range headers for video streaming
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.redgifs.com/',
    }
    
    // Handle range requests for video seeking
    const range = request.headers.get('range')
    if (range) {
      headers['Range'] = range
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Create response headers
    const responseHeaders = new Headers({
      'Content-Type': response.headers.get('content-type') || 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    })

    // Pass through important headers for video streaming
    const headersToPass = ['content-length', 'content-range', 'accept-ranges']
    headersToPass.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    })

    // Return streamed response
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy video' },
      { status: 500 }
    )
  }
}