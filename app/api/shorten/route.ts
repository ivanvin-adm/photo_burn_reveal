import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Спробуємо кілька сервісів по черзі
    const services = [
      {
        name: 'TinyURL',
        fetch: () => fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
      },
      {
        name: 'is.gd',
        fetch: () => fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
      },
      {
        name: 'v.gd',
        fetch: () => fetch(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
      }
    ];

    for (const service of services) {
      try {
        const response = await service.fetch();
        if (response.ok) {
          const shortUrl = await response.text();
          if (shortUrl && !shortUrl.includes('Error')) {
            return NextResponse.json({ shortUrl });
          }
        }
      } catch (err) {
        console.log(`${service.name} failed, trying next...`);
        continue;
      }
    }

    // Якщо всі сервіси не спрацювали, повертаємо оригінальний URL
    return NextResponse.json({ shortUrl: url });

  } catch (error) {
    console.error('Shorten error:', error);
    return NextResponse.json({ error: 'Failed to shorten URL' }, { status: 500 });
  }
}
