export interface EffectBannerOptions {
  label: string;
  icon?: string;
  primaryColor: string;
  secondaryColor: string;
  y: number;
  alpha: number;
}

export const renderEffectBanner = (
  ctx: CanvasRenderingContext2D,
  zoom: number,
  options: EffectBannerOptions
) => {
  const safeZoom = Math.max(zoom, 0.001);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = Math.max(0, Math.min(1, options.alpha));
  ctx.translate(0, options.y);
  ctx.scale(1 / safeZoom, 1 / safeZoom);

  ctx.font = '800 13px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const iconWidth = options.icon ? 20 : 0;
  const textWidth = ctx.measureText(options.label).width;
  const width = Math.max(74, textWidth + iconWidth + 28);
  const height = 28;
  const x = -width / 2;
  const y = -height / 2;
  const radius = 10;

  const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, 'rgba(9, 13, 21, 0.94)');
  gradient.addColorStop(0.52, 'rgba(17, 23, 35, 0.96)');
  gradient.addColorStop(1, 'rgba(9, 13, 21, 0.94)');

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  const border = ctx.createLinearGradient(x, 0, x + width, 0);
  border.addColorStop(0, options.primaryColor);
  border.addColorStop(1, options.secondaryColor);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.shadowColor = options.primaryColor;
  ctx.shadowBlur = 12;
  ctx.globalAlpha *= 0.35;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = Math.max(0, Math.min(1, options.alpha));

  let cursorX = x + 12;
  if (options.icon) {
    ctx.font = '14px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(options.icon, cursorX, 0.5);
    cursorX += iconWidth;
  }

  ctx.font = '800 13px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(options.label, cursorX, 0.5);

  ctx.restore();
};
