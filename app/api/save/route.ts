import { NextRequest, NextResponse } from 'next/server';

// Тимчасове сховище в пам'яті (для production треба використати БД)
const storage = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    // Генеруємо короткий ID (6 символів)
    const id = Math.random().toString(36).substring(2, 8);

    // Зберігаємо дані
    storage.set(id, data);

    return NextResponse.json({ id });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const data = storage.get(id);

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Get error:', error);
    return NextResponse.json({ error: 'Failed to get data' }, { status: 500 });
  }
}
