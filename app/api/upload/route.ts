import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Генерація короткого ID (6 символів)
function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, frame, effect, message } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    // Генеруємо унікальний ID
    let shortId = generateShortId();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // Створюємо папку якщо не існує
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Перевіряємо унікальність
    while (existsSync(path.join(uploadsDir, `${shortId}.json`))) {
      shortId = generateShortId();
    }

    // Зберігаємо дані
    const data = {
      imageData,
      frame: frame || 'wood',
      effect: effect || 'normal',
      message: message || '',
      createdAt: new Date().toISOString()
    };

    await writeFile(
      path.join(uploadsDir, `${shortId}.json`),
      JSON.stringify(data)
    );

    // Повертаємо короткий URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/v/${shortId}`;

    return NextResponse.json({
      success: true,
      shortUrl,
      id: shortId
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Failed to save image'
    }, { status: 500 });
  }
}
