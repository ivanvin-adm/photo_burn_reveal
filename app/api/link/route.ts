import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { dataHash } = await request.json();

    if (!dataHash) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    // Генеруємо короткий ID
    const shortId = Math.random().toString(36).substring(2, 8);

    // Зберігаємо в Vercel KV (Redis) на 30 днів
    await kv.set(`link:${shortId}`, dataHash, { ex: 60 * 60 * 24 * 30 });

    return NextResponse.json({ shortId });

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

    const dataHash = await kv.get(`link:${id}`);

    if (!dataHash) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ dataHash });

  } catch (error) {
    console.error('Get link error:', error);
    return NextResponse.json({ error: 'Failed to get link' }, { status: 500 });
  }
}
