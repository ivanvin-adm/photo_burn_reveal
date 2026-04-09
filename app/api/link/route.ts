import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { dataHash } = await request.json();

    if (!dataHash) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    // Генеруємо короткий ID
    const shortId = Math.random().toString(36).substring(2, 8);

    // Спробуємо зберегти в Vercel KV
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`link:${shortId}`, dataHash, { ex: 60 * 60 * 24 * 30 });
      return NextResponse.json({ shortId });
    } catch (kvError) {
      console.error('KV error:', kvError);
      // Fallback: повертаємо dataHash як ID (довший URL)
      return NextResponse.json({ shortId: dataHash });
    }

  } catch (error) {
    console.error('Save link error:', error);
    return NextResponse.json({ error: 'Failed to save link' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Якщо ID виглядає як dataHash (довгий), повертаємо його
    if (id.length > 20) {
      return NextResponse.json({ dataHash: id });
    }

    // Інакше шукаємо в KV
    try {
      const { kv } = await import('@vercel/kv');
      const dataHash = await kv.get(`link:${id}`);

      if (!dataHash) {
        return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
      }

      return NextResponse.json({ dataHash });
    } catch (kvError) {
      console.error('KV error:', kvError);
      return NextResponse.json({ error: 'KV not available' }, { status: 500 });
    }

  } catch (error) {
    console.error('Get link error:', error);
    return NextResponse.json({ error: 'Failed to get link' }, { status: 500 });
  }
}
