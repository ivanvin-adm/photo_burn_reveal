// Ефект олівцевого малюнка
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

  // Покращений Sobel edge detection з більшою чутливістю
  const edges: number[][] = [];
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  for (let y = 1; y < h - 1; y++) {
    edges[y] = [];
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          gx += gray * sobelX[dy + 1][dx + 1];
          gy += gray * sobelY[dy + 1][dx + 1];
        }
      }

      edges[y][x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // ОЛІВЦЕВИЙ МАЛЮНОК
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

      // Інвертуємо: темні краї = олівцеві лінії
      const edgeIntensity = Math.min(255, edge * 1.5);

      // Базовий білий папір
      const paperWhite = 250;

      // Олівцеві штрихи (темні лінії на світлому)
      const pencilValue = paperWhite - (255 - gray) * 0.6 - edgeIntensity * 0.8;

      // Легкий сіруватий відтінок паперу
      const finalValue = Math.max(20, Math.min(255, pencilValue));

      // Сіро-блакитний відтінок олівця
      data[idx] = finalValue * 0.95;      // Червоний
      data[idx + 1] = finalValue * 0.97;  // Зелений
      data[idx + 2] = finalValue;         // Синій

      // Текстура паперу (дуже легкий шум)
      const noise = (Math.random() - 0.5) * 5;
      data[idx] += noise;
      data[idx + 1] += noise;
      data[idx + 2] += noise;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Анімація горіння полотна знизу вверх
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

  // Лінія вогню (починається знизу)
  let fireLineY = h;

  function animate() {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(1, elapsed / duration);

    // Вогонь піднімається знизу вверх
    fireLineY = h - (h * progress);

    if (progress >= 1) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(photoImg, 0, 0, w, h);
      applyPyrography(canvas, frameType);
      onComplete();
      return;
    }

    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    // Малюємо фото (поступово з'являється)
    ctx.globalAlpha = progress * 0.3;
    ctx.drawImage(photoImg, 0, 0, w, h);
    ctx.globalAlpha = 1;

    // Малюємо полотно (зверху до лінії вогню)
    if (fireLineY > 0) {
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, fireLineY);
    }

    // Лінія вогню (товста смуга)
    const fireHeight = 40;
    const fireStart = Math.max(0, fireLineY - fireHeight);
    const fireEnd = Math.min(h, fireLineY + fireHeight);

    for (let y = fireStart; y < fireEnd; y++) {
      const distFromCenter = Math.abs(y - fireLineY);
      const intensity = 1 - (distFromCenter / fireHeight);

      if (intensity > 0) {
        const gradient = ctx.createLinearGradient(0, y, w, y);

        if (distFromCenter < fireHeight / 3) {
          // Яскравий центр вогню
          gradient.addColorStop(0, `rgba(255, 255, 200, ${intensity})`);
          gradient.addColorStop(0.5, `rgba(255, 150, 0, ${intensity})`);
          gradient.addColorStop(1, `rgba(255, 255, 200, ${intensity})`);
        } else {
          // Червоно-помаранчеві краї
          gradient.addColorStop(0, `rgba(255, 100, 0, ${intensity * 0.8})`);
          gradient.addColorStop(0.5, `rgba(200, 50, 0, ${intensity * 0.8})`);
          gradient.addColorStop(1, `rgba(255, 100, 0, ${intensity * 0.8})`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, y, w, 1);
      }
    }

    // Створення частинок вздовж лінії вогню
    if (Math.random() < 0.3) {
      const x = Math.random() * w;

      // Полум'я
      particles.push({
        x,
        y: fireLineY,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 4 - 2,
        life: 1,
        size: Math.random() * 4 + 3,
        type: 'fire'
      });
    }

    if (Math.random() < 0.2) {
      // Дим
      particles.push({
        x: Math.random() * w,
        y: fireLineY,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        life: 1,
        size: Math.random() * 10 + 6,
        type: 'smoke'
      });
    }

    if (Math.random() < 0.15) {
      // Іскри
      particles.push({
        x: Math.random() * w,
        y: fireLineY,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 3,
        life: 1,
        size: Math.random() * 2 + 1,
        type: 'ember'
      });
    }

    // Оновлення та малювання частинок
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Гравітація
      p.life -= p.type === 'smoke' ? 0.008 : 0.015;

      if (p.life <= 0 || p.y < -50 || p.y > h + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;

      if (p.type === 'fire') {
        const hue = 20 + Math.random() * 30;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff6600';
      } else if (p.type === 'smoke') {
        ctx.fillStyle = `rgba(80, 80, 80, ${p.life * 0.4})`;
      } else {
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 8;
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
