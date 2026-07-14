import type { MonsterCollisionReactionDetail } from '../collision/monsterCollisionReactionSystem';
import type { GameObject } from '../gameObject';
import type { IPhysics } from '../IPhysics';
import type { MonsterRuntimeController } from '../monster/monsterRuntimeController';
import { CollisionReactionEffect } from './collisionReactionEffect';

export class CollisionReactionVfxController {
  constructor(
    private readonly runtime: MonsterRuntimeController,
    private readonly getPhysics: () => IPhysics | undefined,
    private readonly addEffect: (effect: GameObject) => void
  ) {
    this.runtime.addEventListener(
      'collisionreaction',
      ((event: CustomEvent<MonsterCollisionReactionDetail>) => {
        this.spawnEffect(event.detail);
      }) as EventListener
    );
  }

  private spawnEffect(detail: MonsterCollisionReactionDetail) {
    const physics = this.getPhysics();
    if (!physics) return;

    const a = physics.getMarblePosition(detail.marbleAId);
    const b = physics.getMarblePosition(detail.marbleBId);
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    const directionAngle = Math.atan2(b.y - a.y, b.x - a.x);

    this.addEffect(new CollisionReactionEffect(x, y, detail.reactionId, directionAngle));
  }
}
