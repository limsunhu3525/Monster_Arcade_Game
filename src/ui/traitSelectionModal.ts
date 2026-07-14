import type { MonsterElement } from '../monster/monsterTypes';
import { getDefaultMonsterSprite } from '../monster/monsterSpriteAssets';
import type { MonsterRuntimeController, MonsterTraitOption } from '../monster/monsterRuntimeController';
import { getMonsterVisualIdentity } from '../monster/monsterVisualIdentity';
import './traitSelectionModal.scss';

const PARTICIPANT_STORAGE_KEY = 'monster_participants';
const TRAIT_STORAGE_KEY = 'monster_trait_assignments';
const LEGACY_NAME_STORAGE_KEY = 'mbr_names';

interface ParticipantAssignment {
  localId: number;
  name: string;
  definitionId: string;
}

interface TraitSelectionModalOptions {
  setParticipants(names: string[]): void;
  startRace(): void;
}

export class TraitSelectionModal {
  private root: HTMLDivElement;
  private participantList: HTMLDivElement;
  private traitGrid: HTMLDivElement;
  private activeParticipantLabel: HTMLDivElement;
  private progressLabel: HTMLDivElement;
  private nameInput: HTMLInputElement;
  private participants: ParticipantAssignment[] = [];
  private activeLocalId: number | null = null;
  private nextLocalId = 1;
  private isOpen = false;

  constructor(
    private runtime: MonsterRuntimeController,
    private options: TraitSelectionModalOptions
  ) {
    this.root = document.createElement('div');
    this.participantList = document.createElement('div');
    this.traitGrid = document.createElement('div');
    this.activeParticipantLabel = document.createElement('div');
    this.progressLabel = document.createElement('div');
    this.nameInput = document.createElement('input');

    this.root.className = 'trait-picker';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.innerHTML = `
      <div class="trait-picker__backdrop"></div>
      <section class="trait-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="trait-picker-title">
        <header class="trait-picker__header">
          <div>
            <p class="trait-picker__kicker">BUILD YOUR RACE</p>
            <h2 id="trait-picker-title">참가자와 특성을 설정하세요</h2>
            <p class="trait-picker__subtitle">이름을 입력한 뒤 오른쪽 캐릭터 특성을 선택하면 참가자가 바로 등록됩니다.</p>
          </div>
          <button type="button" class="trait-picker__close" aria-label="닫기">×</button>
        </header>

        <div class="trait-picker__body">
          <aside class="trait-picker__participants">
            <div class="trait-picker__section-head">
              <div>
                <span class="trait-picker__step">STEP 1</span>
                <strong>참가자 이름</strong>
              </div>
              <button type="button" class="trait-picker__auto">전체 특성 자동 배정</button>
            </div>
            <div class="trait-picker__add">
              <input type="text" class="trait-picker__name-input" placeholder="이름을 입력하세요" autocomplete="off" maxlength="24" />
              <p>이름을 입력하고 오른쪽 특성을 누르면 바로 추가됩니다.</p>
            </div>
            <div class="trait-picker__roster-head">
              <span>등록된 참가자</span>
              <strong class="trait-picker__roster-count">0</strong>
            </div>
            <div class="trait-picker__participant-list"></div>
          </aside>

          <main class="trait-picker__traits">
            <div class="trait-picker__traits-head">
              <div>
                <span class="trait-picker__step">STEP 2</span>
                <strong>캐릭터 특성 선택</strong>
              </div>
              <div class="trait-picker__active-participant"></div>
            </div>
            <div class="trait-picker__grid"></div>
          </main>
        </div>

        <footer class="trait-picker__footer">
          <div class="trait-picker__progress"></div>
          <div class="trait-picker__footer-actions">
            <button type="button" class="trait-picker__cancel">취소</button>
            <button type="button" class="trait-picker__confirm">
              <span>경기 시작</span>
              <strong>→</strong>
            </button>
          </div>
        </footer>
      </section>
    `;

    const participantList = this.root.querySelector<HTMLDivElement>('.trait-picker__participant-list');
    const traitGrid = this.root.querySelector<HTMLDivElement>('.trait-picker__grid');
    const activeParticipantLabel = this.root.querySelector<HTMLDivElement>('.trait-picker__active-participant');
    const progressLabel = this.root.querySelector<HTMLDivElement>('.trait-picker__progress');
    const nameInput = this.root.querySelector<HTMLInputElement>('.trait-picker__name-input');

    if (!participantList || !traitGrid || !activeParticipantLabel || !progressLabel || !nameInput) {
      throw new Error('Failed to initialize trait setup modal.');
    }

    this.participantList = participantList;
    this.traitGrid = traitGrid;
    this.activeParticipantLabel = activeParticipantLabel;
    this.progressLabel = progressLabel;
    this.nameInput = nameInput;
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

    this.nameInput.addEventListener('input', () => {
      if (this.nameInput.value.trim()) {
        this.activeLocalId = null;
      }
      this.renderTraits(this.runtime.getAvailableTraits());
      this.renderProgress();
    });

    this.nameInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (!this.nameInput.value.trim()) {
        this.renderProgress('참가자 이름을 먼저 입력하세요.');
        return;
      }
      this.renderProgress('이제 오른쪽에서 원하는 특성을 선택하세요.');
    });
  }

  open() {
    const snapshot = this.runtime.getSnapshot();
    if (snapshot.running) return;

    if (this.participants.length === 0) {
      this.loadStoredParticipants();
    }

    if (this.participants.length > 0 && this.activeLocalId === null && !this.nameInput.value.trim()) {
      this.activeLocalId = this.participants[0].localId;
    }

    this.isOpen = true;
    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('trait-picker-open');
    this.render();
    setTimeout(() => this.nameInput.focus(), 0);
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

    const snapshot = this.runtime.getSnapshot();
    if (snapshot.running) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    this.open();
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (!this.isOpen) return;
    if (event.key === 'Escape') this.close();
  };

  private loadStoredParticipants() {
    const traits = this.runtime.getAvailableTraits();
    const storedNames = this.getStoredNames();
    const storedTraits = this.getStoredTraitAssignments();

    this.participants = storedNames.map((name, index) => ({
      localId: this.nextLocalId++,
      name,
      definitionId: storedTraits[name] ?? traits[index % traits.length]?.definitionId ?? '',
    }));

    this.activeLocalId = this.participants[0]?.localId ?? null;
  }

  private getStoredNames() {
    const raw = localStorage.getItem(PARTICIPANT_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map((name) => name.trim()).filter(Boolean);
        }
      } catch {
        // Fall back to legacy storage below.
      }
    }

    const legacy = localStorage.getItem(LEGACY_NAME_STORAGE_KEY);
    if (!legacy) return [];
    return legacy
      .split(/[,\r\n]/g)
      .map((name) => name.replace(/\*\d+$/, '').replace(/\/\d+$/, '').trim())
      .filter(Boolean);
  }

  private getStoredTraitAssignments() {
    const raw = localStorage.getItem(TRAIT_STORAGE_KEY);
    if (!raw) return {} as Record<string, string>;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
    } catch {
      return {} as Record<string, string>;
    }
  }

  private addParticipantWithTrait(trait: MonsterTraitOption) {
    const name = this.nameInput.value.trim();
    if (!name) return false;

    const participant: ParticipantAssignment = {
      localId: this.nextLocalId++,
      name,
      definitionId: trait.definitionId,
    };

    this.participants.push(participant);
    this.activeLocalId = participant.localId;
    this.nameInput.value = '';
    this.persistDraft();
    this.render();
    this.nameInput.focus();
    return true;
  }

  private removeParticipant(localId: number) {
    this.participants = this.participants.filter((participant) => participant.localId !== localId);
    if (this.activeLocalId === localId) {
      this.activeLocalId = this.participants[0]?.localId ?? null;
    }
    this.persistDraft();
    this.render();
  }

  private renameParticipant(localId: number, value: string) {
    const participant = this.participants.find((item) => item.localId === localId);
    if (!participant) return;
    participant.name = value;
    this.persistDraft();
    this.renderProgress();
  }

  private render() {
    const traits = this.runtime.getAvailableTraits();
    this.renderParticipants(traits);
    this.renderTraits(traits);
    this.renderProgress();
    this.updateRosterCount();
  }

  private updateRosterCount() {
    const count = this.root.querySelector<HTMLElement>('.trait-picker__roster-count');
    if (count) count.textContent = String(this.participants.length);
  }

  private renderParticipants(traits: MonsterTraitOption[]) {
    const traitById = new Map(traits.map((trait) => [trait.definitionId, trait]));
    this.participantList.replaceChildren();

    if (this.participants.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'trait-picker__empty';
      empty.innerHTML = `
        <span>+</span>
        <strong>아직 참가자가 없습니다</strong>
        <p>위에 이름을 입력한 뒤 오른쪽 캐릭터 특성을 선택하세요.</p>
      `;
      this.participantList.appendChild(empty);
      return;
    }

    this.participants.forEach((participant, index) => {
      const trait = traitById.get(participant.definitionId);
      const visual = trait ? getMonsterVisualIdentity(trait.element as MonsterElement) : undefined;
      const spriteUrl = trait ? getDefaultMonsterSprite(trait.element as MonsterElement) : undefined;
      const row = document.createElement('div');
      row.className = 'trait-picker__participant';
      row.classList.toggle('is-active', participant.localId === this.activeLocalId);
      if (visual) {
        row.style.setProperty('--trait-primary', visual.primaryColor);
        row.style.setProperty('--trait-secondary', visual.secondaryColor);
        row.style.setProperty('--trait-glow', visual.glowColor);
      }

      const selector = document.createElement('button');
      selector.type = 'button';
      selector.className = 'trait-picker__participant-select';
      selector.setAttribute('aria-label', `${participant.name} 선택`);
      selector.innerHTML = spriteUrl
        ? `<span class="trait-picker__participant-avatar"><img src="${spriteUrl}" alt="" /></span>`
        : `<span class="trait-picker__participant-index">${visual?.icon ?? String(index + 1).padStart(2, '0')}</span>`;
      selector.addEventListener('click', () => {
        this.nameInput.value = '';
        this.activeLocalId = participant.localId;
        this.render();
      });

      const copy = document.createElement('div');
      copy.className = 'trait-picker__participant-copy';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = participant.name;
      input.placeholder = `참가자 ${index + 1}`;
      input.maxLength = 24;
      input.addEventListener('focus', () => {
        this.nameInput.value = '';
        this.activeLocalId = participant.localId;
        this.renderTraits(traits);
      });
      input.addEventListener('input', () => this.renameParticipant(participant.localId, input.value));

      const traitLabel = document.createElement('small');
      traitLabel.innerHTML = `<span>${visual?.icon ?? '•'}</span>${this.escapeHtml(trait?.selectionName ?? '특성 미선택')}`;
      copy.append(input, traitLabel);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'trait-picker__participant-remove';
      remove.setAttribute('aria-label', `${participant.name} 삭제`);
      remove.textContent = '×';
      remove.addEventListener('click', () => this.removeParticipant(participant.localId));

      row.append(selector, copy, remove);
      this.participantList.appendChild(row);
    });
  }

  private renderTraits(traits: MonsterTraitOption[]) {
    this.traitGrid.replaceChildren();
    const pendingName = this.nameInput.value.trim();
    const activeParticipant = pendingName ? undefined : this.getActiveParticipant();

    if (pendingName) {
      this.activeParticipantLabel.innerHTML = `<span>새 참가자</span><strong>${this.escapeHtml(pendingName)}</strong>`;
      this.activeParticipantLabel.classList.add('is-pending');
    } else if (activeParticipant) {
      this.activeParticipantLabel.innerHTML = `<span>특성 변경</span><strong>${this.escapeHtml(activeParticipant.name || '이름 없음')}</strong>`;
      this.activeParticipantLabel.classList.remove('is-pending');
    } else {
      this.activeParticipantLabel.innerHTML = '<span>이름을 입력하면 특성을 선택할 수 있습니다</span>';
      this.activeParticipantLabel.classList.remove('is-pending');
    }

    traits.forEach((trait) => {
      const element = trait.element as MonsterElement;
      const visual = getMonsterVisualIdentity(element);
      const spriteUrl = getDefaultMonsterSprite(element);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'trait-picker__card';
      card.dataset.element = trait.element;
      card.style.setProperty('--trait-primary', visual.primaryColor);
      card.style.setProperty('--trait-secondary', visual.secondaryColor);
      card.style.setProperty('--trait-glow', visual.glowColor);
      card.classList.toggle('is-selected', activeParticipant?.definitionId === trait.definitionId);
      card.innerHTML = `
        <span class="trait-picker__card-visual">
          ${spriteUrl ? `<img src="${spriteUrl}" alt="${this.escapeHtml(trait.selectionName)} 캐릭터" />` : `<span>${visual.icon}</span>`}
          <i>${visual.icon}</i>
        </span>
        <span class="trait-picker__card-copy">
          <small>${this.escapeHtml(visual.eyebrow)}</small>
          <strong>${this.escapeHtml(trait.selectionName)}</strong>
          <span>${this.escapeHtml(trait.selectionDescription)}</span>
        </span>
        <span class="trait-picker__card-action">${pendingName ? '이 특성으로 추가' : activeParticipant ? '특성 변경' : '이름 입력 필요'}</span>
      `;
      card.addEventListener('click', () => {
        if (this.addParticipantWithTrait(trait)) return;

        const current = this.getActiveParticipant();
        if (!current) {
          this.renderProgress('왼쪽에 참가자 이름을 입력한 뒤 특성을 선택하세요.');
          this.nameInput.focus();
          return;
        }

        current.definitionId = trait.definitionId;
        this.persistDraft();
        this.render();
      });
      this.traitGrid.appendChild(card);
    });
  }

  private renderProgress(message?: string) {
    const validCount = this.participants.filter((participant) => participant.name.trim()).length;
    if (message) {
      this.progressLabel.textContent = message;
      this.progressLabel.classList.add('is-warning');
      return;
    }

    this.progressLabel.classList.remove('is-warning');
    if (this.nameInput.value.trim()) {
      this.progressLabel.textContent = '오른쪽에서 특성을 선택하면 참가자가 바로 추가됩니다.';
      return;
    }

    this.progressLabel.textContent =
      validCount === 0 ? '참가자를 1명 이상 추가하면 경기를 시작할 수 있습니다.' : `${validCount}명 참가자 준비 완료`;
  }

  private applyAutomaticAssignment() {
    const traits = this.runtime.getAvailableTraits();
    if (traits.length === 0 || this.participants.length === 0) {
      this.renderProgress('먼저 참가자를 추가하세요.');
      this.nameInput.focus();
      return;
    }

    this.participants.forEach((participant, index) => {
      participant.definitionId = traits[index % traits.length].definitionId;
    });
    this.persistDraft();
    this.render();
  }

  private confirmAndStart() {
    const validParticipants = this.participants
      .map((participant, index) => ({ ...participant, name: participant.name.trim() || `참가자 ${index + 1}` }))
      .filter((participant) => Boolean(participant.name));

    if (validParticipants.length === 0) {
      this.renderProgress('참가자를 최소 1명 이상 추가해야 시작할 수 있습니다.');
      this.nameInput.focus();
      return;
    }

    const traits = this.runtime.getAvailableTraits();
    const names = validParticipants.map((participant) => participant.name);
    this.participants = validParticipants;
    this.options.setParticipants(names);

    const snapshot = this.runtime.getSnapshot();
    snapshot.monsters.forEach((monster, index) => {
      const assignment = validParticipants[index];
      const definitionId = assignment?.definitionId || traits[index % traits.length]?.definitionId;
      if (definitionId) {
        this.runtime.setTraitForMarble(monster.marbleId, definitionId);
      }
    });

    this.persistDraft();
    this.close();
    this.options.startRace();
  }

  private getActiveParticipant() {
    return this.participants.find((participant) => participant.localId === this.activeLocalId);
  }

  private persistDraft() {
    const names = this.participants.map((participant) => participant.name.trim()).filter(Boolean);
    const traitAssignments = this.participants.reduce<Record<string, string>>((acc, participant) => {
      if (participant.name.trim()) acc[participant.name.trim()] = participant.definitionId;
      return acc;
    }, {});

    localStorage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(names));
    localStorage.setItem(TRAIT_STORAGE_KEY, JSON.stringify(traitAssignments));
    localStorage.setItem(LEGACY_NAME_STORAGE_KEY, names.join(','));

    const nameInput = document.querySelector<HTMLTextAreaElement>('#in_names');
    if (nameInput) nameInput.value = names.join(',');
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
