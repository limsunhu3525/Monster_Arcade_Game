export const STATUS_EFFECT_TYPES = [
  'WET',
  'SLOWED',
  'STUNNED',
  'HEAVY',
  'LOW_FRICTION',
  'SKILL_IMMUNITY',
] as const;

export type StatusEffectType = (typeof STATUS_EFFECT_TYPES)[number];
