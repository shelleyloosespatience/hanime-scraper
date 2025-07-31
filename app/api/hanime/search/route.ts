// app/api/hanime/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '0');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter required' },
        { status: 400 }
      );
    }
    
    const data = await api.search(query, page);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search', details: error.message },
      { status: 500 }
    );
  }
}