import { NextRequest, NextResponse } from 'next/server';

// Тимчасове сховище для коротких посилань
const linkStorage = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { longUrl } = await request.json();

    if (!longUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Генеруємо короткий ID
    const id = Math.random().toString(36).substring(2, 8);

    // Зберігаємо довгий URL
    linkStorage.set(id, longUrl);

    const shortUrl = `${new URL(request.url).origin}/s/${id}`;
    return NextResponse.json({ shortUrl });

  } catch (error) {
    console.error('Create short link error:', error);
    return NextResponse.json({ error: 'Failed to create short link' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const longUrl = linkStorage.get(id);

    if (!longUrl) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json({ longUrl });

  } catch (error) {
    console.error('Get link error:', error);
    return NextResponse.json({ error: 'Failed to get link' }, { status: 500 });
  }
}
