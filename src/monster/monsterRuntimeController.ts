import type { Marble } from '../marble';
import { getSkillDefinition } from '../skills/skillRegistry';
import type { SkillRuntimeState } from '../skills/skillDefinition';
import { bindMarbleToMonster, type MarbleMonsterBinding } from './marbleMonsterAdapter';
import { getAllMonsterDefinitions, getMonsterDefinition } from './monsterRegistry';

const DEFAULT_RACE_DURATION_MS = 30_000;
const SCHEDULE_START_MS = 3_000;
const SCHEDULE_END_MS = 28_000;

export interface MonsterRuntimeSnapshot {
  raceTimeMs: number;
  running: boolean;
  monsters: Array<{
    marbleId: number;
    name: string;
    definitionId: string;
    displayName: string;
    element: string;
    rank: number;
    skills: Array<{
      skillId: string;
      displayName: string;
      remainingUses: number;
      nextScheduledAtMs?: number;
      nextInMs?: number;
    }>;
  }>;
}

export interface MonsterSkillDueDetail {
  marbleId: number;
  monsterInstanceId: string;
  definitionId: string;
  skillId: string;
  raceTimeMs: number;
}

/**
 * Transitional integration layer between the original Marble Roulette engine and
 * the new monster domain model. It deliberately leaves the original Roulette
 * implementation intact and wraps only public/runtime hooks.
 */
export class MonsterRuntimeController extends EventTarget {
  private bindings: MarbleMonsterBinding[] = [];
  private raceTimeMs = 0;
  private running = false;
  private attached = false;

  attach(roulette: any) {
    if (this.attached) return;
    this.attached = true;

    const originalSetMarbles = roulette.setMarbles.bind(roulette);
    roulette.setMarbles = (names: string[]) => {
      originalSetMarbles(names);
      this.bindMarbles(roulette._marbles ?? []);
    };

    const originalStart = roulette.start.bind(roulette);
    roulette.start = () => {
      this.prepareRaceSchedule();
      this.running = true;
      originalStart();
    };

    const originalReset = roulette.reset.bind(roulette);
    roulette.reset = () => {
      this.resetRaceState();
      originalReset();
    };

    const originalUpdateMarbles = roulette._updateMarbles.bind(roulette);
    roulette._updateMarbles = (deltaTime: number) => {
      originalUpdateMarbles(deltaTime);
      this.update(deltaTime, roulette._marbles ?? []);
    };

    // Support attaching after marbles have already been created.
    if ((roulette._marbles ?? []).length > 0) {
      this.bindMarbles(roulette._marbles);
    }
  }

  getSnapshot(): MonsterRuntimeSnapshot {
    return {
      raceTimeMs: this.raceTimeMs,
      running: this.running,
      monsters: this.bindings.map(({ marble, monster }) => {
        const definition = getMonsterDefinition(monster.definitionId);
        return {
          marbleId: marble.id,
          name: marble.name,
          definitionId: monster.definitionId,
          displayName: definition?.displayName ?? monster.definitionId,
          element: definition?.element ?? 'UNKNOWN',
          rank: monster.currentRank ?? 0,
          skills: monster.skills.map((skill) => {
            const definition = getSkillDefinition(skill.skillId);
            return {
              skillId: skill.skillId,
              displayName: definition?.displayName ?? skill.skillId,
              remainingUses: skill.remainingUses,
              nextScheduledAtMs: skill.nextScheduledAtMs,
              nextInMs:
                skill.nextScheduledAtMs === undefined
                  ? undefined
                  : Math.max(0, skill.nextScheduledAtMs - this.raceTimeMs),
            };
          }),
        };
      }),
    };
  }

  private bindMarbles(marbles: Marble[]) {
    const definitions = getAllMonsterDefinitions();
    if (definitions.length === 0) {
      this.bindings = [];
      return;
    }

    const ordered = [...marbles].sort((a, b) => a.id - b.id);
    this.bindings = ordered.map((marble, index) => {
      const definition = definitions[index % definitions.length];
      return bindMarbleToMonster(marble, definition.id, `${definition.id}-${marble.id}`);
    });

    this.resetRaceState(false);
    this.dispatchEvent(new CustomEvent('rosterchange', { detail: this.getSnapshot() }));
  }

  private prepareRaceSchedule() {
    this.raceTimeMs = 0;

    this.bindings.forEach(({ monster }) => {
      monster.finished = false;
      monster.finishRank = undefined;
      monster.currentRank = undefined;

      monster.skills.forEach((skill) => {
        const definition = getSkillDefinition(skill.skillId);
        const maxUses = definition?.maxUses ?? 0;
        skill.remainingUses = maxUses;
        skill.lastUsedAtMs = undefined;
        skill.scheduledUsesMs = this.createSegmentedSchedule(maxUses, DEFAULT_RACE_DURATION_MS);
        skill.nextScheduledAtMs = skill.scheduledUsesMs[0];
      });
    });

    this.dispatchEvent(new CustomEvent('scheduleready', { detail: this.getSnapshot() }));
  }

  private createSegmentedSchedule(uses: number, raceDurationMs: number): number[] {
    if (uses <= 0) return [];

    const end = Math.min(SCHEDULE_END_MS, raceDurationMs - 2_000);
    const span = Math.max(1, end - SCHEDULE_START_MS);
    const segmentSize = span / uses;

    return Array.from({ length: uses }, (_, index) => {
      const segmentStart = SCHEDULE_START_MS + segmentSize * index;
      const segmentEnd = SCHEDULE_START_MS + segmentSize * (index + 1);
      return Math.round(segmentStart + Math.random() * Math.max(1, segmentEnd - segmentStart));
    }).sort((a, b) => a - b);
  }

  private update(deltaTime: number, activeMarbles: Marble[]) {
    if (!this.running) return;

    this.raceTimeMs += deltaTime;
    this.updateRanks(activeMarbles);

    this.bindings.forEach(({ monster }) => {
      monster.skills.forEach((skill) => this.processDueSkill(monster.instanceId, monster.definitionId, monster.marbleId, skill));
    });
  }

  private updateRanks(activeMarbles: Marble[]) {
    const ranks = new Map<number, number>();
    [...activeMarbles]
      .sort((a, b) => b.y - a.y)
      .forEach((marble, index) => ranks.set(marble.id, index + 1));

    this.bindings.forEach(({ monster }) => {
      monster.currentRank = ranks.get(monster.marbleId) ?? monster.currentRank;
    });
  }

  private processDueSkill(
    monsterInstanceId: string,
    definitionId: string,
    marbleId: number,
    skill: SkillRuntimeState
  ) {
    while (
      skill.remainingUses > 0 &&
      skill.nextScheduledAtMs !== undefined &&
      this.raceTimeMs >= skill.nextScheduledAtMs
    ) {
      skill.lastUsedAtMs = skill.nextScheduledAtMs;
      skill.remainingUses -= 1;
      skill.scheduledUsesMs?.shift();
      skill.nextScheduledAtMs = skill.scheduledUsesMs?.[0];

      const detail: MonsterSkillDueDetail = {
        marbleId,
        monsterInstanceId,
        definitionId,
        skillId: skill.skillId,
        raceTimeMs: this.raceTimeMs,
      };
      this.dispatchEvent(new CustomEvent<MonsterSkillDueDetail>('skilldue', { detail }));
    }
  }

  private resetRaceState(clearBindings: boolean = false) {
    this.raceTimeMs = 0;
    this.running = false;

    if (clearBindings) {
      this.bindings = [];
      return;
    }

    this.bindings.forEach(({ monster }) => {
      monster.currentRank = undefined;
      monster.finished = false;
      monster.finishRank = undefined;
      monster.skills.forEach((skill) => {
        const definition = getSkillDefinition(skill.skillId);
        skill.remainingUses = definition?.maxUses ?? 0;
        skill.scheduledUsesMs = [];
        skill.nextScheduledAtMs = undefined;
        skill.lastUsedAtMs = undefined;
      });
      monster.activeStatusEffects = [];
    });
  }
}
