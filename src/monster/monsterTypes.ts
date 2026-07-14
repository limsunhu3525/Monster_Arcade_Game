export const MONSTER_ELEMENTS = [
  'FIRE',
  'WATER',
  'WIND',
  'MAGIC',
  'STONE',
  'LIGHTNING',
  'EARTH',
  'ICE',
  'DRAGON',
  'BEAST',
] as const;

export type MonsterElement = (typeof MONSTER_ELEMENTS)[number];

export const isMonsterElement = (value: string): value is MonsterElement =>
  MONSTER_ELEMENTS.includes(value as MonsterElement);
