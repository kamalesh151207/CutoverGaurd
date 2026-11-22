// src/js/core/router.js - Client-Side Page Router for CutoverGuard
import { EventBus } from './event-bus.js';

export const ROUTES = {
  '/': {
    id: 'view-overview',
    title: 'CutoverGuard | Engineering Decision Workspace',
    group: 'Decision Center',
    name: 'Overview'
  },
  '/ecn': {
    id: 'view-ecn',
    title: 'CutoverGuard | Engineering Changes Workspace',
    group: 'Engineering Changes',
    name: 'Engineering Changes'
  },
  '/cutover': {
    id: 'view-cutover',
    title: 'CutoverGuard | Cutover Analysis & Optimization',
    group: 'Analysis Engine',
    name: 'Cutover Analysis'
  },
  '/scenarios': {
    id: 'view-scenarios',
    title: 'CutoverGuard | Scenario Simulation & What-If Evaluation',
    group: 'Simulation',
    name: 'Scenario Simulation'
  },
  '/supply-risk': {
    id: 'view-supply-risk',
    title: 'CutoverGuard | Supply & Sourcing Risk Analysis',
    group: 'Supply Chain',
    name: 'Supply & Risk'
  },
  '/history': {
    id: 'view-history',
    title: 'CutoverGuard | Decision History & Log',
    group: 'Governance',
    name: 'Decision History'
  },
  '/audit': {
    id: 'view-audit',
    title: 'CutoverGuard | Audit & Cryptographic Governance',
    group: 'Governance',
    name: 'Audit & Governance'
  }
};

// Aliases for compatibility
export const ROUTE_ALIASES = {
  '/problem': '/ecn',
  '/data-quality': '/ecn',
  '/lrm': '/cutover',
  '/planner': '/cutover',
  '/sourcing': '/supply-risk',
  '/uncertainty': '/supply-risk',
  '/trust': '/audit',
  '/evaluation': '/',
  '/pipeline': '/',
  '/project-status': '/',
  '/demo': '/',
  '/faq': '/'
};

class Router {
  constructor() {
    this.currentRoute = null;
  }

  init() {
    // Determine initial route from URL path or hash
    const initialRoute = this.resolveCurrentRoute();
    this.navigate(initialRoute, false);

    // Listen to browser Back/Forward navigation
    window.addEventListener('popstate', () => {
      const route = this.resolveCurrentRoute();
      this.navigate(route, false);
    });

    // Listen to hashchange as well for compatibility
    window.addEventListener('hashchange', () => {
      const route = this.resolveCurrentRoute();
      this.navigate(route, false);
    });

    // Global click delegate for links with data-navigate
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-navigate]');
      if (target) {
        e.preventDefault();
        const route = target.getAttribute('data-navigate');
        if (route) {
          this.navigate(route, true);
        }
      }
    });
  }

  resolveCurrentRoute() {
    // 1. Check hash first (e.g. #/cutover or #cutover)
    if (window.location.hash) {
      let hash = window.location.hash.replace(/^#\/?/, '/');
      if (hash && hash !== '') {
        if (!hash.startsWith('/')) hash = '/' + hash;
        if (ROUTE_ALIASES[hash]) hash = ROUTE_ALIASES[hash];
        if (ROUTES[hash]) return hash;
      }
    }

    // 2. Check pathname
    let path = window.location.pathname;
    if (path.endsWith('/index.html')) {
      path = '/';
    }
    if (ROUTE_ALIASES[path]) {
      path = ROUTE_ALIASES[path];
    }
    if (ROUTES[path]) {
      return path;
    }

    return '/';
  }

  navigate(route, pushState = true) {
    if (ROUTE_ALIASES[route]) {
      route = ROUTE_ALIASES[route];
    }
    if (!ROUTES[route]) {
      route = '/';
    }

    const routeConfig = ROUTES[route];
    this.currentRoute = route;

    // Update browser URL
    if (pushState) {
      const isFileProtocol = window.location.protocol === 'file:';
      if (isFileProtocol) {
        window.location.hash = '#' + route;
      } else {
        try {
          window.history.pushState({ route }, routeConfig.title, route);
        } catch {
          window.location.hash = '#' + route;
        }
      }
    }

    // Update Document Title
    document.title = routeConfig.title;

    // Switch Page Views
    const allViews = document.querySelectorAll('.page-view');
    allViews.forEach(view => {
      view.classList.remove('active-page');
    });

    const activeView = document.getElementById(routeConfig.id);
    if (activeView) {
      activeView.classList.add('active-page');
    }

    // Update breadcrumb and page title in header
    const headerBreadcrumbCurrent = document.getElementById('headerBreadcrumbCurrent');
    if (headerBreadcrumbCurrent) {
      headerBreadcrumbCurrent.textContent = routeConfig.name;
    }
    const headerPageTitle = document.getElementById('headerPageTitle');
    if (headerPageTitle) {
      headerPageTitle.textContent = routeConfig.name;
    }

    // Scroll to top cleanly
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Update navigation active states in sidebar
    this.updateActiveNavIndicators(route);

    // Emit event so charts or components on this page can resize/refresh
    EventBus.emit('route:changed', { route, config: routeConfig });
  }

  updateActiveNavIndicators(activeRoute) {
    const navItems = document.querySelectorAll('.app-nav-item');
    navItems.forEach(item => {
      const itemRoute = item.getAttribute('data-navigate');
      if (itemRoute === activeRoute || ROUTE_ALIASES[itemRoute] === activeRoute) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();
