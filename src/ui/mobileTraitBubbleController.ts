import type { MonsterElement } from '../monster/monsterTypes';
import type { MonsterRuntimeController } from '../monster/monsterRuntimeController';
import { getMonsterVisualIdentity } from '../monster/monsterVisualIdentity';

interface TraitBubbleCopy {
  role: string;
  ability: string;
  matchup: string;
}

const TRAIT_BUBBLE_COPY: Record<MonsterElement, TraitBubbleCopy> = {
  FIRE: {
    role: '폭발 · 역전',
    ability: '강한 순간 가속과 폭발 넉백으로 순위를 크게 흔듭니다.',
    matchup: '물·얼음과 충돌하면 특수 반응이 발생해 변수가 커집니다.',
  },
  WATER: {
    role: '감속 · 제어',
    ability: '주변 몬스터의 속도를 낮춰 안정적으로 흐름을 통제합니다.',
    matchup: '번개와 만나면 주변까지 감속되는 감전 전도가 발생합니다.',
  },
  WIND: {
    role: '광역 · 교란',
    ability: '넓은 돌풍으로 여러 몬스터의 위치를 동시에 흔듭니다.',
    matchup: '돌과 강하게 충돌하면 바람 쪽이 더 크게 튕겨날 수 있습니다.',
  },
  MAGIC: {
    role: '혼돈 · 변수',
    ability: '공간 소용돌이로 주변 몬스터의 진행 방향을 예측하기 어렵게 만듭니다.',
    matchup: '고정 카운터보다 다수전과 밀집 구간에서 강한 변수형입니다.',
  },
  STONE: {
    role: '중량 · 몸싸움',
    ability: '높은 질량과 초중량 돌진으로 충돌에서 쉽게 밀리지 않습니다.',
    matchup: '바람과의 충돌에서 안정적이며 상대를 더 크게 튕겨낼 수 있습니다.',
  },
  LIGHTNING: {
    role: '순간 속도 · 기절',
    ability: '빠른 순간 가속과 짧은 광역 기절로 결정적인 타이밍을 끊습니다.',
    matchup: '흙은 번개 기절을 방어하며, 물과 만나면 감전 전도가 발생합니다.',
  },
  EARTH: {
    role: '방어 · 지형',
    ability: '번개 기절을 막고 경사면에서 안정적인 추가 가속을 얻습니다.',
    matchup: '번개에 강하지만 얼음보다 최고 경사 속도는 낮아 안정성에 특화됩니다.',
  },
  ICE: {
    role: '관성 · 고속',
    ability: '낮은 마찰과 경사면 가속으로 얻은 속도를 오래 유지합니다.',
    matchup: '불과 충돌하면 열충격으로 잠시 활주력이 약해집니다.',
  },
  DRAGON: {
    role: '강력 · 저빈도',
    ability: '사용 횟수는 적지만 강한 가속과 전방 포효로 한 번에 판을 뒤집습니다.',
    matchup: '특정 카운터보다 강한 한 방과 타이밍이 핵심입니다.',
  },
  BEAST: {
    role: '추적 · 탈출',
    ability: '느려지면 도약하고 가까운 상대가 있으면 직접 돌진합니다.',
    matchup: '막힘이 잦고 몬스터가 밀집한 구간에서 역전 기회가 커집니다.',
  },
};

export class MobileTraitBubbleController {
  private readonly query = window.matchMedia('(max-width: 640px)');
  private root?: HTMLElement;
  private bubble?: HTMLDivElement;
  private mounted = false;

  constructor(private runtime: MonsterRuntimeController) {}

  mount() {
    if (this.mounted) return;
    this.mounted = true;

    const root = document.querySelector<HTMLElement>('.trait-picker');
    const traitsSection = root?.querySelector<HTMLElement>('.trait-picker__traits');
    const traitsHead = traitsSection?.querySelector<HTMLElement>('.trait-picker__traits-head');
    if (!root || !traitsSection || !traitsHead) return;

    this.root = root;
    const bubble = document.createElement('div');
    bubble.className = 'trait-picker__trait-bubble';
    bubble.hidden = true;
    bubble.setAttribute('aria-live', 'polite');
    traitsHead.insertAdjacentElement('afterend', bubble);
    this.bubble = bubble;

    root.addEventListener('click', this.handleTraitClick, true);
  }

  private handleTraitClick = (event: MouseEvent) => {
    if (!this.query.matches || !this.bubble) return;
    const card = (event.target as Element | null)?.closest<HTMLElement>('.trait-picker__card');
    if (!card) return;

    const element = card.dataset.element as MonsterElement | undefined;
    if (!element) return;

    const trait = this.runtime.getAvailableTraits().find((entry) => entry.element === element);
    const copy = TRAIT_BUBBLE_COPY[element];
    if (!trait || !copy) return;

    const visual = getMonsterVisualIdentity(element);
    this.bubble.style.setProperty('--trait-primary', visual.primaryColor);
    this.bubble.style.setProperty('--trait-secondary', visual.secondaryColor);
    this.bubble.style.setProperty('--trait-glow', visual.glowColor);
    this.bubble.innerHTML = `
      <span class="trait-picker__trait-bubble-icon">${visual.icon}</span>
      <span class="trait-picker__trait-bubble-copy">
        <span class="trait-picker__trait-bubble-title"><strong>${trait.selectionName}</strong><em>${copy.role}</em></span>
        <span class="trait-picker__trait-bubble-ability">${copy.ability}</span>
        <span class="trait-picker__trait-bubble-matchup"><b>상성</b>${copy.matchup}</span>
      </span>
    `;
    this.bubble.hidden = false;
  };
}
