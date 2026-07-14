import type { IPhysics } from '../IPhysics';
import { getMonsterDefinition } from '../monster/monsterRegistry';
import type { MonsterRuntimeController, MonsterSkillDueDetail } from '../monster/monsterRuntimeController';
import { getSkillDefinition } from './skillRegistry';

const IMPULSE_UNIT = 8;

export class MonsterSkillExecutor {
  constructor(
    private runtime: MonsterRuntimeController,
    private getPhysics: () => IPhysics | undefined
  ) {
    this.runtime.addEventListener('skilldue', ((event: CustomEvent<MonsterSkillDueDetail>) => {
      this.execute(event.detail);
    }) as EventListener);

    this.runtime.addEventListener('rosterchange', (() => {
      this.applyBaseMonsterProfiles();
    }) as EventListener);
  }

  private execute(detail: MonsterSkillDueDetail) {
    const physics = this.getPhysics();
    const skill = getSkillDefinition(detail.skillId as any);
    if (!physics || !skill) return;

    const id = detail.marbleId;

    switch (detail.skillId) {
      case 'FIRE_ACCELERATION':
        this.randomImpulse(id, skill.power);
        break;
      case 'FIRE_EXPLOSION':
        this.radialImpulse(id, skill.radius ?? 3.5, skill.power);
        break;

      case 'WATER_ACCELERATION':
        this.randomImpulse(id, skill.power);
        this.slowNearby(id, 2.2, 0.75, skill.durationMs ?? 1200);
        break;
      case 'WATER_EXPLOSION':
        this.slowNearby(id, skill.radius ?? 4, skill.power, skill.durationMs ?? 1000);
        break;

      case 'WIND_ACCELERATION':
        this.randomImpulse(id, skill.power);
        break;
      case 'WIND_EXPLOSION':
        this.radialImpulse(id, skill.radius ?? 5, skill.power);
        break;

      case 'GHOST_SHIFT':
        this.randomImpulse(id, skill.power);
        break;
      case 'SPACE_DISTORTION':
        this.randomImpulseNearby(id, skill.radius ?? 4.5, skill.power, skill.maxTargets ?? 3);
        break;

      case 'STONE_HEAVY_MODE':
        this.temporaryProfile(id, { massMultiplier: skill.power }, skill.durationMs ?? 1200);
        break;
      case 'STONE_FRAGMENT_EXPLOSION':
        this.randomImpulseNearby(id, skill.radius ?? 3.5, skill.power, 6);
        break;

      case 'LIGHTNING_ACCELERATION':
        this.randomImpulse(id, skill.power);
        break;
      case 'LIGHTNING_EXPLOSION':
        this.stunNearby(id, skill.radius ?? 3, skill.durationMs ?? 600);
        break;

      case 'EARTH_WALL_RUN':
        if (physics.isMarbleTouchingObstacle(id)) {
          this.downwardTangentImpulse(id, skill.power);
        }
        break;
      case 'EARTH_QUAKE':
        this.earthquake(id, skill.radius ?? 4, skill.power);
        break;

      case 'ICE_GLIDE':
        this.randomImpulse(id, skill.power);
        this.temporaryProfile(id, { frictionMultiplier: 0.65 }, skill.durationMs ?? 1200);
        break;
      case 'ICE_EXPLOSION':
        this.iceBurst(id, skill.radius ?? 4, skill.durationMs ?? 1200);
        break;

      case 'DRAGON_WING_BURST':
        this.randomImpulse(id, skill.power);
        break;
      case 'DRAGON_ROAR':
        this.coneImpulse(id, skill.radius ?? 5, skill.power, Number(skill.metadata?.coneAngleDeg ?? 70));
        break;

      case 'BEAST_LEAP':
        this.beastLeap(id, skill.power);
        break;
      case 'BEAST_CHARGE':
        this.targetedDash(id, skill.radius ?? 4, skill.power);
        break;
    }
  }

  private applyBaseMonsterProfiles() {
    const physics = this.getPhysics();
    if (!physics) return;

    this.runtime.getSnapshot().monsters.forEach((monster) => {
      const definition = getMonsterDefinition(monster.definitionId);
      if (!definition) return;
      physics.setMarblePhysicsProfile(monster.marbleId, {
        massMultiplier: definition.stats.massMultiplier,
        frictionMultiplier: definition.stats.frictionMultiplier,
        restitutionMultiplier: definition.stats.restitutionMultiplier,
      });
    });
  }

  private randomImpulse(id: number, power: number) {
    const angle = Math.random() * Math.PI * 2;
    this.getPhysics()?.applyMarbleImpulse(id, Math.cos(angle) * power * IMPULSE_UNIT, Math.sin(angle) * power * IMPULSE_UNIT);
  }

  private downwardTangentImpulse(id: number, power: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const direction = Math.random() < 0.5 ? -1 : 1;
    physics.applyMarbleImpulse(id, direction * power * IMPULSE_UNIT * 0.35, power * IMPULSE_UNIT);
  }

  private radialImpulse(sourceId: number, radius: number, power: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const source = physics.getMarblePosition(sourceId);

    this.getOtherIds(sourceId).forEach((targetId) => {
      const target = physics.getMarblePosition(targetId);
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0 || distance > radius) return;
      const falloff = 1 - distance / radius;
      physics.applyMarbleImpulse(
        targetId,
        (dx / distance) * power * IMPULSE_UNIT * falloff,
        (dy / distance) * power * IMPULSE_UNIT * falloff
      );
    });
  }

  private randomImpulseNearby(sourceId: number, radius: number, power: number, maxTargets: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const source = physics.getMarblePosition(sourceId);

    this.getOtherIds(sourceId)
      .map((id) => ({ id, pos: physics.getMarblePosition(id) }))
      .filter(({ pos }) => Math.hypot(pos.x - source.x, pos.y - source.y) <= radius)
      .sort(() => Math.random() - 0.5)
      .slice(0, maxTargets)
      .forEach(({ id }) => this.randomImpulse(id, power));
  }

  private slowNearby(sourceId: number, radius: number, velocityMultiplier: number, durationMs: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    this.getIdsWithinRadius(sourceId, radius).forEach((id) => {
      physics.scaleMarbleVelocity(id, velocityMultiplier);
      physics.setMarbleLinearDamping(id, 3);
      window.setTimeout(() => physics.setMarbleLinearDamping(id, 0), durationMs);
    });
  }

  private stunNearby(sourceId: number, radius: number, durationMs: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    this.getIdsWithinRadius(sourceId, radius).forEach((id) => {
      const previous = physics.getMarbleVelocity(id);
      physics.setMarbleVelocity(id, 0, 0);
      physics.setMarbleLinearDamping(id, 100);
      window.setTimeout(() => {
        physics.setMarbleLinearDamping(id, 0);
        physics.setMarbleVelocity(id, previous.x * 0.35, previous.y * 0.35);
      }, durationMs);
    });
  }

  private temporaryProfile(
    id: number,
    profile: { massMultiplier?: number; frictionMultiplier?: number; restitutionMultiplier?: number },
    durationMs: number
  ) {
    const physics = this.getPhysics();
    if (!physics) return;
    physics.setMarblePhysicsProfile(id, profile);
    const snapshot = this.runtime.getSnapshot().monsters.find((monster) => monster.marbleId === id);
    const definition = snapshot ? getMonsterDefinition(snapshot.definitionId) : undefined;
    window.setTimeout(() => {
      if (!definition) return;
      physics.setMarblePhysicsProfile(id, {
        massMultiplier: definition.stats.massMultiplier,
        frictionMultiplier: definition.stats.frictionMultiplier,
        restitutionMultiplier: definition.stats.restitutionMultiplier,
      });
    }, durationMs);
  }

  private earthquake(sourceId: number, radius: number, power: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    this.getIdsWithinRadius(sourceId, radius).forEach((id) => {
      const lateral = (Math.random() * 2 - 1) * power * IMPULSE_UNIT;
      const downward = (0.2 + Math.random() * 0.4) * power * IMPULSE_UNIT;
      physics.applyMarbleImpulse(id, lateral, downward);
    });
  }

  private iceBurst(sourceId: number, radius: number, durationMs: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    this.getIdsWithinRadius(sourceId, radius).forEach((id) => {
      physics.scaleMarbleVelocity(id, 0.6);
      physics.setMarblePhysicsProfile(id, { frictionMultiplier: 0.35 });
      window.setTimeout(() => {
        const snapshot = this.runtime.getSnapshot().monsters.find((monster) => monster.marbleId === id);
        const definition = snapshot ? getMonsterDefinition(snapshot.definitionId) : undefined;
        physics.setMarblePhysicsProfile(id, { frictionMultiplier: definition?.stats.frictionMultiplier ?? 1 });
      }, durationMs);
    });
  }

  private coneImpulse(sourceId: number, radius: number, power: number, coneAngleDeg: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const source = physics.getMarblePosition(sourceId);
    const velocity = physics.getMarbleVelocity(sourceId);
    const baseAngle = Math.hypot(velocity.x, velocity.y) > 0.1 ? Math.atan2(velocity.y, velocity.x) : Math.PI / 2;
    const halfCone = (coneAngleDeg * Math.PI) / 360;

    this.getOtherIds(sourceId).forEach((id) => {
      const target = physics.getMarblePosition(id);
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0 || distance > radius) return;
      const angle = Math.atan2(dy, dx);
      const diff = Math.atan2(Math.sin(angle - baseAngle), Math.cos(angle - baseAngle));
      if (Math.abs(diff) > halfCone) return;
      const falloff = 1 - distance / radius;
      physics.applyMarbleImpulse(id, (dx / distance) * power * IMPULSE_UNIT * falloff, (dy / distance) * power * IMPULSE_UNIT * falloff);
    });
  }

  private beastLeap(id: number, power: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const velocity = physics.getMarbleVelocity(id);
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed < 1.5) {
      const angle = Math.PI * (0.15 + Math.random() * 0.7);
      physics.applyMarbleImpulse(id, Math.cos(angle) * power * IMPULSE_UNIT, Math.abs(Math.sin(angle)) * power * IMPULSE_UNIT);
    } else {
      this.randomImpulse(id, power * 0.75);
    }
  }

  private targetedDash(sourceId: number, radius: number, power: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const source = physics.getMarblePosition(sourceId);
    const target = this.getOtherIds(sourceId)
      .map((id) => ({ id, pos: physics.getMarblePosition(id) }))
      .map((entry) => ({ ...entry, distance: Math.hypot(entry.pos.x - source.x, entry.pos.y - source.y) }))
      .filter((entry) => entry.distance > 0 && entry.distance <= radius)
      .sort((a, b) => a.distance - b.distance)[0];
    if (!target) return;
    physics.applyMarbleImpulse(
      sourceId,
      ((target.pos.x - source.x) / target.distance) * power * IMPULSE_UNIT,
      ((target.pos.y - source.y) / target.distance) * power * IMPULSE_UNIT
    );
  }

  private getIdsWithinRadius(sourceId: number, radius: number): number[] {
    const physics = this.getPhysics();
    if (!physics) return [];
    const source = physics.getMarblePosition(sourceId);
    return this.getOtherIds(sourceId).filter((id) => {
      const target = physics.getMarblePosition(id);
      return Math.hypot(target.x - source.x, target.y - source.y) <= radius;
    });
  }

  private getOtherIds(sourceId: number): number[] {
    return this.runtime
      .getSnapshot()
      .monsters.map((monster) => monster.marbleId)
      .filter((id) => id !== sourceId);
  }
}
