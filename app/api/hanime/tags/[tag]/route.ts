// app/api/hanime/tags/[tag]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params; // ← And here!
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    
    const data = await api.getVideosByTag(tag, page);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Tag Videos API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag videos', details: error.message },
      { status: 500 }
    );
  }
}