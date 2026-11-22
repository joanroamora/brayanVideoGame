/**
 * Shared Canvas 2D Context & Low-level Pixel Art Drawing Helpers.
 */
export const CANVAS_W = 960;
export const CANVAS_H = 540;

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

export function drawGroundShadow(targetCtx, cx, cy, rx, ry) {
  targetCtx.save();
  targetCtx.fillStyle = 'rgba(10, 8, 22, 0.42)';
  targetCtx.beginPath();
  targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.restore();
}

export function drawFlippedSprite(targetCtx, spr, x, y, w, h, facing) {
  targetCtx.save();
  if (facing < 0) {
    targetCtx.translate(x + w, y);
    targetCtx.scale(-1, 1);
    targetCtx.drawImage(spr, 0, 0, w, h);
  } else {
    targetCtx.drawImage(spr, x, y, w, h);
  }
  targetCtx.restore();
}
