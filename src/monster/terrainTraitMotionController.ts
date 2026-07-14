import type { IPhysics } from '../IPhysics';
import type { MonsterRuntimeController } from './monsterRuntimeController';

const BOOST_INTERVAL_MS = 220;
const EARTH_SLOPE_MULTIPLIER = 1.045;
const ICE_SLOPE_MULTIPLIER = 1.07;
const MAX_EARTH_SPEED = 16;
const MAX_ICE_SPEED = 19;

export class TerrainTraitMotionController {
  private elapsedMs = 0;
  private attached = false;

  constructor(
    private runtime: MonsterRuntimeController,
    private getPhysics: () => IPhysics | undefined
  ) {}

  attach(roulette: any) {
    if (this.attached) return;
    this.attached = true;

    const originalUpdateMarbles = roulette._updateMarbles.bind(roulette);
    roulette._updateMarbles = (deltaTime: number) => {
      originalUpdateMarbles(deltaTime);
      this.update(deltaTime);
    };

    const originalReset = roulette.reset.bind(roulette);
    roulette.reset = () => {
      this.elapsedMs = 0;
      originalReset();
    };
  }

  private update(deltaTime: number) {
    this.elapsedMs += deltaTime;
    if (this.elapsedMs < BOOST_INTERVAL_MS) return;
    this.elapsedMs = 0;

    const physics = this.getPhysics();
    if (!physics) return;

    this.runtime.getSnapshot().monsters.forEach((monster) => {
      if (monster.element !== 'EARTH' && monster.element !== 'ICE') return;
      if (!physics.isMarbleTouchingObstacle(monster.marbleId)) return;

      const velocity = physics.getMarbleVelocity(monster.marbleId);
      const speed = Math.hypot(velocity.x, velocity.y);
      if (velocity.y < 0.15 || speed < 0.6) return;

      const multiplier = monster.element === 'EARTH' ? EARTH_SLOPE_MULTIPLIER : ICE_SLOPE_MULTIPLIER;
      const maxSpeed = monster.element === 'EARTH' ? MAX_EARTH_SPEED : MAX_ICE_SPEED;
      if (speed >= maxSpeed) return;

      const nextMultiplier = Math.min(multiplier, maxSpeed / Math.max(speed, 0.001));
      physics.scaleMarbleVelocity(monster.marbleId, nextMultiplier);
    });
  }
}
