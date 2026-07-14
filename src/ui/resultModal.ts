import type { MonsterRuntimeController } from '../monster/monsterRuntimeController';
import './resultModal.scss';

interface GoalEventDetail {
  winner?: string;
}

export class ResultModal {
  private root: HTMLDivElement;
  private winnerLabel: HTMLDivElement;
  private list: HTMLDivElement;

  constructor(private runtime: MonsterRuntimeController) {
    this.root = document.createElement('div');
    this.root.className = 'race-result';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.innerHTML = `
      <div class="race-result__backdrop"></div>
      <section class="race-result__dialog" role="dialog" aria-modal="true" aria-labelledby="race-result-title">
        <p class="race-result__kicker">RACE FINISHED</p>
        <h2 id="race-result-title">경기 결과</h2>
        <div class="race-result__winner"></div>
        <div class="race-result__list"></div>
        <footer class="race-result__actions">
          <button type="button" class="race-result__close">확인</button>
          <button type="button" class="race-result__setup">다음 경기 설정</button>
        </footer>
      </section>
    `;

    const winnerLabel = this.root.querySelector<HTMLDivElement>('.race-result__winner');
    const list = this.root.querySelector<HTMLDivElement>('.race-result__list');
    if (!winnerLabel || !list) {
      throw new Error('Failed to initialize result modal.');
    }

    this.winnerLabel = winnerLabel;
    this.list = list;
  }

  mount(roulette: EventTarget) {
    if (!document.body.contains(this.root)) {
      document.body.appendChild(this.root);
    }

    this.root.querySelector('.race-result__close')?.addEventListener('click', () => this.close());
    this.root.querySelector('.race-result__setup')?.addEventListener('click', () => {
      this.close();
      document.querySelector('#settings')?.classList.remove('hide');
      document.querySelector('#donate')?.classList.remove('hide');
      setTimeout(() => document.querySelector<HTMLButtonElement>('#btnStart')?.focus(), 0);
    });
    this.root.querySelector('.race-result__backdrop')?.addEventListener('click', () => this.close());

    roulette.addEventListener(
      'goal',
      ((event: CustomEvent<GoalEventDetail>) => {
        window.setTimeout(() => this.open(event.detail?.winner), 900);
      }) as EventListener
    );
  }

  open(winnerName?: string) {
    const snapshot = this.runtime.getSnapshot();
    const winner = winnerName || snapshot.monsters.find((monster) => monster.rank === 1)?.name || '결과 없음';
    const ordered = [...snapshot.monsters].sort((a, b) => {
      if (a.name === winner) return -1;
      if (b.name === winner) return 1;
      return (a.rank || 9999) - (b.rank || 9999);
    });

    this.winnerLabel.innerHTML = `
      <span>우승</span>
      <strong>${this.escapeHtml(winner)}</strong>
    `;

    this.list.replaceChildren();
    ordered.forEach((monster, index) => {
      const item = document.createElement('div');
      item.className = 'race-result__item';
      item.classList.toggle('is-winner', monster.name === winner);
      item.innerHTML = `
        <span class="race-result__rank">${index + 1}</span>
        <span class="race-result__name">${this.escapeHtml(monster.name)}</span>
        <span class="race-result__trait">${this.escapeHtml(monster.selectionName)}</span>
      `;
      this.list.appendChild(item);
    });

    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
  }

  close() {
    this.root.classList.remove('is-open');
    this.root.setAttribute('aria-hidden', 'true');
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
