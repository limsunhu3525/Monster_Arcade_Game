import type { Marble } from '../marble';
import { createMonsterInstance, type MonsterInstance } from './monsterInstance';
import { getMonsterDefinition } from './monsterRegistry';

export interface MarbleMonsterBinding {
  marble: Marble;
  monster: MonsterInstance;
}

export const bindMarbleToMonster = (
  marble: Marble,
  definitionId: string,
  instanceId?: string
): MarbleMonsterBinding => {
  const definition = getMonsterDefinition(definitionId);

  if (!definition) {
    throw new Error(`Unknown monster definition: ${definitionId}`);
  }

  return {
    marble,
    monster: createMonsterInstance(definition, marble.id, instanceId),
  };
};
