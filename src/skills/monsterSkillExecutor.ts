import type { IPhysics } from '../IPhysics';
import { getMonsterDefinition } from '../monster/monsterRegistry';
import type { MonsterRuntimeController, MonsterSkillDueDetail } from '../monster/monsterRuntimeController';
import { getSkillDefinition } from './skillRegistry';

const IMPULSE_UNIT = 8;
const CONDITIONAL_RETRY_MIN_MS