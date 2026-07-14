import type { IPhysics } from '../IPhysics';
import { getMonsterDefinition } from '../monster/monsterRegistry';
import type { MonsterRuntimeController, MonsterSkillDueDetail } from '../monster/monsterRuntimeController';
import { getSkillDefinition } from './skillRegistry';

const IMPULSE_UNIT = 8;
const CONDITIONAL_RETRY_MS = 450;

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
    const comebackMultiplier = this.getComebackMultiplier(id);
    let executed = false;

    switch (detail.skillId) {
      case 'FIRE_ACCELERATION':
        this.forwardBurst(id, skill.power * comebackMultiplier, 0.42);
        executed = true;
        break;
      case 'FIRE_EXPLOSION':
        this.radialImpulse(id, skill.radius ?? 3.5, skill.power);
        executed = true;
        break;

      case 'WATER_ACCELERATION':
        this.forwardBurst(id, skill.power * comebackMultiplier, 0.3);
        this.slowNearby(id, 2.2, 0.78, skill.durationMs ?? 1100);
        executed = true;
        break;
      case 'WATER_EXPLOSION':
        this.slowNearby(id, skill.radius ?? 4, skill.power, skill.durationMs ?? 900);
        executed = true;
        break;

      case 'WIND_ACCELERATION':
        this.forwardBurst(id, skill.power * comebackMultiplier, 0.7);
        executed = true;
        break;
      case 'WIND_EXPLOSION':
        this.radialImpulse(id, skill.radius ?? 5, skill.power);
        executed = true;
        break;

      case 'GHOST_SHIFT':
        this.forwardBurst(id, skill.power * comebackMultiplier, 1.0);
        executed = true;
        break;
      case 'SPACE_DISTORTION':
        this.vortexNearby(id, skill.radius ?? 4.5, skill.power, skill.maxTargets ?? 4);
        executed = true;
        break;

      case 'STONE_HEAVY_MODE':
        this.temporaryProfile(id, { massMultiplier: skill.power }, skill.durationMs ?? 1300);
        this.forwardBurst(id, 0.45 * comebackMultiplier, 0.18);
        executed = true;
        break;
      case 'STONE_FRAGMENT_EXPLOSION':
        this.randomImpulseNearby(id, skill.radius ?? 3.5, skill.power, 6);
        executed = true;
        break;

      case 'LIGHTNING_ACCELERATION':
        this.forwardBurst(id, skill.power * comebackMultiplier, 0.22);
        executed = true;
        break;
      case 'LIGHTNING_EXPLOSION':
        this.stunNearby(id, skill.radius ?? 3, skill.durationMs ?? 500);
        executed = true;
        break;

      case 'EARTH_WALL_RUN':
        if (!physics.isMarbleTouchingObstacle(id)) {
          this.runtime.deferSkillUse(detail, CONDITIONAL_RETRY_MS);
          return;
        }
        this.downwardTangentImpulse(id, skill.power * comebackMultiplier);
        executed = true;
        break;
      case 'EARTH_QUAKE':
        this.earthquake(id, skill.radius ?? 4, skill.power);
        executed = true;
        break;

      case 'ICE_GLIDE':
        this.forwardBurst(id, skill.power * comebackMultiplier, 0.2);
        this.temporaryProfile(id, { frictionMultiplier: 0.42 }, skill.durationMs ?? 1200);
        executed = true;
        break;
      case 'ICE_EXPLOSION':
        this.iceBurst(id, skill.radius ?? 4, skill.durationMs ?? 1100);
        executed = true;
        break;

      case 'DRAGON_WING_BURST':
        this.forwardBurst(id, skill.power * comebackMultiplier, 0.3);
        executed = true;
        break;
      case 'DRAGON_ROAR':
        this.coneImpulse(id, skill.radius ?? 5, skill.power, Number(skill.metadata?.coneAngleDeg ?? 70));
        executed = true;
        break;

      case 'BEAST_LEAP':
        executed = this.beastLeap(id, skill.power * comebackMultiplier);
        if (!executed) {
          this.runtime.deferSkillUse(detail, CONDITIONAL_RETRY_MS);
          return;
        }
        break;
      case 'BEAST_CHARGE':
        executed = this.targetedDash(id, skill.radius ?? 4, skill.power * comebackMultiplier);
        if (!executed) {
          this.runtime.deferSkillUse(detail, CONDITIONAL_RETRY_MS);
          return;
        }
        break;
    }

    if (!executed) return;
    if (!this.runtime.consumeSkillUse(detail)) return;
    this.runtime.emitSkillExecuted(detail, comebackMultiplier);
  }

  private getComebackMultiplier(id: number) {
    const snapshot = this.runtime.getSnapshot();
    const monster = snapshot.monsters.find((entry) => entry.marbleId === id);
    const count = Math.max(1, snapshot.monsters.length);
    const rank = Math.max(1, monster?.rank || count);
    if (count <= 1) return 1;
    const progress = (rank - 1) / (count - 1);
    return 1 + progress * 0.18;
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

  private forwardBurst(id: number, power: number, lateralChaos: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const velocity = physics.getMarbleVelocity(id);
    const speed = Math.hypot(velocity.x, velocity.y);
    const baseX = speed > 0.3 ? velocity.x / speed : 0;
    const baseY = speed > 0.3 ? Math.max(0.35, velocity.y / speed) : 1;
    const jitter = (Math.random() * 2 - 1) * lateralChaos;
    const dx = baseX * 0.45 + jitter;
    const dy = Math.max(0.55, baseY);
    const length = Math.max(0.001, Math.hypot(dx, dy));
    physics.applyMarbleImpulse(id, (dx / length) * power * IMPULSE_UNIT, (dy / length) * power * IMPULSE_UNIT);
  }

  private randomImpulse(id: number, power: number) {
    const angle = Math.random() * Math.PI * 2;
    this.getPhysics()?.applyMarbleImpulse(id, Math.cos(angle) * power * IMPULSE_UNIT, Math.sin(angle) * power * IMPULSE_UNIT);
  }

  private downwardTangentImpulse(id: number, power: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const velocity = physics.getMarbleVelocity(id);
    const direction = Math.abs(velocity.x) > 0.2 ? Math.sign(velocity.x) : Math.random() < 0.5 ? -1 : 1;
    physics.applyMarbleImpulse(id, direction * power * IMPULSE_UNIT * 0.42, power * IMPULSE_UNIT);
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

  private vortexNearby(sourceId: number, radius: number, power: number, maxTargets: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    const source = physics.getMarblePosition(sourceId);

    this.getOtherIds(sourceId)
      .map((id) => ({ id, pos: physics.getMarblePosition(id) }))
      .map((entry) => ({ ...entry, distance: Math.hypot(entry.pos.x - source.x, entry.pos.y - source.y) }))
      .filter((entry) => entry.distance > 0 && entry.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxTargets)
      .forEach(({ id, pos, distance }) => {
        const dx = pos.x - source.x;
        const dy = pos.y - source.y;
        const tangentX = -dy / distance;
        const tangentY = dx / distance;
        const pull = 0.28;
        const falloff = 1 - distance / radius;
        physics.applyMarbleImpulse(
          id,
          (tangentX - (dx / distance) * pull) * power * IMPULSE_UNIT * falloff,
          (tangentY - (dy / distance) * pull) * power * IMPULSE_UNIT * falloff
        );
      });
  }

  private slowNearby(sourceId: number, radius: number, velocityMultiplier: number, durationMs: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    this.getIdsWithinRadius(sourceId, radius).forEach((id) => {
      physics.scaleMarbleVelocity(id, velocityMultiplier);
      physics.setMarbleLinearDamping(id, 2.6);
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
        physics.setMarbleVelocity(id, previous.x * 0.42, previous.y * 0.42);
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
      const downward = (0.25 + Math.random() * 0.35) * power * IMPULSE_UNIT;
      physics.applyMarbleImpulse(id, lateral, downward);
    });
  }

  private iceBurst(sourceId: number, radius: number, durationMs: number) {
    const physics = this.getPhysics();
    if (!physics) return;
    this.getIdsWithinRadius(sourceId, radius).forEach((id) => {
      physics.scaleMarbleVelocity(id, 0.68);
      physics.setMarblePhysicsProfile(id, { frictionMultiplier: 0.38 });
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

  private beastLeap(id: number, power: number): boolean {
    const physics = this.getPhysics();
    if (!physics) return false;
    const velocity = physics.getMarbleVelocity(id);
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed >= 2.2) return false;
    const direction = Math.random() < 0.5 ? -1 : 1;
    physics.applyMarbleImpulse(id, direction * power * IMPULSE_UNIT * 0.42, power * IMPULSE_UNIT * 0.95);
    return true;
  }

  private targetedDash(sourceId: number, radius: number, power: number): boolean {
    const physics = this.getPhysics();
    if (!physics) return false;
    const source = physics.getMarblePosition(sourceId);
    const target = this.getOtherIds(sourceId)
      .map((id) => ({ id, pos: physics.getMarblePosition(id) }))
      .map((entry) => ({ ...entry, distance: Math.hypot(entry.pos.x - source.x, entry.pos.y - source.y) }))
      .filter((entry) => entry.distance > 0 && entry.distance <= radius)
      .sort((a, b) => a.distance - b.distance)[0];
    if (!target) return false;
    physics.applyMarbleImpulse(
      sourceId,
      ((target.pos.x - source.x) / target.distance) * power * IMPULSE_UNIT,
      ((target.pos.y - source.y) / target.distance) * power * IMPULSE_UNIT
    );
    return true;
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
