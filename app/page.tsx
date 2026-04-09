'use client';

import { useState, useRef } from 'react';
import { applyPyrography } from '@/lib/pyrography';

type FrameType = 'wood' | 'gold' | 'silver';
type EffectType = 'normal' | 'slow' | 'fast';

export default function Home() {
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('wood');
  const [selectedEffect, setSelectedEffect] = useState<EffectType>('normal');
  const [message, setMessage] = useState('');
  const [enableSound, setEnableSound] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.match(/^image\//)) {
      alert('Будь ласка, виберіть зображення');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);

        const canvas = previewCanvasRef.current;
        if (canvas) {
          const scale = Math.min(640 / img.width, 640 / img.height, 1);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            applyPyrography(canvas, selectedFrame);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) return;

    setLoading(true);

    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(768 / image.width, 768 / image.height, 1);
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas error');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      // Створюємо метадані
      const duration = selectedEffect === 'slow' ? 10 : selectedEffect === 'fast' ? 3 : 6;
      const meta = `${duration}:${selectedEffect}:${selectedFrame}`;
      const messageData = message ? encodeURIComponent(message) : '';

      // Стискаємо фото через LZ-String
      const LZString = (window as any).LZString;
      if (!LZString) {
        throw new Error('LZ-String not loaded');
      }

      const compressed = LZString.compressToEncodedURIComponent(imageData);
      const metaData = messageData ? `${meta}|${messageData}` : meta;

      // Створюємо довгий URL з даними в хеші
      const longUrl = `${window.location.origin}/v#${metaData}|${compressed}`;

      // Кодуємо довгий URL в base64 для короткого посилання
      const encodedUrl = btoa(longUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const shortUrl = `${window.location.origin}/s/${encodedUrl}`;

      setShortUrl(shortUrl);

    } catch (error) {
      console.error('Generate error:', error);
      alert('Помилка створення посилання. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert('Посилання скопійовано!');
  };

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#f5e6d3] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">

        <header className="text-center">
          <h1 className="text-5xl font-black tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Photo Burn Reveal
          </h1>
          <p className="mt-2 text-sm tracking-widest uppercase text-[#6b5a4a]">
            Створіть посилання-сюрприз з фото під полотном
          </p>
        </header>

        {!image && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#2d2419] rounded-2xl p-16 text-center cursor-pointer hover:border-[#ff6b1a] transition-all"
          >
            <div className="text-5xl text-[#6b5a4a] mb-4">📤</div>
            <p className="text-lg font-semibold">Перетягніть фото сюди</p>
            <p className="text-sm text-[#6b5a4a] mt-1">або натисніть для вибору файлу</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {image && !shortUrl && (
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-semibold mb-2">Колір рамки:</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'wood', label: 'Дерево', color: '#8b5a3c' },
                  { value: 'gold', label: 'Золото', color: '#d4af37' },
                  { value: 'silver', label: 'Срібло', color: '#c0c0c0' }
                ].map((frame) => (
                  <div
                    key={frame.value}
                    onClick={() => setSelectedFrame(frame.value as FrameType)}
                    className={`bg-[#1a1410] border-2 rounded-lg p-4 cursor-pointer text-center transition-all $${
                      selectedFrame === frame.value
                        ? 'border-[#ff6b1a] bg-[#ff6b1a]/10'
                        : 'border-[#2d2419] hover:border-[#ff6b1a]'
                    }`}
                  >
                    <div className="text-2xl mb-2" style={{ color: frame.color }}>●</div>
                    <p className="text-sm">{frame.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Персональне повідомлення:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишіть щось особливе..."
                className="w-full bg-[#1a1410] border border-[#2d2419] rounded-lg p-3 text-sm outline-none focus:border-[#ff6b1a] resize-vertical min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Ефект горіння:</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'normal', label: 'Звичайне' },
                  { value: 'slow', label: 'Повільне' },
                  { value: 'fast', label: 'Швидке' }
                ].map((effect) => (
                  <div
                    key={effect.value}
                    onClick={() => setSelectedEffect(effect.value as EffectType)}
                    className={`bg-[#1a1410] border-2 rounded-lg p-4 cursor-pointer text-center transition-all ${
                      selectedEffect === effect.value
                        ? 'border-[#ff6b1a] bg-[#ff6b1a]/10'
                        : 'border-[#2d2419] hover:border-[#ff6b1a]'
                    }`}
                  >
                    <div className="text-2xl mb-2 text-[#ff6b1a]">🔥</div>
                    <p className="text-sm">{effect.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-xs uppercase tracking-widest text-[#6b5a4a]">Результат після горіння:</p>
              <div className="inline-block p-6 bg-gradient-to-br from-[#5c3d22] via-[#3d2b1a] to-[#1a0f08] rounded shadow-2xl">
                <canvas ref={previewCanvasRef} className="max-w-full h-auto"></canvas>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-gradient-to-b from-[#ff5722] to-[#bf360c] text-white px-12 py-4 rounded-lg font-black text-xl tracking-widest uppercase shadow-lg hover:shadow-2xl transition-all disabled:opacity-50"
              >
                {loading ? 'Створюємо...' : '🔗 Створити посилання'}
              </button>
            </div>
          </div>
        )}

        {shortUrl && (
          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-widest text-[#6b5a4a]">Надішліть це посилання:</p>
            <div className="bg-[#1a1410] border border-[#2d2419] rounded-lg p-4">
              <p className="font-mono text-sm break-all">{shortUrl}</p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={copyToClipboard}
                className="bg-[#1a1410] border border-[#2d2419] px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-[#ff6b1a] transition-all"
              >
                📋 Копіювати
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#1a1410] border border-[#2d2419] px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-[#ff6b1a] transition-all"
              >
                🔄 Інше фото
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
