// app/api/hanime/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HanimeAPI } from '@/app/lib/hanime-api';

const api = new HanimeAPI();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const tags = await api.getTags();
    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      const suggestions = tags.filter((tag: any) => tag.name.toLowerCase().includes(q));
      return NextResponse.json({ tags: suggestions });
    }
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('[Tags API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: error.message },
      { status: 500 }
    );
  }
}