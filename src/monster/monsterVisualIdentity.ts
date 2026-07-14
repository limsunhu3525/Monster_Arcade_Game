import type { MonsterElement } from './monsterTypes';

export interface MonsterVisualIdentity {
  icon: string;
  eyebrow: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
}

const VISUAL_IDENTITIES: Record<MonsterElement, MonsterVisualIdentity> = {
  FIRE: {
    icon: '🔥',
    eyebrow: '폭발 · 역전',
    primaryColor: '#ff7030',
    secondaryColor: '#ffd258',
    glowColor: 'rgba(255, 112, 48, 0.55)',
  },
  WATER: {
    icon: '💧',
    eyebrow: '감속 · 제어',
    primaryColor: '#44aaff',
    secondaryColor: '#96e6ff',
    glowColor: 'rgba(68, 170, 255, 0.55)',
  },
  WIND: {
    icon: '🌪️',
    eyebrow: '광역 · 교란',
    primaryColor: '#78dcd2',
    secondaryColor: '#befaff',
    glowColor: 'rgba(120, 220, 210, 0.5)',
  },
  MAGIC: {
    icon: '🔮',
    eyebrow: '변칙 · 혼돈',
    primaryColor: '#be6eff',
    secondaryColor: '#ff96f5',
    glowColor: 'rgba(190, 110, 255, 0.55)',
  },
  STONE: {
    icon: '🪨',
    eyebrow: '중량 · 충돌',
    primaryColor: '#aa9682',
    secondaryColor: '#e1cdb4',
    glowColor: 'rgba(170, 150, 130, 0.5)',
  },
  LIGHTNING: {
    icon: '⚡',
    eyebrow: '속도 · 제압',
    primaryColor: '#ffeb5a',
    secondaryColor: '#91cdff',
    glowColor: 'rgba(255, 235, 90, 0.58)',
  },
  EARTH: {
    icon: '🌿',
    eyebrow: '지형 · 안정',
    primaryColor: '#96693c',
    secondaryColor: '#cdaa5a',
    glowColor: 'rgba(150, 105, 60, 0.5)',
  },
  ICE: {
    icon: '❄️',
    eyebrow: '관성 · 미끄러짐',
    primaryColor: '#96ebff',
    secondaryColor: '#e1faff',
    glowColor: 'rgba(150, 235, 255, 0.55)',
  },
  DRAGON: {
    icon: '🐉',
    eyebrow: '강력 · 희소',
    primaryColor: '#ff505f',
    secondaryColor: '#ffbe50',
    glowColor: 'rgba(255, 80, 95, 0.58)',
  },
  BEAST: {
    icon: '🐾',
    eyebrow: '민첩 · 추적',
    primaryColor: '#ffaf46',
    secondaryColor: '#f5ebb9',
    glowColor: 'rgba(255, 175, 70, 0.52)',
  },
};

export const getMonsterVisualIdentity = (element: MonsterElement): MonsterVisualIdentity =>
  VISUAL_IDENTITIES[element];

export const getAllMonsterVisualIdentities = () => ({ ...VISUAL_IDENTITIES });
