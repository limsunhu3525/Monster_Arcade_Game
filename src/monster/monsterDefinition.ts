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
  displayName: string;
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
