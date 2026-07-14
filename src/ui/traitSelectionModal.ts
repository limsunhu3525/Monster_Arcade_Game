import type {
  MonsterRuntimeController,
  MonsterRuntimeSnapshot,
  MonsterTraitOption,
} from '../monster/monsterRuntimeController';
import './traitSelectionModal.scss';

const TRAIT_VISUALS: Record<string, { icon: string; eyebrow: string }> = {
  FIRE: { icon: '🔥', eyebrow: '폭발 · 역전' },
  WATER: { icon: '💧', eyebrow: '감속 · 제어' },
  WIND: { icon: '🌪️', eyebrow: '광역 · 교란' },
  MAGIC: { icon: '🔮', eyebrow: '변칙 · 혼돈' },
  STONE: { icon: '🪨', eyebrow: '중량 · 충돌' },
  LIGHTNING: { icon: '⚡', eyebrow: '속도 · 제압' },
  EARTH: { icon: '🌿', eyebrow: '지형 · 안정' },
  ICE: { icon: '❄️', eyebrow: '관성 · 미끄러짐' },
  DRAGON: { icon: '🐉', eyebrow: '강력 · 희소' },
  BEAST: { icon: '🐾', eyebrow: '민첩 · 추적' },
};

interface ParticipantAssignment {
  marbleId: number;
  name: string;
  definitionId: string;
}

export class TraitSelectionModal {
  private root: HTMLDivElement;
  private participantList: HTMLDivElement;
  private traitGrid: HTMLDivElement;
  private activeParticipantLabel: HTMLDivElement;
  private progressLabel: HTMLDivElement;
  private assignments = new Map<number, ParticipantAssignment>();
  private activeMarbleId: number | null = null;
  private bypassNextStart = false;
  private isOpen = false;

  constructor(private runtime: MonsterRuntimeController) {
    this.root = document.createElement('div');
    this.participantList = document.createElement('div');
    this.traitGrid = document.createElement('div');
    this.activeParticipantLabel = document.createElement('div');
    this.progressLabel = document.createElement('div');

    this.root.className = 'trait-picker';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.innerHTML = `
      <div class="trait-picker__backdrop"></div>
      <section class="trait-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="trait-picker-title">
        <header class="trait-picker__header">
          <div>
            <p class="trait-picker__kicker">PRE-RACE SETUP</p>
            <h2 id="trait-picker-title">참가자 특성 선택</h2>
            <p class="trait-picker__subtitle">참가자마다 원하는 플레이 특성을 선택한 뒤 레이스를 시작하세요.</p>
          </div>
          <button type="button" class="trait-picker__close" aria-label="닫기">×</button>
        </header>

        <div class="trait-picker__body">
          <aside class="trait-picker__participants">
            <div class="trait-picker__section-head">
              <span>참가자</span>
              <button type="button" class="trait-picker__auto">자동 배정</button>
            </div>
            <div class="trait-picker__participant-list"></div>
          </aside>

          <main class="trait-picker__traits">
            <div class="trait-picker__active-participant"></div>
            <div class="trait-picker__grid"></div>
          </main>
        </div>

        <footer class="trait-picker__footer">
          <div class="trait-picker__progress"></div>
          <div class="trait-picker__footer-actions">
            <button type="button" class="trait-picker__cancel">취소</button>
            <button type="button" class="trait-picker__confirm">선택 완료 후 시작</button>
          </div>
        </footer>
      </section>
    `;

    const participantList = this.root.querySelector<HTMLDivElement>('.trait-picker__participant-list');
    const traitGrid = this.root.querySelector<HTMLDivElement>('.trait-picker__grid');
    const activeParticipantLabel = this.root.querySelector<HTMLDivElement>('.trait-picker__active-participant');
    const progressLabel = this.root.querySelector<HTMLDivElement>('.trait-picker__progress');

    if (!participantList || !traitGrid || !activeParticipantLabel || !progressLabel) {
      throw new Error('Failed to initialize trait selection modal.');
    }

    this.participantList = participantList;
    this.traitGrid = traitGrid;
    this.activeParticipantLabel = activeParticipantLabel;
    this.progressLabel = progressLabel;
  }

  mount() {
    if (!document.body.contains(this.root)) {
      document.body.appendChild(this.root);
    }

    document.addEventListener('click', this.handleStartCapture, true);
    document.addEventListener('keydown', this.handleKeydown);

    this.root.querySelector('.trait-picker__close')?.addEventListener('click', () => this.close());
    this.root.querySelector('.trait-picker__cancel')?.addEventListener('click', () => this.close());
    this.root.querySelector('.trait-picker__confirm')?.addEventListener('click', () => this.confirmAndStart());
    this.root.querySelector('.trait-picker__auto')?.addEventListener('click', () => this.applyAutomaticAssignment());
    this.root.querySelector('.trait-picker__backdrop')?.addEventListener('click', () => this.close());
  }

  open() {
    const snapshot = this.runtime.getSnapshot();
    if (snapshot.running || snapshot.monsters.length === 0) return;

    this.assignments = new Map(
      snapshot.monsters.map((monster) => [
        monster.marbleId,
        {
          marbleId: monster.marbleId,
          name: monster.name,
          definitionId: monster.definitionId,
        },
      ])
    );
    this.activeMarbleId = snapshot.monsters[0]?.marbleId ?? null;
    this.isOpen = true;
    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('trait-picker-open');
    this.render(snapshot, this.runtime.getAvailableTraits());
  }

  close() {
    this.isOpen = false;
    this.root.classList.remove('is-open');
    this.root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('trait-picker-open');
  }

  private handleStartCapture = (event: MouseEvent) => {
    const target = event.target as Element | null;
    const startButton = target?.closest('#btnStart');
    if (!startButton) return;

    if (this.bypassNextStart) {
      this.bypassNextStart = false;
      return;
    }

    const snapshot = this.runtime.getSnapshot();
    if (snapshot.monsters.length === 0 || snapshot.running) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    this.open();
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (!this.isOpen) return;
    if (event.key === 'Escape') this.close();
  };

  private render(snapshot: MonsterRuntimeSnapshot, traits: MonsterTraitOption[]) {
    this.renderParticipants(snapshot, traits);
    this.renderTraits(traits);
    this.renderProgress(snapshot.monsters.length);
  }

  private renderParticipants(snapshot: MonsterRuntimeSnapshot, traits: MonsterTraitOption[]) {
    const traitById = new Map(traits.map((trait) => [trait.definitionId, trait]));
    this.participantList.replaceChildren();

    snapshot.monsters.forEach((monster, index) => {
      const assignment = this.assignments.get(monster.marbleId);
      const trait = assignment ? traitById.get(assignment.definitionId) : undefined;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trait-picker__participant';
      button.classList.toggle('is-active', monster.marbleId === this.activeMarbleId);
      button.innerHTML = `
        <span class="trait-picker__participant-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="trait-picker__participant-copy">
          <strong>${this.escapeHtml(monster.name)}</strong>
          <small>${this.escapeHtml(trait?.selectionName ?? '특성 미선택')}</small>
        </span>
        <span class="trait-picker__participant-arrow">›</span>
      `;
      button.addEventListener('click', () => {
        this.activeMarbleId = monster.marbleId;
        this.render(snapshot, traits);
      });
      this.participantList.appendChild(button);
    });
  }

  private renderTraits(traits: MonsterTraitOption[]) {
    this.traitGrid.replaceChildren();
    const activeAssignment = this.activeMarbleId === null ? undefined : this.assignments.get(this.activeMarbleId);

    this.activeParticipantLabel.innerHTML = activeAssignment
      ? `<span>현재 선택</span><strong>${this.escapeHtml(activeAssignment.name)}</strong>`
      : '<span>참가자를 선택하세요</span>';

    traits.forEach((trait) => {
      const visual = TRAIT_VISUALS[trait.element] ?? { icon: '✦', eyebrow: '특수 특성' };
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'trait-picker__card';
      card.dataset.element = trait.element;
      card.classList.toggle('is-selected', activeAssignment?.definitionId === trait.definitionId);
      card.innerHTML = `
        <span class="trait-picker__card-icon" aria-hidden="true">${visual.icon}</span>
        <span class="trait-picker__card-copy">
          <small>${this.escapeHtml(visual.eyebrow)}</small>
          <strong>${this.escapeHtml(trait.selectionName)}</strong>
          <span>${this.escapeHtml(trait.selectionDescription)}</span>
        </span>
        <span class="trait-picker__card-check">✓</span>
      `;
      card.addEventListener('click', () => {
        if (this.activeMarbleId === null) return;
        const current = this.assignments.get(this.activeMarbleId);
        if (!current) return;
        this.assignments.set(this.activeMarbleId, { ...current, definitionId: trait.definitionId });
        const snapshot = this.runtime.getSnapshot();
        this.render(snapshot, traits);
      });
      this.traitGrid.appendChild(card);
    });
  }

  private renderProgress(totalParticipants: number) {
    const assignedCount = [...this.assignments.values()].filter((assignment) => Boolean(assignment.definitionId)).length;
    this.progressLabel.textContent = `${assignedCount}/${totalParticipants}명 특성 설정 완료`;
  }

  private applyAutomaticAssignment() {
    const traits = this.runtime.getAvailableTraits();
    const snapshot = this.runtime.getSnapshot();
    if (traits.length === 0) return;

    snapshot.monsters.forEach((monster, index) => {
      const trait = traits[index % traits.length];
      this.assignments.set(monster.marbleId, {
        marbleId: monster.marbleId,
        name: monster.name,
        definitionId: trait.definitionId,
      });
    });
    this.render(snapshot, traits);
  }

  private confirmAndStart() {
    if (this.assignments.size === 0) return;

    for (const assignment of this.assignments.values()) {
      this.runtime.setTraitForMarble(assignment.marbleId, assignment.definitionId);
    }

    this.close();
    this.bypassNextStart = true;
    document.querySelector<HTMLButtonElement>('#btnStart')?.click();
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
