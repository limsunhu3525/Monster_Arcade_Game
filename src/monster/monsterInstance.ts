import type { ActiveStatusEffect } from '../status/statusEffect';
import type { SkillRuntimeState } from '../skills/skillDefinition';
import type { MonsterDefinition } from './monsterDefinition';

export interface MonsterInstance {
  instanceId: string;
  definitionId: string;
  marbleId: number;
  currentRank?: number;
  finished: boolean;
  finishRank?: number;
  skills: SkillRuntimeState[];
  activeStatusEffects: ActiveStatusEffect[];
}

export const createMonsterInstance = (
  definition: MonsterDefinition,
  marbleId: number,
  instanceId: string = `${definition.id}-${marbleId}`
): MonsterInstance => ({
  instanceId,
  definitionId: definition.id,
  marbleId,
  finished: false,
  skills: definition.skills.map((skillId) => ({
    skillId,
    remainingUses: 0,
  })),
  activeStatusEffects: [],
});
