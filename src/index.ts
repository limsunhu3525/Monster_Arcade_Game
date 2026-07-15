import './localization';
import { MonsterCollisionReactionSystem } from './collision/monsterCollisionReactionSystem';
import { registerCrazyMap } from './data/registerCrazyMap';
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
import { MobileTraitBubbleController } from './ui/mobileTraitBubbleController';
import { ResultModal } from './ui/resultModal';
import { SelectionScrollPreserver } from './ui/selectionScrollPreserver';
import './ui/selectionImageQuality.scss';
import './ui/setupFlowOverrides.scss';
import { StartScreen } from './ui/startScreen';
import { TraitSelectionModal } from './ui/traitSelectionModal';
import './ui/mobileSplitSetup.scss';
import './ui/mobileParticipantGridAndBubble.scss';

const DEFAULT_GAME_SPEED = 0.65;
const HISTORY_VIEW_KEY = 'monsterArcadeView';

type AppHistoryView = 'home' | 'setup' | 'race';

const getHistoryView = (): AppHistoryView | undefined => window.history.state?.[HISTORY_VIEW_KEY];
const replaceHistoryView = (view: AppHistoryView) => {
  window.history.replaceState({ ...(window.history.state ?? {}), [HISTORY_VIEW_KEY]: view }, '', window.location.href);
};
const pushHistoryView = (view: AppHistoryView) => {
  window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_VIEW_KEY]: view }, '', window.location.href);
};

applyMonsterArcadeBranding();
registerServiceWorker();
cleanupLegacyUi();
registerCrazyMap();
replaceHistoryView('home');

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
let setupViewOpen = false;

const startRaceFromSetup = () => {
  setupViewOpen = false;
  replaceHistoryView('race');
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

const mobileTraitBubbleController = new MobileTraitBubbleController(monsterRuntime);
mobileTraitBubbleController.mount();

const selectionScrollPreserver = new SelectionScrollPreserver();
selectionScrollPreserver.mount();

const showHome = () => {
  setupViewOpen = false;
  traitSelectionModal.close();
  startScreen.show();
  replaceHistoryView('home');
};

const openSetupFromHome = () => {
  if (getHistoryView() !== 'home') replaceHistoryView('home');
  pushHistoryView('setup');
  setupViewOpen = true;
  startScreen.hide();
  traitSelectionModal.open();
};

const returnHomeFromSetup = () => {
  if (!setupViewOpen) return;

  setupViewOpen = false;
  traitSelectionModal.close();
  startScreen.show();

  if (getHistoryView() === 'setup') {
    window.history.back();
  } else {
    replaceHistoryView('home');
  }
};

startScreen.mount(openSetupFromHome);

document.addEventListener('click', (event) => {
  if (!setupViewOpen) return;
  const target = event.target as Element | null;
  if (!target?.closest('.trait-picker__close, .trait-picker__cancel, .trait-picker__backdrop')) return;
  returnHomeFromSetup();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && setupViewOpen) returnHomeFromSetup();
});

window.addEventListener('popstate', () => {
  const view = getHistoryView();

  if (view === 'setup') {
    setupViewOpen = true;
    startScreen.hide();
    traitSelectionModal.open();
    return;
  }

  if (setupViewOpen) {
    setupViewOpen = false;
    traitSelectionModal.close();
    startScreen.show();
  }
});

const prepareNextRace = () => {
  roulette.reset();
};

const resultModal = new ResultModal(monsterRuntime, {
  showHome: () => {
    prepareNextRace();
    showHome();
  },
  openSetup: () => {
    prepareNextRace();
    replaceHistoryView('home');
    openSetupFromHome();
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
(window as any).mobileTraitBubbleController = mobileTraitBubbleController;
(window as any).selectionScrollPreserver = selectionScrollPreserver;
(window as any).resultModal = resultModal;
(window as any).startScreen = startScreen;
(window as any).DEFAULT_GAME_SPEED = DEFAULT_GAME_SPEED;
