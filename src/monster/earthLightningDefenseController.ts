import type { IPhysics } from '../IPhysics';
import type { MonsterRuntimeController, MonsterSkillDueDetail } from './monsterRuntimeController';

interface SavedVelocity {
  id: number;
  x: number;
  y: number;
}

export class EarthLightningDefenseController {
  constructor(
    private runtime: MonsterRuntimeController,
    private getPhysics: () => IPhysics | undefined
  ) {
    this.runtime.addEventListener('skilldue', ((event: CustomEvent<MonsterSkillDueDetail>) => {
      if (event.detail.skillId !== 'LIGHTNING_EXPLOSION') return;
      this.protectEarthMonsters(event.detail.marbleId);
    }) as EventListener);
  }

  private protectEarthMonsters(sourceId: number) {
    const physics = this.getPhysics();
    if (!physics) return;

    const source = physics.getMarblePosition(sourceId);
    const protectedVelocities: SavedVelocity[] = [];

    this.runtime.getSnapshot().monsters.forEach((monster) => {
      if (monster.element !== 'EARTH' || monster.marbleId === sourceId) return;
      const position = physics.getMarblePosition(monster.marbleId);
      if (Math.hypot(position.x - source.x, position.y - source.y) > 3.2) return;
      const velocity = physics.getMarbleVelocity(monster.marbleId);
      protectedVelocities.push({ id: monster.marbleId, x: velocity.x, y: velocity.y });
    });

    if (protectedVelocities.length === 0) return;

    queueMicrotask(() => {
      protectedVelocities.forEach(({ id, x, y }) => {
        physics.setMarbleLinearDamping(id, 0);
        physics.setMarbleVelocity(id, x, y);
      });
    });
  }
}
