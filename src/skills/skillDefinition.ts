import type { SkillType } from './skillTypes';

export type SkillTriggerType =
  | 'SCHEDULED_RANDOM'
  | 'NEAR_WALL'
  | 'NEAR_MONSTER'
  | 'LOW_SPEED'
  | 'LOW_RANK'
  | 'HIGH_RANK';

export type SkillEffectType =
  | 'SELF_RANDOM_IMPULSE'
  | 'SELF_DIRECTIONAL_IMPULSE'
  | 'RADIAL_IMPULSE'
  | 'RANDOM_IMPULSE_TO_NEARBY'
  | 'APPLY_SLOW_RADIUS'
  | 'APPLY_STUN_RADIUS'
  | 'MODIFY_MASS_TEMPORARILY'
  | 'MODIFY_FRICTION_TEMPORARILY'
  | 'CONE_IMPULSE'
  | 'TARGETED_DASH';

export interface SkillDefinition {
  id: SkillType;
  displayName: string;
  trigger: SkillTriggerType;
  effect: SkillEffectType;
  maxUses: number;
  power: number;
  radius?: number;
  durationMs?: number;
  maxTargets?: number;
  cooldownMs?: number;
  metadata?: Record<string, number | string | boolean>;
}

export interface SkillRuntimeState {
  skillId: SkillType;
  remainingUses: number;
  nextScheduledAtMs?: number;
  lastUsedAtMs?: number;
}
