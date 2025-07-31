// app/api/hanime/streams/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params; // ← Await here too!
    const streams = await api.getVideoStreams(slug);
    
    return NextResponse.json({ streams });
  } catch (error: any) {
    console.error('[Streams API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streams', details: error.message },
      { status: 500 }
    );
  }
}