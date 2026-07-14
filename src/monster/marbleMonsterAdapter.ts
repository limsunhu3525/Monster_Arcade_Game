import type { Marble } from '../marble';
import { createMonsterInstance, type MonsterInstance } from './monsterInstance';
import { getMonsterDefinition } from './monsterRegistry';
import { getMonsterVisualIdentity } from './monsterVisualIdentity';

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

  const visual = getMonsterVisualIdentity(definition.element);
  marble.setTraitVisual({
    traitName: definition.selectionName,
    icon: visual.icon,
    primaryColor: visual.primaryColor,
    secondaryColor: visual.secondaryColor,
    glowColor: visual.glowColor,
    spriteUrl: definition.spriteUrl,
  });

  return {
    marble,
    monster: createMonsterInstance(definition, marble.id, instanceId),
  };
};
