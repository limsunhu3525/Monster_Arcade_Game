import type { CollisionReactionId } from '../collision/monsterCollisionReactionSystem';
import type { GameObject } from '../gameObject';
import type { ColorTheme } from '../types/ColorTheme';
import type { VectorLike } from '../types/VectorLike';

interface EffectSeed {
  angle: number;
  distance: number;
  size: number;
  phase: number;
}

const REACTION_LABELS: Record<CollisionReactionId, string> = {
  STEAM_BURST: '증기 폭발',
  THERMAL_SHOCK: '열충격',
  ELECTRIC_CONDUCTION: '감전 전도',
  WIND_RECOIL: '풍압 반동',
};

const REACTION_LIFETIMES: Record<CollisionReactionId, number> = {
  STEAM_BURST: 850,
  THERMAL_SHOCK: 620,
  ELECTRIC_CONDUCTION: 760,
  WIND_RECOIL: 700,
};

export class CollisionReactionEffect implements GameObject {
  public isDestroy = false;
  public position: VectorLike;

  private elapsed = 0;
  private readonly lifetime: number;
  private readonly seeds: EffectSeed[];

  constructor(
    x: number,
    y: number,
    private readonly reactionId: CollisionReactionId,
    private readonly directionAngle = 0
  ) {
    this.position = { x, y };
    this.lifetime = REACTION_LIFETIMES[reactionId];
    this.seeds = Array.from({ length: 12 }, (_, index) => ({
      angle: (Math.PI * 2 * index) / 12 + Math.random() * 0.35,
      distance: 0.55 + Math.random() * 1.35,
      size: 0.18 + Math.random() * 0.32,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, _theme: ColorTheme): void {
    const progress = Math.min(1, this.elapsed / this.lifetime);
    const fade = Math.max(0, 1 - progress);

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    switch (this.reactionId) {
      case 'STEAM_BURST':
        this.renderSteamBurst(ctx, zoom, progress, fade);
        break;
      case 'THERMAL_SHOCK':
        this.renderThermalShock(ctx, zoom, progress, fade);
        break;
      case 'ELECTRIC_CONDUCTION':
        this.renderElectricConduction(ctx, zoom, progress, fade);
        break;
      case 'WIND_RECOIL':
        this.renderWindRecoil(ctx, zoom, progress, fade);
        break;
    }

    this.renderLabel(ctx, zoom, progress, fade);
    ctx.restore();
  }

  private renderSteamBurst(ctx: CanvasRenderingContext2D, zoom: number, progress: number, fade: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const ringRadius = 0.35 + progress * 2.65;
    ctx.globalAlpha = fade * 0.65;
    ctx.strokeStyle = 'rgba(235, 247, 255, 0.95)';
    ctx.lineWidth = 3 / Math.max(zoom, 0.001);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    this.seeds.forEach((seed, index) => {
      const travel = progress * seed.distance * 1.9;
      const wobble = Math.sin(seed.phase + progress * Math.PI * 2) * 0.12;
      const x = Math.cos(seed.angle) * travel + wobble;
      const y = Math.sin(seed.angle) * travel - progress * 0.3;
      const radius = seed.size * (0.8 + progress * 1.5);

      ctx.globalAlpha = fade * (0.2 + (index % 3) * 0.08);
      ctx.fillStyle = index % 2 === 0 ? 'rgba(240, 248, 255, 0.92)' : 'rgba(185, 205, 218, 0.82)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderThermalShock(ctx: CanvasRenderingContext2D, zoom: number, progress: number, fade: number) {
    const radius = 0.25 + progress * 2.25;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = 3 / Math.max(zoom, 0.001);

    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = 'rgba(255, 118, 64, 0.98)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.75;
    ctx.strokeStyle = 'rgba(126, 225, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, radius - 0.28), 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + 0.2;
      const inner = 0.35 + progress * 0.45;
      const outer = inner + 0.35 + progress * (0.65 + (i % 3) * 0.14);
      ctx.globalAlpha = fade * 0.7;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 166, 82, 0.95)' : 'rgba(175, 236, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderElectricConduction(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    progress: number,
    fade: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    const ringRadius = 0.45 + progress * 2.45;
    ctx.globalAlpha = fade * 0.55;
    ctx.strokeStyle = 'rgba(119, 208, 255, 0.95)';
    ctx.lineWidth = 2 / Math.max(zoom, 0.001);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let bolt = 0; bolt < 6; bolt++) {
      const baseAngle = (Math.PI * 2 * bolt) / 6 + this.seeds[bolt].phase * 0.08;
      const maxDistance = 0.65 + progress * (1.65 + this.seeds[bolt].distance * 0.55);
      ctx.globalAlpha = fade * 0.95;
      ctx.strokeStyle = bolt % 2 === 0 ? 'rgba(230, 249, 255, 1)' : 'rgba(126, 173, 255, 0.98)';
      ctx.lineWidth = (bolt % 2 === 0 ? 2.6 : 1.8) / Math.max(zoom, 0.001);
      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let segment = 1; segment <= 5; segment++) {
        const t = segment / 5;
        const distance = maxDistance * t;
        const jitter = Math.sin(this.seeds[bolt].phase + segment * 3.7) * 0.18 * (1 - t * 0.35);
        const angle = baseAngle + jitter;
        ctx.lineTo(Math.cos(angle) * distance, Math.sin(angle) * distance);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderWindRecoil(ctx: CanvasRenderingContext2D, zoom: number, progress: number, fade: number) {
    ctx.save();
    ctx.rotate(this.directionAngle);
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    for (let i = 0; i < 5; i++) {
      const offset = (i - 2) * 0.3;
      const startX = -0.8 + progress * 0.35;
      const length = 1.25 + progress * (1.2 + i * 0.12);
      const curve = 0.18 + i * 0.055;

      ctx.globalAlpha = fade * (0.72 - i * 0.07);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(213, 248, 255, 0.95)' : 'rgba(155, 222, 235, 0.88)';
      ctx.lineWidth = (2.6 - i * 0.22) / Math.max(zoom, 0.001);
      ctx.beginPath();
      ctx.moveTo(startX, offset);
      ctx.quadraticCurveTo(startX + length * 0.52, offset - curve, startX + length, offset + curve * 0.25);
      ctx.stroke();
    }

    const arcRadius = 0.65 + progress * 1.4;
    ctx.globalAlpha = fade * 0.55;
    ctx.strokeStyle = 'rgba(225, 252, 255, 0.9)';
    ctx.lineWidth = 2 / Math.max(zoom, 0.001);
    ctx.beginPath();
    ctx.arc(0, 0, arcRadius, -0.85, 0.85);
    ctx.stroke();

    ctx.restore();
  }

  private renderLabel(ctx: CanvasRenderingContext2D, zoom: number, progress: number, fade: number) {
    const safeZoom = Math.max(zoom, 0.001);
    const rise = 0.55 + progress * 0.55;

    ctx.save();
    ctx.globalAlpha = Math.min(1, fade * 1.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `700 ${15 / safeZoom}px sans-serif`;
    ctx.lineWidth = 3 / safeZoom;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.strokeText(REACTION_LABELS[this.reactionId], 0, -rise);
    ctx.fillText(REACTION_LABELS[this.reactionId], 0, -rise);
    ctx.restore();
  }
}
