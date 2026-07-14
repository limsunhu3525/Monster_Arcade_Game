import type { SkillDefinition } from './skillDefinition';
import type { SkillType } from './skillTypes';

const skillDefinitions: SkillDefinition[] = [
  { id: 'FIRE_ACCELERATION', displayName: '화염 가속', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 2, power: 1.25 },
  { id: 'FIRE_EXPLOSION', displayName: '화염 폭발', trigger: 'SCHEDULED_RANDOM', effect: 'RADIAL_IMPULSE', maxUses: 1, power: 1, radius: 3.5 },
  { id: 'WATER_ACCELERATION', displayName: '물 가속', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 2, power: 1, durationMs: 1200, metadata: { trailSlowMultiplier: 0.75 } },
  { id: 'WATER_EXPLOSION', displayName: '물 폭발', trigger: 'SCHEDULED_RANDOM', effect: 'APPLY_SLOW_RADIUS', maxUses: 1, power: 0.65, radius: 4, durationMs: 1000 },
  { id: 'WIND_ACCELERATION', displayName: '바람 가속', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 1, power: 1.1 },
  { id: 'WIND_EXPLOSION', displayName: '360도 돌풍', trigger: 'SCHEDULED_RANDOM', effect: 'RADIAL_IMPULSE', maxUses: 2, power: 0.75, radius: 5 },
  { id: 'GHOST_SHIFT', displayName: '유령 이동', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 1, power: 0.9 },
  { id: 'SPACE_DISTORTION', displayName: '공간 왜곡', trigger: 'SCHEDULED_RANDOM', effect: 'RANDOM_IMPULSE_TO_NEARBY', maxUses: 2, power: 0.9, radius: 4.5, maxTargets: 3 },
  { id: 'STONE_HEAVY_MODE', displayName: '초중량화', trigger: 'SCHEDULED_RANDOM', effect: 'MODIFY_MASS_TEMPORARILY', maxUses: 1, power: 1.8, durationMs: 1200 },
  { id: 'STONE_FRAGMENT_EXPLOSION', displayName: '파편 폭발', trigger: 'SCHEDULED_RANDOM', effect: 'RANDOM_IMPULSE_TO_NEARBY', maxUses: 1, power: 1.1, radius: 3.5 },
  { id: 'LIGHTNING_ACCELERATION', displayName: '번개 가속', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 2, power: 1.35 },
  { id: 'LIGHTNING_EXPLOSION', displayName: '전기 폭발', trigger: 'SCHEDULED_RANDOM', effect: 'APPLY_STUN_RADIUS', maxUses: 1, power: 1, radius: 3, durationMs: 600, metadata: { postStunImmunityMs: 1500 } },
  { id: 'EARTH_WALL_RUN', displayName: '지면 질주', trigger: 'NEAR_WALL', effect: 'SELF_DIRECTIONAL_IMPULSE', maxUses: 2, power: 1.1, metadata: { preferredDirection: 'DOWN_TANGENT' } },
  { id: 'EARTH_QUAKE', displayName: '지진', trigger: 'SCHEDULED_RANDOM', effect: 'RANDOM_IMPULSE_TO_NEARBY', maxUses: 1, power: 0.8, radius: 4, metadata: { downwardBias: 0.35 } },
  { id: 'ICE_GLIDE', displayName: '얼음 활주', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 2, power: 1, durationMs: 1200, metadata: { frictionMultiplier: 0.65 } },
  { id: 'ICE_EXPLOSION', displayName: '냉기 폭발', trigger: 'SCHEDULED_RANDOM', effect: 'MODIFY_FRICTION_TEMPORARILY', maxUses: 1, power: 0.6, radius: 4, durationMs: 1200, metadata: { initialVelocityMultiplier: 0.6 } },
  { id: 'DRAGON_WING_BURST', displayName: '날개 폭발', trigger: 'SCHEDULED_RANDOM', effect: 'SELF_RANDOM_IMPULSE', maxUses: 1, power: 1.4 },
  { id: 'DRAGON_ROAR', displayName: '용의 포효', trigger: 'SCHEDULED_RANDOM', effect: 'CONE_IMPULSE', maxUses: 1, power: 1.3, radius: 5, metadata: { coneAngleDeg: 70 } },
  { id: 'BEAST_LEAP', displayName: '본능적 도약', trigger: 'LOW_SPEED', effect: 'SELF_RANDOM_IMPULSE', maxUses: 2, power: 1, metadata: { downwardBiasWhenStuck: 0.7 } },
  { id: 'BEAST_CHARGE', displayName: '야수 돌진', trigger: 'NEAR_MONSTER', effect: 'TARGETED_DASH', maxUses: 1, power: 1.1, radius: 4, durationMs: 800 },
];

const registry = new Map<SkillType, SkillDefinition>(skillDefinitions.map((definition) => [definition.id, definition]));

export const getSkillDefinition = (skillId: SkillType) => registry.get(skillId);
export const getAllSkillDefinitions = () => [...registry.values()];
export const getRegisteredSkillCount = () => registry.size;
