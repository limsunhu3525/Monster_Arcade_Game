import type { SkillType } from '../skills/skillTypes';
import type { MonsterElement } from './monsterTypes';

export interface MonsterPhysicsStats {
  massMultiplier: number;
  frictionMultiplier: number;
  restitutionMultiplier: number;
  statusDurationMultiplier: number;
}

export interface MonsterDefinition {
  id: string;
  /** Internal/debug display name used across the runtime. */
  displayName: string;
  /** Short name shown in the future pre-race trait picker. */
  selectionName: string;
  /** Player-facing explanation of how this trait behaves in a race. */
  selectionDescription: string;
  element: MonsterElement;
  spriteUrl?: string;
  stats: MonsterPhysicsStats;
  skills: SkillType[];
  tags?: string[];
}

export const DEFAULT_MONSTER_PHYSICS_STATS: MonsterPhysicsStats = {
  massMultiplier: 1,
  frictionMultiplier: 1,
  restitutionMultiplier: 1,
  statusDurationMultiplier: 1,
};
