import type { StatusEffectType } from './statusTypes';

export interface ActiveStatusEffect {
  id: string;
  type: StatusEffectType;
  sourceMonsterInstanceId?: string;
  startedAtMs: number;
  durationMs: number;
  magnitude: number;
}

export const getRemainingStatusDuration = (effect: ActiveStatusEffect, nowMs: number) =>
  Math.max(0, effect.durationMs - (nowMs - effect.startedAtMs));

export const isStatusEffectActive = (effect: ActiveStatusEffect, nowMs: number) =>
  getRemainingStatusDuration(effect, nowMs) > 0;
