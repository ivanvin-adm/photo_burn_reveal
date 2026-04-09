import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || !/^[a-z0-9]{6}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', `${id}.json`);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = await readFile(filePath, 'utf-8');
    const photoData = JSON.parse(data);

    return NextResponse.json({
      success: true,
      data: photoData
    });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({
      error: 'Failed to load image'
    }, { status: 500 });
  }
}
