// Пірографія - ефект випалювання по дереву
export function applyPyrography(
  canvas: HTMLCanvasElement,
  frameType: 'wood' | 'gold' | 'silver'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Edge detection (Sobel operator)
  const edges: number[][] = [];
  for (let y = 1; y < h - 1; y++) {
    edges[y] = [];
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (dx !== 0) gx += g * dx;
          if (dy !== 0) gy += g * dy;
        }
      }
      edges[y][x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  if (frameType === 'wood') {
    // ПІРОГРАФІЯ - випалювання по дереву
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Конвертуємо в grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Отримуємо силу краю
        const edge = edges[y]?.[x] || 0;

        // Пірографія: темні лінії на світлому дереві
        // Чим сильніший край, тим темніше випалювання
        const burnIntensity = Math.min(1, edge / 80);

        // Базовий колір дерева (світлий)
        const woodBase = 220;

        // Випалена частина (темна)
        const burnedValue = gray * 0.4; // Темні тони

        // Змішуємо: де є краї - темно, де немає - світло
        const finalValue = woodBase * (1 - burnIntensity) + burnedValue * burnIntensity;

        // Додаємо текстуру дерева (теплі тони)
        data[idx] = Math.min(255, finalValue * 1.1 + 20);     // Червоний
        data[idx + 1] = Math.min(255, finalValue * 0.95 + 10); // Зелений
        data[idx + 2] = Math.min(255, finalValue * 0.7);       // Синій

        // Додаємо шум для текстури дерева
        const noise = (Math.random() - 0.5) * 15;
        data[idx] += noise;
        data[idx + 1] += noise;
        data[idx + 2] += noise;
      }
    }
  } else {
    // Лазерне гравірування на металі
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        const edge = edges[y]?.[x] || 0;
        const engrave = Math.min(255, gray + edge * 0.5);

        if (frameType === 'gold') {
          data[idx] = Math.min(255, engrave * 1.1);
          data[idx + 1] = Math.min(255, engrave * 0.95);
          data[idx + 2] = Math.min(255, engrave * 0.7);
        } else {
          data[idx] = engrave;
          data[idx + 1] = engrave;
          data[idx + 2] = Math.min(255, engrave * 1.05);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Анімація тління полотна
export function burnCanvasWithSmoldering(
  canvas: HTMLCanvasElement,
  photoImg: HTMLImageElement,
  frameType: 'wood' | 'gold' | 'silver',
  duration: number,
  onComplete: () => void
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Малюємо червоне полотно
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#8b0000');
  grd.addColorStop(0.5, '#a52a2a');
  grd.addColorStop(1, '#6b0000');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  const startTime = Date.now();
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    type: 'fire' | 'smoke' | 'ember';
  }> = [];

  // Маска тління (0 = полотно, 1 = згоріло)
  const smolderMask: number[][] = [];
  for (let i = 0; i < w; i++) {
    smolderMask[i] = [];
    for (let j = 0; j < h; j++) {
      smolderMask[i][j] = 0;
    }
  }

  // Стартові точки тління (знизу)
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(h * 0.95);
    smolderMask[x][y] = 1;
  }

  function animate() {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(1, elapsed / duration);

    if (progress >= 1) {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(photoImg, 0, 0, w, h);
      applyPyrography(canvas, frameType);
      onComplete();
      return;
    }

    // Поширення тління
    const newMask: number[][] = [];
    for (let i = 0; i < w; i++) {
      newMask[i] = [...smolderMask[i]];
    }

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        if (smolderMask[i][j] > 0.5) {
          // Тління поширюється вгору та в боки
          const dirs = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
          ];

          for (const [dx, dy] of dirs) {
            const ni = i + dx;
            const nj = j + dy;
            if (ni >= 0 && ni < w && nj >= 0 && nj < h) {
              // Більша ймовірність поширення вгору
              const spreadChance = dy < 0 ? 0.4 : 0.2;
              if (Math.random() < spreadChance) {
                newMask[ni][nj] = Math.max(newMask[ni][nj], smolderMask[i][j] * 0.98);
              }
            }
          }

          // Створення частинок
          if (Math.random() < 0.15) {
            // Вогонь
            particles.push({
              x: i,
              y: j,
              vx: (Math.random() - 0.5) * 1,
              vy: -Math.random() * 3 - 1,
              life: 1,
              size: Math.random() * 3 + 2,
              type: 'fire'
            });
          }

          if (Math.random() < 0.1) {
            // Дим
            particles.push({
              x: i,
              y: j,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2 - 0.5,
              life: 1,
              size: Math.random() * 8 + 4,
              type: 'smoke'
            });
          }

          if (Math.random() < 0.05) {
            // Іскри
            particles.push({
              x: i,
              y: j,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 5 - 2,
              life: 1,
              size: Math.random() * 2 + 1,
              type: 'ember'
            });
          }
        }
      }
    }

    smolderMask.splice(0, smolderMask.length, ...newMask);

    // Малювання
    ctx.clearRect(0, 0, w, h);

    // Фото під полотном
    ctx.globalAlpha = 0.2;
    ctx.drawImage(photoImg, 0, 0, w, h);
    ctx.globalAlpha = 1;

    // Полотно з тлінням
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const idx = (j * w + i) * 4;
        const smolder = smolderMask[i][j];

        if (smolder < 0.3) {
          // Червоне полотно
          const noise = (Math.random() - 0.5) * 20;
          data[idx] = 139 + noise;
          data[idx + 1] = 0 + noise;
          data[idx + 2] = 0 + noise;
          data[idx + 3] = 255;
        } else if (smolder < 0.7) {
          // Тління (червоний жар)
          const glow = smolder * 255;
          data[idx] = Math.min(255, glow * 1.5);
          data[idx + 1] = Math.min(255, glow * 0.3);
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        } else {
          // Вугілля (чорне)
          const ash = (1 - smolder) * 50;
          data[idx] = ash;
          data[idx + 1] = ash;
          data[idx + 2] = ash;
          data[idx + 3] = Math.max(0, 255 * (1 - smolder));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Частинки
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // Гравітація
      p.life -= p.type === 'smoke' ? 0.01 : 0.02;

      if (p.life <= 0 || p.y < -50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;

      if (p.type === 'fire') {
        const hue = 20 + Math.random() * 20;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff6600';
      } else if (p.type === 'smoke') {
        ctx.fillStyle = `rgba(100, 100, 100, ${p.life * 0.5})`;
      } else {
        ctx.fillStyle = '#ffaa00';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff6600';
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();
}
