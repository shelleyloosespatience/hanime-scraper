// app/api/hanime/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET() {
  try {
    const tags = await api.getTags();
    
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('[Tags API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: error.message },
      { status: 500 }
    );
  }
}