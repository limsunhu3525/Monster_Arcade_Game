import type { IPhysics } from '../IPhysics';
import { getMonsterDefinition } from '../monster/monsterRegistry';
import type { MonsterRuntimeController } from '../monster/monsterRuntimeController';

const PAIR_COOLDOWN_MS = 2500;
const MIN_RELATIVE_SPEED = 0.8;
const REACTION_IMPULSE_UNIT = 2.8;

export type CollisionReactionId =
  | 'STEAM_BURST'
  | 'THERMAL_SHOCK'
  | 'ELECTRIC_CONDUCTION'
  | 'WIND_RECOIL';

export interface MonsterCollisionReactionDetail {
  reactionId: CollisionReactionId;
  reactionName: string;
  marbleAId: number;
  marbleBId: number;
  traitA: string;
  traitB: string;
  relativeSpeed: number;
}

interface CollisionPair {
  a: number;
  b: number;
}

interface ReactionDefinition {
  id: CollisionReactionId;
  name: string;
  elements: [string, string];
}

const REACTIONS: ReactionDefinition[] = [
  { id: 'STEAM_BURST', name: '증기 폭발', elements: ['FIRE', 'WATER'] },
  { id: 'THERMAL_SHOCK', name: '열충격', elements: ['FIRE', 'ICE'] },
  { id: 'ELECTRIC_CONDUCTION', name: '감전 전도', elements: ['WATER', 'LIGHTNING'] },
  { id: 'WIND_RECOIL', name: '풍압 반동', elements: ['WIND', 'STONE'] },
];

export class MonsterCollisionReactionSystem {
  private attached = false;
  private activePairs = new Set<string>();
  private cooldownUntil = new Map<string, number>();

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
      this.update();
    };

    const originalReset = roulette.reset.bind(roulette);
    roulette.reset = () => {
      this.activePairs.clear();
      this.cooldownUntil.clear();
      originalReset();
    };
  }

  private update() {
    const physics = this.getPhysics();
    if (!physics) return;

    const currentPairs = this.getCurrentCollisionPairs(physics);
    const currentKeys = new Set(currentPairs.map((pair) => this.getPairKey(pair.a, pair.b)));

    currentPairs.forEach((pair) => {
      const key = this.getPairKey(pair.a, pair.b);
      if (!this.activePairs.has(key)) {
        this.handleCollisionStart(physics, pair);
      }
    });

    this.activePairs = currentKeys;
  }

  private handleCollisionStart(physics: IPhysics, pair: CollisionPair) {
    const key = this.getPairKey(pair.a, pair.b);
    const now = performance.now();
    if ((this.cooldownUntil.get(key) ?? 0) > now) return;

    const monsterA = this.runtime.getSnapshot().monsters.find((monster) => monster.marbleId === pair.a);
    const monsterB = this.runtime.getSnapshot().monsters.find((monster) => monster.marbleId === pair.b);
    if (!monsterA || !monsterB) return;

    const definitionA = getMonsterDefinition(monsterA.definitionId);
    const definitionB = getMonsterDefinition(monsterB.definitionId);
    if (!definitionA || !definitionB) return;

    const reaction = this.findReaction(definitionA.element, definitionB.element);
    if (!reaction) return;

    const velocityA = physics.getMarbleVelocity(pair.a);
    const velocityB = physics.getMarbleVelocity(pair.b);
    const relativeSpeed = Math.hypot(velocityA.x - velocityB.x, velocityA.y - velocityB.y);
    if (relativeSpeed < MIN_RELATIVE_SPEED) return;

    switch (reaction.id) {
      case 'STEAM_BURST':
        this.executeSteamBurst(physics, pair.a, pair.b);
        break;
      case 'THERMAL_SHOCK':
        this.executeThermalShock(physics, pair.a, pair.b, definitionA.element, definitionB.element);
        break;
      case 'ELECTRIC_CONDUCTION':
        this.executeElectricConduction(physics, pair.a, pair.b);
        break;
      case 'WIND_RECOIL':
        this.executeWindRecoil(physics, pair.a, pair.b, definitionA.element, definitionB.element);
        break;
    }

    this.cooldownUntil.set(key, now + PAIR_COOLDOWN_MS);
    const detail: MonsterCollisionReactionDetail = {
      reactionId: reaction.id,
      reactionName: reaction.name,
      marbleAId: pair.a,
      marbleBId: pair.b,
      traitA: definitionA.selectionName,
      traitB: definitionB.selectionName,
      relativeSpeed,
    };
    this.runtime.dispatchEvent(new CustomEvent<MonsterCollisionReactionDetail>('collisionreaction', { detail }));
  }

  private executeSteamBurst(physics: IPhysics, a: number, b: number) {
    this.separatePair(physics, a, b, 1.0);
  }

  private executeThermalShock(physics: IPhysics, a: number, b: number, elementA: string, elementB: string) {
    this.separatePair(physics, a, b, 1.2);
    const iceId = elementA === 'ICE' ? a : elementB === 'ICE' ? b : undefined;
    if (iceId === undefined) return;

    physics.setMarblePhysicsProfile(iceId, { frictionMultiplier: 1 });
    window.setTimeout(() => {
      physics.setMarblePhysicsProfile(iceId, { frictionMultiplier: 0.65 });
    }, 900);
  }

  private executeElectricConduction(physics: IPhysics, a: number, b: number) {
    const centerA = physics.getMarblePosition(a);
    const centerB = physics.getMarblePosition(b);
    const center = { x: (centerA.x + centerB.x) / 2, y: (centerA.y + centerB.y) / 2 };

    this.runtime.getSnapshot().monsters.forEach((monster) => {
      const pos = physics.getMarblePosition(monster.marbleId);
      if (Math.hypot(pos.x - center.x, pos.y - center.y) > 2.8) return;

      physics.scaleMarbleVelocity(monster.marbleId, 0.55);
      physics.setMarbleLinearDamping(monster.marbleId, 2.5);
      window.setTimeout(() => physics.setMarbleLinearDamping(monster.marbleId, 0), 650);
    });
  }

  private executeWindRecoil(physics: IPhysics, a: number, b: number, elementA: string, elementB: string) {
    const windId = elementA === 'WIND' ? a : b;
    const stoneId = elementA === 'STONE' ? a : b;
    const wind = physics.getMarblePosition(windId);
    const stone = physics.getMarblePosition(stoneId);
    const dx = wind.x - stone.x;
    const dy = wind.y - stone.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const nx = dx / distance;
    const ny = dy / distance;

    physics.applyMarbleImpulse(windId, nx * REACTION_IMPULSE_UNIT * 1.25, ny * REACTION_IMPULSE_UNIT * 1.25);
    physics.applyMarbleImpulse(stoneId, -nx * REACTION_IMPULSE_UNIT * 0.25, -ny * REACTION_IMPULSE_UNIT * 0.25);
  }

  private separatePair(physics: IPhysics, a: number, b: number, power: number) {
    const posA = physics.getMarblePosition(a);
    const posB = physics.getMarblePosition(b);
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const nx = dx / distance;
    const ny = dy / distance;
    const impulse = REACTION_IMPULSE_UNIT * power;

    physics.applyMarbleImpulse(a, nx * impulse, ny * impulse);
    physics.applyMarbleImpulse(b, -nx * impulse, -ny * impulse);
  }

  private findReaction(elementA: string, elementB: string): ReactionDefinition | undefined {
    return REACTIONS.find(
      (reaction) =>
        (reaction.elements[0] === elementA && reaction.elements[1] === elementB) ||
        (reaction.elements[0] === elementB && reaction.elements[1] === elementA)
    );
  }

  private getCurrentCollisionPairs(physics: IPhysics): CollisionPair[] {
    const physicsInternals = physics as unknown as { marbleMap?: Record<number, any> };
    const marbleMap = physicsInternals.marbleMap ?? {};
    const idByBody = new Map<any, number>();
    Object.entries(marbleMap).forEach(([id, body]) => idByBody.set(body, Number(id)));

    const pairs = new Map<string, CollisionPair>();
    Object.entries(marbleMap).forEach(([idString, body]) => {
      const a = Number(idString);
      let edge = body.GetContactList?.();
      let guard = 0;

      while (edge && guard < 64) {
        const b = idByBody.get(edge.other);
        if (b !== undefined && b !== a && edge.contact?.IsTouching?.()) {
          const key = this.getPairKey(a, b);
          pairs.set(key, { a: Math.min(a, b), b: Math.max(a, b) });
        }
        edge = edge.next;
        guard += 1;
      }
    });

    return [...pairs.values()];
  }

  private getPairKey(a: number, b: number) {
    return `${Math.min(a, b)}:${Math.max(a, b)}`;
  }
}
