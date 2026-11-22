/**
 * CutoverGuard Application Bootstrap Entry Point
 */
import { router } from './core/router.js';
import { CalculationService } from './services/calculation-service.js';
import { initNavigation } from './components/navigation.js';
import { initEcnWorkspace } from './components/ecn-workspace.js';
import { initDecisionHistory } from './components/decision-history.js';
import { initSettingsModal } from './components/settings-modal.js';
import { initThemeSwitcher } from './components/theme-switcher.js';
import { initKpiCards } from './components/kpi-cards.js';
import { initCutoverChart } from './components/cutover-chart.js';
import { initScenarioLab } from './components/scenario-lab.js';
import { initMonteCarlo } from './components/monte-carlo.js';
import { initSourcingResilience } from './components/sourcing-resilience.js';
import { initCsvValidator } from './components/csv-validator.js';
import { initAuditChain } from './components/audit-chain.js';
import { initExplanationVerifier } from './components/explanation-verifier.js';
import { initPlannerWorkspace } from './components/planner-workspace.js';
import { initFaq } from './components/faq.js';
import { initDbStatus } from './components/db-status.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[CutoverGuard] Initializing enterprise decision workspaces...');

  // 1. Initialize Calculation Service
  const calculationService = new CalculationService();

  // 2. Initialize UI Components & Workspaces
  initDbStatus();
  initNavigation();
  initSettingsModal();
  initThemeSwitcher();
  initEcnWorkspace();
  initDecisionHistory();
  initKpiCards();
  initCutoverChart(calculationService);
  initScenarioLab(calculationService);
  initMonteCarlo();
  initSourcingResilience();
  initCsvValidator();
  initAuditChain();
  initExplanationVerifier(calculationService);
  initPlannerWorkspace(calculationService);
  initFaq();

  // 3. Initialize Router (activates default or deep-linked page view)
  router.init();

  console.log('[CutoverGuard] All modules & enterprise workspaces initialized successfully.');
});
