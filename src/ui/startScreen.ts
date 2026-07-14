import './startScreen.scss';

export class StartScreen {
  private root: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'monster-start-screen';
    this.root.innerHTML = `
      <div class="monster-start-screen__glow monster-start-screen__glow--one"></div>
      <div class="monster-start-screen__glow monster-start-screen__glow--two"></div>
      <section class="monster-start-card" aria-labelledby="monster-start-title">
        <div class="monster-start-card__eyebrow">MONSTER ARCADE RACE</div>
        <h1 id="monster-start-title">특성을 고르고<br />몬스터 레이스를 시작하세요</h1>
        <p>참가자 이름을 입력하고, 각자 원하는 특성을 선택하면 바로 레이스에 참가할 수 있습니다.</p>
        <div class="monster-start-card__chips" aria-hidden="true">
          <span>불</span><span>물</span><span>바람</span><span>번개</span><span>얼음</span>
        </div>
        <button type="button" class="monster-start-card__button">
          <span class="monster-start-card__button-icon">▶</span>
          참가자 설정 시작
        </button>
        <small>이름 입력 → 특성 선택 → 경기 시작</small>
      </section>
    `;
  }

  mount(onStart: () => void) {
    if (!document.body.contains(this.root)) {
      document.body.appendChild(this.root);
    }

    this.root.querySelector('.monster-start-card__button')?.addEventListener('click', onStart);
  }

  hide() {
    this.root.classList.add('is-hidden');
  }

  show() {
    this.root.classList.remove('is-hidden');
  }
}