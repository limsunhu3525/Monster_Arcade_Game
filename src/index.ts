import './localization';
import { MonsterDebugPanel } from './debug/monsterDebugPanel';
import { MonsterRuntimeController } from './monster/monsterRuntimeController';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import { Roulette } from './roulette';

registerServiceWorker();

const roulette = new Roulette();
const monsterRuntime = new MonsterRuntimeController();
monsterRuntime.attach(roulette);

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
