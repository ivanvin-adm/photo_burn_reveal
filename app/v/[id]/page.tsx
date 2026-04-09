'use client';

import { useState, useEffect, useRef } from 'react';
import { burnCanvasWithSmoldering } from '@/lib/pyrography';

export default function ViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [count, setCount] = useState(3);
  const [burning, setBurning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;

        const response = await fetch(`/api/save?id=${id}`);
        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const { data: savedData } = await response.json();
        const parsed = JSON.parse(savedData);

        const [duration, effect, frame] = parsed.meta.split(':');
        const result = {
          imageUrl: parsed.image,
          duration: parseInt(duration, 10),
          effect,
          frame,
          message: parsed.message ? decodeURIComponent(parsed.message) : ''
        };

        setData(result);
        setLoading(false);
      } catch (e) {
        console.error('Load error:', e);
        setError(true);
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = Math.min(960 / img.width, 960 / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grd.addColorStop(0, '#8b0000');
      grd.addColorStop(0.5, '#a52a2a');
      grd.addColorStop(1, '#6b0000');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setShowCountdown(true);
      let counter = 3;
      const interval = setInterval(() => {
        counter--;
        setCount(counter);
        if (counter === 0) {
          clearInterval(interval);
          setShowCountdown(false);
        }
      }, 1000);
    };
    img.src = data.imageUrl;
  }, [data]);

  const handleFire = () => {
    if (!canvasRef.current || !data) return;

    setBurning(true);

    const img = new Image();
    img.onload = () => {
      const duration = data.effect === 'slow' ? 10 : data.effect === 'fast' ? 3 : 6;

      burnCanvasWithSmoldering(
        canvasRef.current!,
        img,
        data.frame || 'wood',
        duration,
        () => {
          setBurning(false);
          setRevealed(true);
        }
      );
    };
    img.src = data.imageUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Готуємо сюрприз...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl text-[#ff6b1a]">⚠️</div>
          <p className="text-lg">Посилання пошкоджене або фото не знайдено</p>
          <a href="/" className="inline-block bg-[#1a1410] border border-[#2d2419] px-6 py-3 rounded-lg hover:border-[#ff6b1a] transition-all">
            🏠 На головну
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">

        <header className="text-center">
          <h1 className="text-4xl font-black tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Таємне фото
          </h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            Хтось надіслав вам фото під полотном. Підпаліть його!
          </p>
        </header>

        {data.message && (
          <div className="bg-[#ff6b1a]/10 border border-[#ff6b1a] rounded-lg p-4 text-center">
            <p className="text-base font-semibold">{data.message}</p>
          </div>
        )}

        <div className="text-center space-y-6">
          <div className={`inline-block p-6 rounded shadow-2xl ${
            data.frame === 'gold'
              ? 'bg-gradient-to-br from-[#d4af37] via-[#b8941f] to-[#8b7220]'
              : data.frame === 'silver'
              ? 'bg-gradient-to-br from-[#c0c0c0] via-[#a8a8a8] to-[#808080]'
              : 'bg-gradient-to-br from-[#5c3d22] via-[#3d2b1a] to-[#1a0f08]'
          }`}>
            <canvas ref={canvasRef} className="max-w-full h-auto"></canvas>
          </div>

          {showCountdown && (
            <div className="text-6xl font-black text-[#ff6b1a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {count}
            </div>
          )}

          {!showCountdown && !burning && !revealed && (
            <button
              onClick={handleFire}
              className="bg-gradient-to-b from-[#ff5722] to-[#bf360c] text-white px-16 py-5 rounded-lg font-black text-2xl tracking-widest uppercase shadow-lg hover:shadow-2xl transition-all animate-pulse"
            >
              🔥 Fire
            </button>
          )}

          {revealed && (
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'photo_burn_reveal.png';
                  link.href = canvasRef.current!.toDataURL('image/png');
                  link.click();
                }}
                className="bg-[#1a1410] border border-[#2d2419] px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-[#ff6b1a] transition-all"
              >
                💾 Зберегти
              </button>
              <a
                href="/"
                className="bg-[#1a1410] border border-[#2d2419] px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-[#ff6b1a] transition-all"
              >
                ➕ Створити своє
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
