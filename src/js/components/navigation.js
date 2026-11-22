// src/js/components/navigation.js - Enterprise Compact Sidebar & Layout Controller
import { EventBus } from '../core/event-bus.js';

export function initNavigation() {
  const drawerToggleBtn = document.getElementById('drawerToggleBtn');
  const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
  const navDrawer = document.getElementById('navDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const appShell = document.getElementById('appShell');

  if (!navDrawer) return;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Load saved sidebar collapsed state
  const isCollapsedSaved = (function() {
    try { return localStorage.getItem('cutoverguard-sidebar-collapsed') === 'true'; } catch { return false; }
  })();

  if (!isMobile() && isCollapsedSaved && appShell) {
    appShell.classList.add('sidebar-collapsed');
  }

  function toggleSidebarCollapse() {
    if (isMobile()) {
      // On mobile, toggle drawer visibility
      toggleMobileDrawer();
    } else {
      // On desktop, toggle between expanded (240px) and collapsed (64px icon-only)
      if (appShell) {
        const isCollapsed = appShell.classList.toggle('sidebar-collapsed');
        try { localStorage.setItem('cutoverguard-sidebar-collapsed', isCollapsed ? 'true' : 'false'); } catch {}
        EventBus.emit('sidebar:collapseChanged', { isCollapsed });
      }
    }
  }

  function toggleMobileDrawer() {
    const isOpen = navDrawer.classList.contains('open');
    if (isOpen) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  }

  function openMobileDrawer() {
    navDrawer.classList.add('open');
    if (drawerBackdrop) drawerBackdrop.classList.add('visible');
    if (drawerToggleBtn) {
      drawerToggleBtn.classList.add('active');
      drawerToggleBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.classList.add('drawer-open');
  }

  function closeMobileDrawer() {
    navDrawer.classList.remove('open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('visible');
    if (drawerToggleBtn) {
      drawerToggleBtn.classList.remove('active');
      drawerToggleBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('drawer-open');
  }

  // Toggle button in header
  if (drawerToggleBtn) {
    drawerToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebarCollapse();
    });
  }

  // Collapse button in sidebar bottom
  if (collapseSidebarBtn) {
    collapseSidebarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebarCollapse();
    });
  }

  // Mobile backdrop click
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeMobileDrawer);
  }

  // Close on Escape in mobile
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobile() && navDrawer.classList.contains('open')) {
      closeMobileDrawer();
    }
  });

  // Navigation link clicks: on mobile, auto-close; on desktop, stay open!
  navDrawer.addEventListener('click', (e) => {
    const link = e.target.closest('[data-navigate]');
    if (link && isMobile()) {
      closeMobileDrawer();
    }
  });

  // Responsive resize cleanup
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      closeMobileDrawer();
    }
  });

  EventBus.on('sidebar:toggle', toggleSidebarCollapse);
}
