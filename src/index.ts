import './localization';
import { MonsterCollisionReactionSystem } from './collision/monsterCollisionReactionSystem';
import { MonsterDebugPanel } from './debug/monsterDebugPanel';
import { CollisionReactionVfxController } from './effects/collisionReactionVfxController';
import type { GameObject } from './gameObject';
import type { IPhysics } from './IPhysics';
import { MonsterRuntimeController } from './monster/monsterRuntimeController';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import { Roulette } from './roulette';
import { MonsterSkillExecutor } from './skills/monsterSkillExecutor';
import { TraitSelectionModal } from './ui/traitSelectionModal';

const DEFAULT_GAME_SPEED = 0.65;

registerServiceWorker();

const roulette = new Roulette();
roulette.setSpeed(DEFAULT_GAME_SPEED);

const monsterRuntime = new MonsterRuntimeController();
monsterRuntime.attach(roulette);

const traitSelectionModal = new TraitSelectionModal(monsterRuntime);
traitSelectionModal.mount();

const getPhysics = () => (roulette as unknown as { physics?: IPhysics }).physics;
const addEffect = (effect: GameObject) => {
  const effectHost = roulette as unknown as { _effects?: GameObject[] };
  effectHost._effects?.push(effect);
};

const monsterSkillExecutor = new MonsterSkillExecutor(monsterRuntime, getPhysics);

const monsterCollisionReactionSystem = new MonsterCollisionReactionSystem(monsterRuntime, getPhysics);
monsterCollisionReactionSystem.attach(roulette);

const collisionReactionVfxController = new CollisionReactionVfxController(monsterRuntime, getPhysics, addEffect);

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
(window as any).monsterCollisionReactionSystem = monsterCollisionReactionSystem;
(window as any).collisionReactionVfxController = collisionReactionVfxController;
(window as any).traitSelectionModal = traitSelectionModal;
(window as any).DEFAULT_GAME_SPEED = DEFAULT_GAME_SPEED;
