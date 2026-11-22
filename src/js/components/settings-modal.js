// src/js/components/settings-modal.js - Enterprise Settings Dialog Controller
import { EventBus } from '../core/event-bus.js';

export function initSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingCurrencySelect = document.getElementById('settingCurrencySelect');
  const settingSeedInput = document.getElementById('settingSeedInput');

  function openSettings() {
    if (settingsModal) settingsModal.classList.add('visible');
  }

  function closeSettings() {
    if (settingsModal) settingsModal.classList.remove('visible');
  }

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettings);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });
  }

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      localStorage.clear();
      alert('Demo session state reset to baseline defaults.');
      window.location.reload();
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const currency = settingCurrencySelect ? settingCurrencySelect.value : '$';
      const seed = settingSeedInput ? parseInt(settingSeedInput.value, 10) || 1234 : 1234;
      try {
        localStorage.setItem('cutoverguard-currency', currency);
        localStorage.setItem('cutoverguard-seed', seed.toString());
      } catch {}
      EventBus.emit('settings:updated', { currency, seed });
      closeSettings();
    });
  }
}
