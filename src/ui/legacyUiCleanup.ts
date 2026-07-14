import './legacyUiCleanup.scss';

const LEGACY_UI_SELECTORS = ['#notice', '.copyright', '#btnNotice', '#btnShop'];

export const cleanupLegacyUi = () => {
  const removeLegacyUi = () => {
    LEGACY_UI_SELECTORS.forEach((selector) => {
      document.querySelector(selector)?.remove();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(removeLegacyUi, 2000), { once: true });
    return;
  }

  window.setTimeout(removeLegacyUi, 2000);
};
