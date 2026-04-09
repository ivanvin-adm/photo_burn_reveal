import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { dataHash } = await request.json();

    if (!dataHash) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    // Генеруємо короткий ID
    const shortId = Math.random().toString(36).substring(2, 8);

    // Зберігаємо в Supabase
    const { error } = await supabase
      .from('links')
      .insert({
        id: shortId,
        data_hash: dataHash,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save link' }, { status: 500 });
    }

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

    // Отримуємо з Supabase
    const { data, error } = await supabase
      .from('links')
      .select('data_hash')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Supabase select error:', error);
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ dataHash: data.data_hash });

  } catch (error) {
    console.error('Get link error:', error);
    return NextResponse.json({ error: 'Failed to get link' }, { status: 500 });
  }
}
