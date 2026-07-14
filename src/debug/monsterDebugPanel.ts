import { getSkillDefinition } from '../skills/skillRegistry';
import type { MonsterRuntimeController, MonsterSkillDueDetail } from '../monster/monsterRuntimeController';

const MAX_VISIBLE_MONSTERS = 10;
const MAX_LOG_LINES = 8;

export class MonsterDebugPanel {
  private root: HTMLDivElement;
  private content: HTMLDivElement;
  private log: HTMLDivElement;
  private logs: string[] = [];
  private updateTimer: number | undefined;

  constructor(private runtime: MonsterRuntimeController) {
    this.root = document.createElement('div');
    this.content = document.createElement('div');
    this.log = document.createElement('div');

    this.root.id = 'monster-debug-panel';
    this.root.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'z-index:99999',
      'width:min(430px,calc(100vw - 24px))',
      'max-height:calc(100vh - 24px)',
      'overflow:auto',
      'padding:12px',
      'border:1px solid rgba(255,255,255,.22)',
      'border-radius:10px',
      'background:rgba(10,14,20,.88)',
      'backdrop-filter:blur(8px)',
      'color:#f4f7fb',
      'font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'box-shadow:0 10px 30px rgba(0,0,0,.35)',
      'pointer-events:none',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = 'MONSTER ENGINE DEBUG';
    title.style.cssText = 'font-weight:700;font-size:13px;margin-bottom:8px;letter-spacing:.04em';

    this.log.style.cssText = [
      'margin-top:10px',
      'padding-top:8px',
      'border-top:1px solid rgba(255,255,255,.15)',
      'color:#b8c4d4',
      'white-space:pre-wrap',
    ].join(';');

    this.root.append(title, this.content, this.log);
    document.body.appendChild(this.root);

    this.runtime.addEventListener('skilldue', ((event: CustomEvent<MonsterSkillDueDetail>) => {
      const skill = getSkillDefinition(event.detail.skillId as any);
      this.pushLog(
        `${(event.detail.raceTimeMs / 1000).toFixed(2)}s  #${event.detail.marbleId}  ${skill?.displayName ?? event.detail.skillId}  DUE`
      );
    }) as EventListener);

    this.runtime.addEventListener('scheduleready', (() => {
      this.pushLog('Race schedule generated');
    }) as EventListener);

    this.runtime.addEventListener('rosterchange', (() => {
      this.pushLog('Monster roster bound to marbles');
    }) as EventListener);
  }

  start() {
    if (this.updateTimer !== undefined) return;
    this.render();
    this.updateTimer = window.setInterval(() => this.render(), 100);
  }

  stop() {
    if (this.updateTimer === undefined) return;
    window.clearInterval(this.updateTimer);
    this.updateTimer = undefined;
  }

  private render() {
    const snapshot = this.runtime.getSnapshot();
    const header = [
      `Mode      MONSTER`,
      `Race      ${snapshot.running ? 'RUNNING' : 'READY'}`,
      `Time      ${(snapshot.raceTimeMs / 1000).toFixed(1)}s`,
      `Monsters  ${snapshot.monsters.length}`,
    ].join('\n');

    const monsterLines = snapshot.monsters.slice(0, MAX_VISIBLE_MONSTERS).map((monster) => {
      const nextSkill = monster.skills
        .filter((skill) => skill.nextInMs !== undefined)
        .sort((a, b) => (a.nextInMs ?? Infinity) - (b.nextInMs ?? Infinity))[0];

      const nextText = nextSkill
        ? `${nextSkill.displayName} ${(nextSkill.nextInMs! / 1000).toFixed(1)}s`
        : 'no scheduled skill';
      const remaining = monster.skills.reduce((sum, skill) => sum + skill.remainingUses, 0);

      return `#${String(monster.rank || '-').padStart(2, ' ')}  [${monster.element.padEnd(9, ' ')}] ${monster.name}  | uses ${remaining} | ${nextText}`;
    });

    if (snapshot.monsters.length > MAX_VISIBLE_MONSTERS) {
      monsterLines.push(`... +${snapshot.monsters.length - MAX_VISIBLE_MONSTERS} more`);
    }

    this.content.textContent = `${header}\n\n${monsterLines.join('\n')}`;
    this.log.textContent = this.logs.length ? `EVENT LOG\n${this.logs.join('\n')}` : 'EVENT LOG\nNo events yet';
  }

  private pushLog(message: string) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, MAX_LOG_LINES);
    this.render();
  }
}
