import type { MonsterElement } from './monsterTypes';

export interface MonsterSpriteAsset {
  id: string;
  name: string;
  element: MonsterElement;
  spriteUrl: string;
  isDefault?: boolean;
}

const monsterPath = (fileName: string) => `/assets/images/monsters/${fileName}`;

export const MONSTER_SPRITE_OPTIONS: MonsterSpriteAsset[] = [
  { id: 'fire-hwaseumdochi', name: '화슴도치', element: 'FIRE', spriteUrl: monsterPath('fire-hwaseumdochi.webp'), isDefault: true },
  { id: 'water-muneopo', name: '무너포', element: 'WATER', spriteUrl: monsterPath('water-muneopo.webp'), isDefault: true },
  { id: 'wind-sanddog', name: '샌드독', element: 'WIND', spriteUrl: monsterPath('wind-sanddog.webp'), isDefault: true },
  { id: 'magic-ebiu', name: '에비우', element: 'MAGIC', spriteUrl: monsterPath('magic-ebiu.webp'), isDefault: true },
  { id: 'stone-toddog', name: '토드독', element: 'STONE', spriteUrl: monsterPath('stone-toddog.webp'), isDefault: true },
  { id: 'lightning-pajigi', name: '파지기', element: 'LIGHTNING', spriteUrl: monsterPath('lightning-pajigi.webp'), isDefault: true },
  { id: 'earth-digmole', name: '디그몰', element: 'EARTH', spriteUrl: monsterPath('earth-digmole.webp'), isDefault: true },
  { id: 'earth-pureujwi', name: '푸르쥐', element: 'EARTH', spriteUrl: monsterPath('earth-pureujwi.webp') },
  { id: 'ice-godeureumi', name: '고드르미', element: 'ICE', spriteUrl: monsterPath('ice-godeureumi.webp'), isDefault: true },
  { id: 'dragon-mustagnon', name: '머스타뇽', element: 'DRAGON', spriteUrl: monsterPath('dragon-mustagnon.webp'), isDefault: true },
  { id: 'beast-igri', name: '이그리', element: 'BEAST', spriteUrl: monsterPath('beast-igri.webp'), isDefault: true },
  { id: 'beast-shrimpunch', name: '쉬림펀치', element: 'BEAST', spriteUrl: monsterPath('beast-shrimpunch.webp') },
];

export const getDefaultMonsterSprite = (element: MonsterElement) =>
  MONSTER_SPRITE_OPTIONS.find((asset) => asset.element === element && asset.isDefault)?.spriteUrl;

export const getMonsterSpritesByElement = (element: MonsterElement) =>
  MONSTER_SPRITE_OPTIONS.filter((asset) => asset.element === element);
