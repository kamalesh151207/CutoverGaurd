/**
 * Theme Switcher Component (White & Blue SaaS Default)
 */
import { EventBus } from '../core/event-bus.js';

export function initThemeSwitcher() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  const rootHtml = document.documentElement;

  function applyTheme(isDark) {
    if (isDark) {
      rootHtml.setAttribute('data-theme', 'dark');
      if (themeText) themeText.textContent = 'LIGHT';
      if (themeIcon) {
        themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
      }
    } else {
      rootHtml.removeAttribute('data-theme');
      if (themeText) themeText.textContent = 'DARK';
      if (themeIcon) {
        themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      }
    }

    try {
      localStorage.setItem('cutoverguard-theme', isDark ? 'dark' : 'light');
    } catch {}

    EventBus.emit('theme:changed', { isDark });
  }

  // Always default to White & Blue SaaS light theme
  const saved = (function() {
    try { return localStorage.getItem('cutoverguard-theme'); } catch { return null; }
  })();

  applyTheme(saved === 'dark');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isCurrentDark = rootHtml.getAttribute('data-theme') === 'dark';
      applyTheme(!isCurrentDark);
    });
  }
}
