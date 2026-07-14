import './startScreen.scss';

export class StartScreen {
  private root: HTMLDivElement;
  private controlsAdopted = false;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'monster-start-screen';
    this.root.innerHTML = `
      <div class="monster-start-screen__glow monster-start-screen__glow--one"></div>
      <div class="monster-start-screen__glow monster-start-screen__glow--two"></div>

      <main class="monster-home" aria-labelledby="monster-home-title">
        <section class="monster-home__hero">
          <p class="monster-home__eyebrow">MONSTER ARCADE RACE</p>
          <h1 id="monster-home-title">나만의 몬스터를 고르고<br />레이스를 시작하세요</h1>
          <p class="monster-home__description">
            참가자 이름과 특성을 정하고, 맵과 경기 규칙을 설정한 뒤 몬스터 레이스를 시작하세요.
          </p>

          <div class="monster-home__steps" aria-label="게임 시작 순서">
            <span><strong>1</strong> 경기 설정</span>
            <span><strong>2</strong> 참가자 · 특성 선택</span>
            <span><strong>3</strong> 레이스 시작</span>
          </div>

          <button type="button" class="monster-home__primary">
            <span class="monster-home__primary-icon">▶</span>
            <span>
              <small>READY TO RACE</small>
              <strong>참가자 설정 시작</strong>
            </span>
            <b>→</b>
          </button>
        </section>

        <aside class="monster-home__settings" aria-label="경기 설정">
          <div class="monster-home__settings-head">
            <div>
              <span>RACE SETTINGS</span>
              <h2>경기 설정</h2>
            </div>
            <span class="monster-home__settings-badge">설정값 자동 유지</span>
          </div>
          <div class="monster-home__settings-controls"></div>
        </aside>
      </main>
    `;
  }

  mount(onStart: () => void) {
    if (!document.body.contains(this.root)) {
      document.body.appendChild(this.root);
    }

    this.root.querySelector('.monster-home__primary')?.addEventListener('click', onStart);
    this.adoptLegacyControls();
  }

  private adoptLegacyControls() {
    if (this.controlsAdopted) return;

    const controlsHost = this.root.querySelector<HTMLElement>('.monster-home__settings-controls');
    const legacyControls = document.querySelector<HTMLElement>('#settings .collapsible-rows');
    if (!controlsHost || !legacyControls) return;

    legacyControls.classList.remove('collapsed');
    controlsHost.appendChild(legacyControls);
    this.controlsAdopted = true;
  }

  hide() {
    this.root.classList.add('is-hidden');
  }

  show() {
    this.adoptLegacyControls();
    this.root.classList.remove('is-hidden');
  }
}
