import './localization';
import { MonsterDebugPanel } from './debug/monsterDebugPanel';
import type { IPhysics } from './IPhysics';
import { MonsterRuntimeController } from './monster/monsterRuntimeController';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import { Roulette } from './roulette';
import { MonsterSkillExecutor } from './skills/monsterSkillExecutor';

registerServiceWorker();

const roulette = new Roulette();
const monsterRuntime = new MonsterRuntimeController();
monsterRuntime.attach(roulette);

const monsterSkillExecutor = new MonsterSkillExecutor(
  monsterRuntime,
  () => (roulette as unknown as { physics?: IPhysics }).physics
);

const searchParams = new URLSearchParams(window.location.search);
const debugEnabled = searchParams.get('debug') === '1';

if (debugEnabled) {
  const debugPanel = new MonsterDebugPanel(monsterRuntime);
  debugPanel.start();
  (window as any).monsterDebugPanel = debugPanel;
}

(window as any).roulette = roulette;
(window as any).options = options;
(window as any).monsterRuntime = monsterRuntime;
(window as any).monsterSkillExecutor = monsterSkillExecutor;
