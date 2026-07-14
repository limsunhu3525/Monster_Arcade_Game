import type { GameObject } from '../gameObject';
import type { ColorTheme } from '../types/ColorTheme';
import type { VectorLike } from '../types/VectorLike';

export type SkillVfxStyle = 'FIRE' | 'WATER' | 'WIND' | 'MAGIC' | 'STONE' | 'LIGHTNING' | 'EARTH' | 'ICE' | 'DRAGON' | 'BEAST';

const COLORS: Record<SkillVfxStyle, { primary: string; secondary: string }> = {
  FIRE: { primary: 'rgba(255,112,48,.98)', secondary: 'rgba(255,210,88,.95)' },
  WATER: { primary: 'rgba(68,170,255,.98)', secondary: 'rgba(150,230,255,.95)' },
  WIND: { primary: 'rgba(190,250,255,.98)', secondary: 'rgba(120,220,210,.92)' },
  MAGIC: { primary: 'rgba(190,110,255,.98)', secondary: 'rgba(255,150,245,.92)' },
  STONE: { primary: 'rgba(170,150,130,.98)', secondary: 'rgba(225,205,180,.9)' },
  LIGHTNING: { primary: 'rgba(255,235,90,.98)', secondary: 'rgba(145,205,255,.98)' },
  EARTH: { primary: 'rgba(150,105,60,.98)', secondary: 'rgba(205,170,90,.92)' },
  ICE: { primary: 'rgba(150,235,255,.98)', secondary: 'rgba(225,250,255,.98)' },
  DRAGON: { primary: 'rgba(255,80,95,.98)', secondary: 'rgba(255,190,80,.96)' },
  BEAST: { primary: 'rgba(255,175,70,.98)', secondary: 'rgba(245,235,185,.94)' },
};

export class SkillActivationEffect implements GameObject {
  isDestroy = false;
  position: VectorLike;
  private elapsed = 0;
  private readonly lifetime = 760;

  constructor(
    x: number,
    y: number,
    private readonly label: string,
    private readonly style: SkillVfxStyle,
    private readonly radius = 2.4
  ) {
    this.position = { x, y };
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.lifetime) this.isDestroy = true;
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, _theme: ColorTheme): void {
    const progress = Math.min(1, this.elapsed / this.lifetime);
    const fade = 1 - progress;
    const safeZoom = Math.max(zoom, 0.001);
    const colors = COLORS[this.style];

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.globalCompositeOperation = 'screen';

    const outer = 0.25 + this.radius * progress;
    const inner = 0.12 + this.radius * 0.58 * progress;

    ctx.globalAlpha = fade * 0.82;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3 / safeZoom;
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.55;
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2 / safeZoom;
    ctx.beginPath();
    ctx.arc(0, 0, inner, 0, Math.PI * 2);
    ctx.stroke();

    this.renderAccent(ctx, safeZoom, progress, fade, colors);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, fade * 1.9);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `700 ${15 / safeZoom}px sans-serif`;
    ctx.lineWidth = 3 / safeZoom;
    ctx.strokeStyle = 'rgba(0,0,0,.78)';
    ctx.fillStyle = 'rgba(255,255,255,.99)';
    const y = -(0.65 + progress * 0.65);
    ctx.strokeText(this.label, 0, y);
    ctx.fillText(this.label, 0, y);

    ctx.restore();
  }

  private renderAccent(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    progress: number,
    fade: number,
    colors: { primary: string; secondary: string }
  ) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + progress * 0.8;
      const start = 0.35 + progress * 0.28;
      const end = start + 0.35 + progress * 0.65;
      ctx.globalAlpha = fade * (0.6 - (i % 3) * 0.08);
      ctx.strokeStyle = i % 2 === 0 ? colors.primary : colors.secondary;
      ctx.lineWidth = (2.3 - (i % 2) * 0.5) / zoom;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
      ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
      ctx.stroke();
    }
  }
}
