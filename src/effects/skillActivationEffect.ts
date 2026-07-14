import type { GameObject } from '../gameObject';
import type { MonsterElement } from '../monster/monsterTypes';
import { getMonsterVisualIdentity } from '../monster/monsterVisualIdentity';
import type { ColorTheme } from '../types/ColorTheme';
import type { VectorLike } from '../types/VectorLike';
import { renderEffectBanner } from './effectBanner';

export type SkillVfxStyle = MonsterElement;

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
    const visual = getMonsterVisualIdentity(this.style);

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.globalCompositeOperation = 'screen';

    const outer = 0.25 + this.radius * progress;
    const inner = 0.12 + this.radius * 0.58 * progress;

    ctx.globalAlpha = fade * 0.82;
    ctx.strokeStyle = visual.primaryColor;
    ctx.lineWidth = 3 / safeZoom;
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.55;
    ctx.strokeStyle = visual.secondaryColor;
    ctx.lineWidth = 2 / safeZoom;
    ctx.beginPath();
    ctx.arc(0, 0, inner, 0, Math.PI * 2);
    ctx.stroke();

    this.renderAccent(ctx, safeZoom, progress, fade, visual.primaryColor, visual.secondaryColor);

    renderEffectBanner(ctx, safeZoom, {
      label: this.label,
      icon: visual.icon,
      primaryColor: visual.primaryColor,
      secondaryColor: visual.secondaryColor,
      y: -(0.78 + progress * 0.72),
      alpha: Math.min(1, fade * 1.9),
    });

    ctx.restore();
  }

  private renderAccent(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    progress: number,
    fade: number,
    primaryColor: string,
    secondaryColor: string
  ) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + progress * 0.8;
      const start = 0.35 + progress * 0.28;
      const end = start + 0.35 + progress * 0.65;
      ctx.globalAlpha = fade * (0.6 - (i % 3) * 0.08);
      ctx.strokeStyle = i % 2 === 0 ? primaryColor : secondaryColor;
      ctx.lineWidth = (2.3 - (i % 2) * 0.5) / zoom;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
      ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
      ctx.stroke();
    }
  }
}
