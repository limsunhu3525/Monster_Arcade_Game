import './localization';
import { MonsterCollisionReactionSystem } from './collision/monsterCollisionReactionSystem';
import { MonsterDebugPanel } from './debug/monsterDebugPanel';
import { CollisionReactionVfxController } from './effects/collisionReactionVfxController';
import { SkillVfxController } from './effects/skillVfxController';
import type { GameObject } from './gameObject';
import type { IPhysics } from './IPhysics';
import { EarthLightningDefenseController } from './monster/earthLightningDefenseController';
import { MonsterRuntimeController } from './monster/monsterRuntimeController';
import { TerrainTraitMotionController } from './monster/terrainTraitMotionController';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import { Roulette } from './roulette';
import { MonsterSkillExecutor } from './skills/monsterSkillExecutor';
import { applyMonsterArcadeBranding } from './ui/branding';
import { cleanupLegacyUi } from './ui/legacyUiCleanup';
import './ui/mobileResponsive.scss';
import './ui/mobileCompactOverrides.scss';
import { MobileTraitSetupController } from './ui/mobileTraitSetupController';
import { ResultModal } from './ui/resultModal';
import './ui/selectionImageQuality.scss';
import './ui/setupFlowOverrides.scss';
import { StartScreen } from './ui/startScreen';
import { TraitSelectionModal } from './ui/traitSelectionModal';

const DEFAULT_GAME_SPEED = 0.65;

applyMonsterArcadeBranding();
registerServiceWorker();
cleanupLegacyUi();

const roulette = new Roulette();
roulette.setSpeed(DEFAULT_GAME_SPEED);

const monsterRuntime = new MonsterRuntimeController();
monsterRuntime.attach(roulette);

const setParticipants = (names: string[]) => {
  const normalized = names.map((name) => name.trim()).filter(Boolean);
  const legacyInput = document.querySelector<HTMLTextAreaElement>('#in_names');
  if (legacyInput) legacyInput.value = normalized.join(',');
  localStorage.setItem('mbr_names', normalized.join(','));
  roulette.setMarbles(normalized);
};

const startScreen = new StartScreen();

const startRaceFromSetup = () => {
  startScreen.hide();
  roulette.start();
  document.querySelector('#settings')?.classList.add('hide');
  document.querySelector('#donate')?.classList.add('hide');
};

const traitSelectionModal = new TraitSelectionModal(monsterRuntime, {
  setParticipants,
  startRace: startRaceFromSetup,
});
traitSelectionModal.mount();

const mobileTraitSetupController = new MobileTraitSetupController();
mobileTraitSetupController.mount();

startScreen.mount(() => {
  startScreen.hide();
  traitSelectionModal.open();
});

const prepareNextRace = () => {
  roulette.reset();
};

const resultModal = new ResultModal(monsterRuntime, {
  showHome: () => {
    prepareNextRace();
    startScreen.show();
  },
  openSetup: () => {
    prepareNextRace();
    startScreen.hide();
    traitSelectionModal.open();
  },
});
resultModal.mount(roulette);

const getPhysics = () => (roulette as unknown as { physics?: IPhysics }).physics;
const addEffect = (effect: GameObject) => {
  const effectHost = roulette as unknown as { _effects?: GameObject[] };
  effectHost._effects?.push(effect);
};

const earthLightningDefenseController = new EarthLightningDefenseController(monsterRuntime, getPhysics);
const monsterSkillExecutor = new MonsterSkillExecutor(monsterRuntime, getPhysics);
const skillVfxController = new SkillVfxController(monsterRuntime, getPhysics, addEffect);

const terrainTraitMotionController = new TerrainTraitMotionController(monsterRuntime, getPhysics);
terrainTraitMotionController.attach(roulette);

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
(window as any).earthLightningDefenseController = earthLightningDefenseController;
(window as any).monsterSkillExecutor = monsterSkillExecutor;
(window as any).skillVfxController = skillVfxController;
(window as any).terrainTraitMotionController = terrainTraitMotionController;
(window as any).monsterCollisionReactionSystem = monsterCollisionReactionSystem;
(window as any).collisionReactionVfxController = collisionReactionVfxController;
(window as any).traitSelectionModal = traitSelectionModal;
(window as any).mobileTraitSetupController = mobileTraitSetupController;
(window as any).resultModal = resultModal;
(window as any).startScreen = startScreen;
(window as any).DEFAULT_GAME_SPEED = DEFAULT_GAME_SPEED;
