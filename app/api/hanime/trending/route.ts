// app/api/hanime/trending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const time = searchParams.get('time') || 'week';
    const page = parseInt(searchParams.get('page') || '0');
    
    const data = await api.getTrending(time, page);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Trending API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending', details: error.message },
      { status: 500 }
    );
  }
}