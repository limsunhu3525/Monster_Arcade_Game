import type { MonsterDefinition } from './monsterDefinition';

const monsterDefinitions: MonsterDefinition[] = [
  {
    id: 'fire-archetype',
    displayName: '불 타입',
    element: 'FIRE',
    stats: { massMultiplier: 1, frictionMultiplier: 1, restitutionMultiplier: 1, statusDurationMultiplier: 1 },
    skills: ['FIRE_ACCELERATION', 'FIRE_EXPLOSION'],
    tags: ['high-risk', 'burst', 'chaos'],
  },
  {
    id: 'water-archetype',
    displayName: '물 타입',
    element: 'WATER',
    stats: { massMultiplier: 1, frictionMultiplier: 1, restitutionMultiplier: 0.9, statusDurationMultiplier: 1 },
    skills: ['WATER_ACCELERATION', 'WATER_EXPLOSION'],
    tags: ['control', 'slow'],
  },
  {
    id: 'wind-archetype',
    displayName: '바람 타입',
    element: 'WIND',
    stats: { massMultiplier: 0.9, frictionMultiplier: 1, restitutionMultiplier: 1, statusDurationMultiplier: 1 },
    skills: ['WIND_ACCELERATION', 'WIND_EXPLOSION'],
    tags: ['wide-area', 'displacement'],
  },
  {
    id: 'magic-archetype',
    displayName: '고스트/마법 타입',
    element: 'MAGIC',
    stats: { massMultiplier: 0.95, frictionMultiplier: 1, restitutionMultiplier: 1, statusDurationMultiplier: 0.9 },
    skills: ['GHOST_SHIFT', 'SPACE_DISTORTION'],
    tags: ['chaos', 'random-displacement'],
  },
  {
    id: 'stone-archetype',
    displayName: '돌 타입',
    element: 'STONE',
    stats: { massMultiplier: 1.25, frictionMultiplier: 1, restitutionMultiplier: 0.8, statusDurationMultiplier: 1 },
    skills: ['STONE_HEAVY_MODE', 'STONE_FRAGMENT_EXPLOSION'],
    tags: ['heavy', 'collision'],
  },
  {
    id: 'lightning-archetype',
    displayName: '번개 타입',
    element: 'LIGHTNING',
    stats: { massMultiplier: 1, frictionMultiplier: 1, restitutionMultiplier: 1, statusDurationMultiplier: 1 },
    skills: ['LIGHTNING_ACCELERATION', 'LIGHTNING_EXPLOSION'],
    tags: ['speed', 'stun'],
  },
  {
    id: 'earth-archetype',
    displayName: '흙 타입',
    element: 'EARTH',
    stats: { massMultiplier: 1.05, frictionMultiplier: 1.2, restitutionMultiplier: 0.8, statusDurationMultiplier: 1 },
    skills: ['EARTH_WALL_RUN', 'EARTH_QUAKE'],
    tags: ['stable', 'terrain'],
  },
  {
    id: 'ice-archetype',
    displayName: '얼음 타입',
    element: 'ICE',
    stats: { massMultiplier: 1, frictionMultiplier: 0.65, restitutionMultiplier: 1, statusDurationMultiplier: 1 },
    skills: ['ICE_GLIDE', 'ICE_EXPLOSION'],
    tags: ['slippery', 'momentum'],
  },
  {
    id: 'dragon-archetype',
    displayName: '드래곤 타입',
    element: 'DRAGON',
    stats: { massMultiplier: 1.1, frictionMultiplier: 1, restitutionMultiplier: 1, statusDurationMultiplier: 0.75 },
    skills: ['DRAGON_WING_BURST', 'DRAGON_ROAR'],
    tags: ['powerful', 'low-frequency'],
  },
  {
    id: 'beast-archetype',
    displayName: '동물/야수 타입',
    element: 'BEAST',
    stats: { massMultiplier: 0.9, frictionMultiplier: 1, restitutionMultiplier: 1, statusDurationMultiplier: 0.9 },
    skills: ['BEAST_LEAP', 'BEAST_CHARGE'],
    tags: ['agile', 'collision'],
  },
];

const registry = new Map<string, MonsterDefinition>(monsterDefinitions.map((definition) => [definition.id, definition]));

export const getMonsterDefinition = (monsterId: string) => registry.get(monsterId);
export const getAllMonsterDefinitions = () => [...registry.values()];
export const getRegisteredMonsterCount = () => registry.size;
