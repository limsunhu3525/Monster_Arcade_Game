import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';

const lifetime = 650;

export class SkillEffect implements GameObject {
  private _size: number = 0;
  position: VectorLike;
  private _elapsed: number = 0;
  isDestroy: boolean = false;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime;
    this._size = (this._elapsed / lifetime) * 10;
    if (this._elapsed > lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme) {
    ctx.save();
    const rate = this._elapsed / lifetime;
    const fade = Math.max(0, 1 - rate * rate);
    const safeZoom = Math.max(zoom, 0.001);

    ctx.globalAlpha = fade;
    ctx.strokeStyle = theme.skillColor;
    ctx.lineWidth = 1 / safeZoom;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this._size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.translate(this.position.x, this.position.y);
    ctx.globalAlpha = Math.min(1, fade * 1.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `700 ${15 / safeZoom}px sans-serif`;
    ctx.lineWidth = 3 / safeZoom;
    ctx.strokeStyle = 'rgba(0,0,0,.78)';
    ctx.fillStyle = 'rgba(255,255,255,.99)';
    const labelY = -(0.65 + rate * 0.55);
    ctx.strokeText('충격파', 0, labelY);
    ctx.fillText('충격파', 0, labelY);
    ctx.restore();
  }
}
