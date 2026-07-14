export const applyMonsterArcadeBranding = () => {
  document.title = 'Monster Arcade';

  document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((link) => link.remove());

  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.sizes = '32x32';
  favicon.href = '/assets/monster-arcade-favicon.png';
  document.head.appendChild(favicon);

  const appleTouchIcon = document.createElement('link');
  appleTouchIcon.rel = 'apple-touch-icon';
  appleTouchIcon.href = '/assets/monster-arcade-favicon.png';
  document.head.appendChild(appleTouchIcon);
};
