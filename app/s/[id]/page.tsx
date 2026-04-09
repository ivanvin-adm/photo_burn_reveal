'use client';

import { useState, useEffect } from 'react';

export default function ShortLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [longUrl, setLongUrl] = useState('');

  useEffect(() => {
    async function loadLink() {
      try {
        const { id } = await params;

        // Отримуємо dataHash з API
        const response = await fetch(`/api/link?id=${id}`);
        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const { dataHash } = await response.json();

        // Створюємо повний URL
        const fullUrl = `${window.location.origin}/v#${dataHash}`;
        setLongUrl(fullUrl);
        setLoading(false);
      } catch (e) {
        console.error('Load link error:', e);
        setError(true);
        setLoading(false);
      }
    }

    loadLink();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl text-[#ff6b1a]">⚠️</div>
          <p className="text-lg">Посилання не знайдено або застаріло</p>
          <a href="/" className="inline-block bg-[#1a1410] border border-[#2d2419] px-6 py-3 rounded-lg hover:border-[#ff6b1a] transition-all">
            🏠 На головну
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center space-y-8">

        <header>
          <h1 className="text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Таємне фото
          </h1>
          <p className="text-lg text-[#6b5a4a]">
            Хтось надіслав вам фото під полотном
          </p>
        </header>

        <div className="bg-[#1a1410] border border-[#2d2419] rounded-2xl p-12 space-y-6">
          <div className="text-6xl">🎁</div>
          <p className="text-xl">
            Натисніть кнопку, щоб переглянути сюрприз
          </p>

          <a
            href={longUrl}
            className="inline-block bg-gradient-to-b from-[#ff5722] to-[#bf360c] text-white px-16 py-5 rounded-lg font-black text-2xl tracking-widest uppercase shadow-lg hover:shadow-2xl transition-all"
          >
            🔥 Переглянути
          </a>
        </div>

        <p className="text-sm text-[#6b5a4a]">
          Підготуйтеся до незабутнього моменту!
        </p>

      </div>
    </div>
  );
}
