// app/api/hanime/video/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params; // ← Await the params!
    const data = await api.getVideo(slug);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Video API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video', details: error.message },
      { status: 500 }
    );
  }
}