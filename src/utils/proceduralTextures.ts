import * as THREE from 'three';

/**
 * Generates a soft radial glow texture for particles, bokeh, and star halos.
 */
export function createGlowSpriteTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 248, 224, 0.92)');
  grad.addColorStop(0.45, 'rgba(247, 214, 138, 0.42)');
  grad.addColorStop(0.75, 'rgba(212, 162, 68, 0.10)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a subtle radial gold floor pool & embroidered snowflake rug texture.
 */
export function createFloorGlowTexture(size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  // Warm ambient radial light pool matching reference tree floor glow
  const grad = ctx.createRadialGradient(c, c, size * 0.02, c, c, size * 0.48);
  grad.addColorStop(0.0, 'rgba(245, 200, 120, 0.42)');
  grad.addColorStop(0.28, 'rgba(205, 148, 72, 0.24)');
  grad.addColorStop(0.55, 'rgba(30, 58, 95, 0.14)');
  grad.addColorStop(0.82, 'rgba(6, 15, 36, 0.05)');
  grad.addColorStop(1.0, 'rgba(3, 8, 22, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle decorative golden filigree ring on the ground
  ctx.save();
  ctx.strokeStyle = 'rgba(240, 202, 126, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(240, 202, 126, 0.09)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.arc(c, c, size * 0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a radial contact shadow texture for gift boxes and props.
 */
export function createContactShadowTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(1, 4, 12, 0.65)');
  grad.addColorStop(0.55, 'rgba(1, 4, 12, 0.30)');
  grad.addColorStop(1.0, 'rgba(1, 4, 12, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a fine wrapping paper micro-grain bump/albedo detail texture.
 */
export function createPaperGrainTexture(baseColor: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Subtle matte paper speckle
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = Math.random() * 0.045;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a satin/velvet ribbon texture with subtle woven sheen lines.
 */
export function createRibbonTexture(baseColor: string, highlightColor: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0.0, baseColor);
  grad.addColorStop(0.12, highlightColor);
  grad.addColorStop(0.5, baseColor);
  grad.addColorStop(0.88, highlightColor);
  grad.addColorStop(1.0, baseColor);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine horizontal weave threads
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a luxury gift tag texture ("For Mom" / "For Dad").
 */
export function createGiftTagTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 280;
  const ctx = canvas.getContext('2d')!;

  // Warm ivory cotton cardstock
  ctx.fillStyle = '#faf5ea';
  ctx.fillRect(0, 0, 512, 280);

  // Paper grain
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(Math.random() * 512, Math.random() * 280, 1.5, 1.5);
  }

  // Double gold foil border
  ctx.strokeStyle = '#c89e3c';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 244);

  ctx.strokeStyle = '#dfc070';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 456, 224);

  // Eyelet punch hole on left
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(58, 140, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1a18';
  ctx.beginPath();
  ctx.arc(58, 140, 7, 0, Math.PI * 2);
  ctx.fill();

  // Subtle decorative stars
  ctx.fillStyle = '#c89e3c';
  ctx.font = '600 22px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('MERRY CHRISTMAS', 274, 86);

  // Main recipient text
  ctx.fillStyle = '#193532';
  ctx.font = '700 68px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(label, 274, 174);

  // Bottom flourish line
  ctx.strokeStyle = '#c89e3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(154, 206);
  ctx.lineTo(394, 206);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a full Polaroid texture with white border, wider bottom margin for caption,
 * and preserves the original image's aspect ratio inside the photo well.
 */
export function renderPolaroidCanvas(
  photoImage: HTMLImageElement | null,
  caption: string,
  aspectRatio: number
): { canvas: HTMLCanvasElement; totalWidth: number; totalHeight: number } {
  // Base photo resolution scaled to preserve natural aspect ratio cleanly
  const clampedAspect = Math.max(0.45, Math.min(2.2, aspectRatio || 1));
  const photoW = clampedAspect >= 1 ? 560 : Math.round(560 * clampedAspect);
  const photoH = clampedAspect >= 1 ? Math.round(560 / clampedAspect) : 560;

  const sideBorder = 36;
  const topBorder = 36;
  const bottomBorder = 128; // Wider polaroid bottom margin for text

  const totalW = photoW + sideBorder * 2;
  const totalH = photoH + topBorder + bottomBorder;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Classic warm-white Polaroid frame
  ctx.fillStyle = '#f8f5ee';
  ctx.fillRect(0, 0, totalW, totalH);

  // Delicate matte paper texture
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.035)';
    ctx.fillRect(Math.random() * totalW, Math.random() * totalH, 1.5, 1.5);
  }

  // Subtle inner frame shadow/edge
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, totalW - 2, totalH - 2);

  // Photo well
  const px = sideBorder;
  const py = topBorder;

  if (photoImage) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, photoW, photoH);
    ctx.clip();
    ctx.drawImage(photoImage, px, py, photoW, photoH);
    ctx.restore();
  } else {
    // Elegant atmospheric blank film state (ready for user photo replacement)
    const bgGrad = ctx.createLinearGradient(px, py, px + photoW, py + photoH);
    bgGrad.addColorStop(0, '#0a1d26');
    bgGrad.addColorStop(0.55, '#0e2d2c');
    bgGrad.addColorStop(1, '#122238');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(px, py, photoW, photoH);

    // Subtle golden corner brackets & starry speckles
    for (let i = 0; i < 28; i++) {
      const sx = px + 24 + ((i * 97) % (photoW - 48));
      const sy = py + 24 + ((i * 53) % (photoH - 48));
      const sr = (i % 3) + 1;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(247, 226, 168, 0.45)' : 'rgba(16, 185, 129, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 18, py + 18, photoW - 36, photoH - 36);

    // Minimal central emblem
    const cx = px + photoW / 2;
    const cy = py + photoH / 2 - 10;
    ctx.strokeStyle = 'rgba(245, 224, 150, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    ctx.fillStyle = 'rgba(245, 232, 198, 0.72)';
    ctx.font = '500 22px "Plus Jakarta Sans", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('点击添加照片', cx, cy + 56);
  }

  // Inner photo border bevel
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, photoW, photoH);

  // Caption area in the wider bottom border
  const textCenterY = py + photoH + bottomBorder * 0.54;
  const trimmed = caption.trim();
  ctx.fillStyle = trimmed ? '#232826' : 'rgba(35, 40, 38, 0.42)';
  ctx.font = 'italic 500 30px "Cormorant Garamond", "Noto Serif SC", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const displayCaption = trimmed || '留下一句圣诞寄语...';
  ctx.fillText(displayCaption, totalW / 2, textCenterY, totalW - 64);

  return { canvas, totalWidth: totalW, totalHeight: totalH };
}
