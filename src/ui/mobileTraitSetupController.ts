export class MobileTraitSetupController {
  private readonly query = window.matchMedia('(max-width: 640px)');
  private root?: HTMLElement;
  private mounted = false;

  mount() {
    if (this.mounted) return;
    this.mounted = true;

    const root = document.querySelector<HTMLElement>('.trait-picker');
    if (!root) return;
    this.root = root;

    root.querySelector('.mobile-trait-nav')?.remove();

    root.addEventListener('click', (event) => {
      if (!this.query.matches) return;
      const target = event.target as Element | null;
      if (!target) return;

      const row = target.closest<HTMLElement>('.trait-picker__participant');
      if (!row) return;
      if (
        target.closest('input') ||
        target.closest('.trait-picker__count-control') ||
        target.closest('.trait-picker__participant-remove') ||
        target.closest('.trait-picker__participant-select')
      ) {
        return;
      }

      row.querySelector<HTMLButtonElement>('.trait-picker__participant-select')?.click();
    });

    const observer = new MutationObserver(() => {
      if (root.classList.contains('is-open')) this.syncMode();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    this.query.addEventListener('change', () => this.syncMode());
    this.syncMode();
  }

  private syncMode() {
    if (!this.root) return;
    this.root.classList.toggle('is-mobile-dedicated', this.query.matches);
    this.root.toggleAttribute('data-mobile-split', this.query.matches);
    this.root.removeAttribute('data-mobile-panel');
    this.root.querySelector('.mobile-trait-nav')?.remove();
  }
}
