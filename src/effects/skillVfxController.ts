import type { GameObject } from '../gameObject';
import type { IPhysics } from '../IPhysics';
import { getMonsterDefinition } from '../monster/monsterRegistry';
import type { MonsterRuntimeController, MonsterSkillExecutedDetail } from '../monster/monsterRuntimeController';
import { getSkillDefinition } from '../skills/skillRegistry';
import { SkillActivationEffect, type SkillVfxStyle } from './skillActivationEffect';

export class SkillVfxController {
  constructor(
    private readonly runtime: MonsterRuntimeController,
    private readonly getPhysics: () => IPhysics | undefined,
    private readonly addEffect: (effect: GameObject) => void
  ) {
    this.runtime.addEventListener(
      'skillexecuted',
      ((event: CustomEvent<MonsterSkillExecutedDetail>) => this.spawn(event.detail)) as EventListener
    );
  }

  private spawn(detail: MonsterSkillExecutedDetail) {
    const physics = this.getPhysics();
    const skill = getSkillDefinition(detail.skillId as any);
    const monster = getMonsterDefinition(detail.definitionId);
    if (!physics || !skill || !monster) return;

    const position = physics.getMarblePosition(detail.marbleId);
    const style = monster.element as SkillVfxStyle;
    const radius = Math.max(1.8, Math.min(4.8, skill.radius ?? 2.4));

    this.addEffect(new SkillActivationEffect(position.x, position.y, skill.displayName, style, radius));
  }
}
