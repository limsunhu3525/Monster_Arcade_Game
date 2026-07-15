export class SelectionScrollPreserver {
  private root?: HTMLElement;
  private participantScrollTop = 0;
  private traitScrollTop = 0;
  private mounted = false;

  mount() {
    if (this.mounted) return;
    this.mounted = true;

    const root = document.querySelector<HTMLElement>('.trait-picker');
    if (!root) return;
    this.root = root;

    root.addEventListener('pointerdown', this.captureBeforeInteraction, true);
    root.addEventListener('click', this.restoreAfterInteraction, true);
  }

  private captureBeforeInteraction = (event: Event) => {
    if (!this.root) return;
    const target = event.target as Element | null;
    if (!target) return;

    const shouldPreserve = Boolean(
      target.closest(
        '.trait-picker__count-button, .trait-picker__participant-select, .trait-picker__participant, .trait-picker__card'
      )
    );
    if (!shouldPreserve) return;

    const participantList = this.root.querySelector<HTMLElement>('.trait-picker__participant-list');
    const traitGrid = this.root.querySelector<HTMLElement>('.trait-picker__grid');
    this.participantScrollTop = participantList?.scrollTop ?? 0;
    this.traitScrollTop = traitGrid?.scrollTop ?? 0;
  };

  private restoreAfterInteraction = (event: Event) => {
    if (!this.root) return;
    const target = event.target as Element | null;
    if (!target) return;

    const shouldPreserve = Boolean(
      target.closest(
        '.trait-picker__count-button, .trait-picker__participant-select, .trait-picker__participant, .trait-picker__card'
      )
    );
    if (!shouldPreserve) return;

    const restore = () => {
      const participantList = this.root?.querySelector<HTMLElement>('.trait-picker__participant-list');
      const traitGrid = this.root?.querySelector<HTMLElement>('.trait-picker__grid');
      if (participantList) participantList.scrollTop = this.participantScrollTop;
      if (traitGrid) traitGrid.scrollTop = this.traitScrollTop;
    };

    queueMicrotask(restore);
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  };
}
