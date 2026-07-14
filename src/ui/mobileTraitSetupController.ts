import './mobileTraitSetup.scss';

// Re-trigger Vercel preview deployment after the previous build-rate-limit window.

type MobilePanel = 'participants' | 'traits';

export class MobileTraitSetupController {
  private readonly query = window.matchMedia('(max-width: 640px)');
  private root?: HTMLElement;
  private nav?: HTMLElement;
  private activePanel: MobilePanel = 'participants';
  private mounted = false;

  mount() {
    if (this.mounted) return;
    this.mounted = true;

    const root = document.querySelector<HTMLElement>('.trait-picker');
    if (!root) return;
    this.root = root;

    const dialog = root.querySelector<HTMLElement>('.trait-picker__dialog');
    const body = root.querySelector<HTMLElement>('.trait-picker__body');
    if (!dialog || !body) return;

    const nav = document.createElement('nav');
    nav.className = 'mobile-trait-nav';
    nav.setAttribute('aria-label', '참가자 설정 단계');
    nav.innerHTML = `
      <button type="button" class="mobile-trait-nav__button is-active" data-mobile-panel="participants">
        <span>1</span><strong>참가자</strong>
      </button>
      <button type="button" class="mobile-trait-nav__button" data-mobile-panel="traits">
        <span>2</span><strong>특성</strong>
      </button>
    `;
    dialog.insertBefore(nav, body);
    this.nav = nav;

    nav.addEventListener('click', (event) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-mobile-panel]');
      if (!button) return;
      this.showPanel(button.dataset.mobilePanel === 'traits' ? 'traits' : 'participants');
    });

    root.addEventListener('click', (event) => {
      if (!this.query.matches) return;
      const target = event.target as Element | null;
      if (!target) return;

      if (target.closest('.trait-picker__participant-select')) {
        window.setTimeout(() => this.showPanel('traits'), 0);
        return;
      }

      const traitCard = target.closest('.trait-picker__card');
      if (traitCard) {
        const input = root.querySelector<HTMLInputElement>('.trait-picker__name-input');
        const hadPendingName = Boolean(input?.value.trim());
        window.setTimeout(() => {
          if (hadPendingName) this.showPanel('participants');
        }, 0);
      }
    });

    const input = root.querySelector<HTMLInputElement>('.trait-picker__name-input');
    input?.addEventListener('keydown', (event) => {
      if (!this.query.matches || event.key !== 'Enter' || !input.value.trim()) return;
      window.setTimeout(() => this.showPanel('traits'), 0);
    });

    const observer = new MutationObserver(() => {
      if (!root.classList.contains('is-open')) return;
      this.syncMode();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    this.query.addEventListener('change', () => this.syncMode());
    this.syncMode();
  }

  private syncMode() {
    if (!this.root) return;
    this.root.classList.toggle('is-mobile-dedicated', this.query.matches);
    if (this.query.matches) this.showPanel(this.activePanel);
  }

  private showPanel(panel: MobilePanel) {
    if (!this.root || !this.query.matches) return;
    this.activePanel = panel;
    this.root.dataset.mobilePanel = panel;
    this.nav?.querySelectorAll<HTMLButtonElement>('[data-mobile-panel]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mobilePanel === panel);
    });

    const scroller = panel === 'participants'
      ? this.root.querySelector<HTMLElement>('.trait-picker__participant-list')
      : this.root.querySelector<HTMLElement>('.trait-picker__traits');
    scroller?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
}
