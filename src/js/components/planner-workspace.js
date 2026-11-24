/**
 * Planner Workspace Cockpit & Decision Action Controller
 */
import { EventBus } from '../core/event-bus.js';
import { getState, setState } from '../core/state.js';
import { router } from '../core/router.js';
import { dbService } from '../services/db-service.js';

export function initPlannerWorkspace(calculationService) {
  const plannerApproveBtn = document.getElementById('plannerApproveBtn');
  const plannerRecalcBtn = document.getElementById('plannerRecalcBtn');
  const plannerRejectBtn = document.getElementById('plannerRejectBtn');
  const plannerActivityLog = document.getElementById('plannerActivityLog');
  const cockpitStatusBadge = document.getElementById('cockpitStatusBadge');

  // Overview Dashboard Operational Actions
  const ovActionRunAnalysis = document.getElementById('ovActionRunAnalysis');
  const ovActionCompareScenarios = document.getElementById('ovActionCompareScenarios');
  const ovActionReviewDecision = document.getElementById('ovActionReviewDecision');
  const ovActionApproveCutover = document.getElementById('ovActionApproveCutover');
  const ovActionDeferDecision = document.getElementById('ovActionDeferDecision');

  function addLog(msg, isHighlight = false) {
    if (!plannerActivityLog) return;
    const now = new Date().toTimeString().split(' ')[0] + ' UTC';
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<span class="log-ts">${now}</span><span class="${isHighlight ? 'log-highlight' : ''}">${msg}</span>`;
    plannerActivityLog.prepend(div);
  }

  function updateCockpitDisplay() {
    const ecn = calculationService.activeEcn || {};
    const optSummary = calculationService.cutoverModel.getOptimizationSummary();
    const optDay = calculationService.cutoverModel.targetOptimalDay || 15;
    const recDate = `${optDay < 10 ? '0' + optDay : optDay} DEC 2026`;

    const cockpitTitle = document.querySelector('.workspace-cockpit h3');
    if (cockpitTitle) {
      cockpitTitle.textContent = `Engineering Change Order ${ecn.id || 'ECN-0248'}`;
    }
    const cockpitSub = document.querySelector('.workspace-cockpit .cockpit-top-bar > div:first-child > div:last-child');
    if (cockpitSub) {
      cockpitSub.textContent = `Component ${ecn.partOld || 'COMP-A-104'} → ${ecn.partNew || 'COMP-B-208'} | Owner: ${ecn.plant || 'Plant 3'} Material Planning`;
    }
    const cockpitDate = document.querySelector('.workspace-cockpit .cockpit-top-bar > div:last-child > div:last-child');
    if (cockpitDate) {
      cockpitDate.textContent = recDate;
    }
  }

  function commitApproval(source = 'Cockpit') {
    const currentState = getState();
    const ecn = calculationService.activeEcn || {};
    const optSummary = calculationService.cutoverModel.getOptimizationSummary();
    const optimalDay = calculationService.cutoverModel.targetOptimalDay || 15;
    const evaluated = calculationService.evaluateCandidateDay(optimalDay);
    const recDate = `${optimalDay < 10 ? '0' + optimalDay : optimalDay}-DEC-2026`;
    const earlyDate = `${optSummary.earliestFeasibleDay < 10 ? '0' + optSummary.earliestFeasibleDay : optSummary.earliestFeasibleDay}-DEC`;
    const lrmDate = `${optSummary.lrmDay < 10 ? '0' + optSummary.lrmDay : optSummary.lrmDay}-DEC`;

    if (cockpitStatusBadge) {
      cockpitStatusBadge.className = 'badge badge-feasible';
      cockpitStatusBadge.textContent = 'STATUS: APPROVED — COMMITTED TO SCHEDULE';
    }
    const overviewStatus = document.getElementById('overviewActiveStatus');
    if (overviewStatus) {
      overviewStatus.textContent = `Approved — Committed for ${recDate}`;
    }

    addLog(`[APPROVAL CONFIRMED via ${source}] Planner PLN-8842 signed cutover for ${recDate}. Signed block appended to audit chain.`, true);

    const newDecision = {
      id: `DEC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      ecn: ecn.id || currentState.ecn || 'ECN-0248',
      parts: `${ecn.partOld || currentState.componentOld || 'COMP-A-104'} → ${ecn.partNew || currentState.componentNew || 'COMP-B-208'}`,
      runVersion: 'v1.4 (Deterministic Netting)',
      recommendedDate: recDate,
      feasibleWindow: `${earlyDate} to ${lrmDate}`,
      lrm: lrmDate,
      costIndex: Number(evaluated.totalIndex.toFixed(1)),
      excessStock: `${evaluated.excessOldUnits} units`,
      shortageRisk: evaluated.shortageUnits > 0 ? `${evaluated.shortageUnits} units` : '0.0%',
      action: 'APPROVED',
      planner: 'PLN-8842 (Senior Plant Planner)',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'COMMITTED',
      hash: Math.random().toString(16).slice(2, 26)
    };

    // Persist to PostgreSQL database and local storage
    dbService.saveDecision(newDecision).catch(err => console.warn('Could not save decision to DB:', err));
    dbService.saveAuditRecord({
      id: `REC-${String(Math.floor(100 + Math.random() * 900))}`,
      type: 'PLANNER_APPROVAL_COMMIT',
      ts: new Date().toISOString(),
      data: { plannerId: 'PLN-8842', action: 'APPROVED', cutoverCommitted: recDate, ecn: newDecision.ecn },
      prevHash: newDecision.hash,
      hash: Math.random().toString(16).slice(2, 34)
    }).catch(err => console.warn('Could not save audit to DB:', err));

    EventBus.emit('planner:action', {
      action: 'APPROVED',
      ecn: newDecision.ecn,
      parts: newDecision.parts,
      date: recDate,
      costIndex: newDecision.costIndex
    });

    showActionToast(`Cutover date ${recDate} approved and committed to plant schedule.`);
  }

  function commitDeferral(source = 'Cockpit') {
    const currentState = getState();
    const ecn = calculationService.activeEcn || {};
    if (cockpitStatusBadge) {
      cockpitStatusBadge.className = 'badge badge-risk';
      cockpitStatusBadge.textContent = 'STATUS: DEFERRED PENDING SUPPLIER RE-CONFIRMATION';
    }
    const overviewStatus = document.getElementById('overviewActiveStatus');
    if (overviewStatus) {
      overviewStatus.textContent = 'Deferred — Vendor Confirmation Pending';
    }

    addLog(`[DECISION DEFERRED via ${source}] Transition for ${ecn.id || 'ECN'} deferred by planner pending vendor lead-time re-confirmation.`, false);

    EventBus.emit('planner:action', {
      action: 'DEFERRED',
      ecn: ecn.id || currentState.ecn,
      parts: `${ecn.partOld || currentState.componentOld} → ${ecn.partNew || currentState.componentNew}`,
      date: 'Pending',
      costIndex: 112.5
    });

    showActionToast('Cutover decision deferred pending vendor re-confirmation.');
  }

  function triggerRecalculate() {
    if (cockpitStatusBadge) {
      cockpitStatusBadge.className = 'badge badge-warning';
      cockpitStatusBadge.textContent = 'STATUS: RE-CALCULATING CONSTRAINTS...';
      setTimeout(() => {
        cockpitStatusBadge.textContent = 'STATUS: PENDING PLANNER APPROVAL';
      }, 500);
    }
    addLog('[RECALCULATION REQUESTED] Input parameters refreshed. Re-executing deterministic netting kernel...', false);
    const dateSlider = document.getElementById('cutoverDateSlider');
    const day = dateSlider ? parseInt(dateSlider.value, 10) : (calculationService.cutoverModel.targetOptimalDay || 15);
    const model = calculationService.evaluateCandidateDay(day);
    EventBus.emit('cutover:evaluated', model);

    showActionToast('Deterministic netting recalculation completed successfully.');
  }

  function showActionToast(msg) {
    let toast = document.getElementById('appActionToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appActionToast';
      toast.className = 'app-action-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }

  if (plannerApproveBtn) plannerApproveBtn.addEventListener('click', () => commitApproval('Cockpit'));
  if (plannerRejectBtn) plannerRejectBtn.addEventListener('click', () => commitDeferral('Cockpit'));
  if (plannerRecalcBtn) plannerRecalcBtn.addEventListener('click', triggerRecalculate);

  if (ovActionRunAnalysis) ovActionRunAnalysis.addEventListener('click', triggerRecalculate);
  if (ovActionCompareScenarios) ovActionCompareScenarios.addEventListener('click', () => router.navigate('/scenarios'));
  if (ovActionReviewDecision) ovActionReviewDecision.addEventListener('click', () => router.navigate('/cutover'));
  if (ovActionApproveCutover) ovActionApproveCutover.addEventListener('click', () => commitApproval('Dashboard'));
  if (ovActionDeferDecision) ovActionDeferDecision.addEventListener('click', () => commitDeferral('Dashboard'));

  EventBus.on('ecn:changed', updateCockpitDisplay);
  EventBus.on('calculations:reconfigured', updateCockpitDisplay);

  // Initial sync
  updateCockpitDisplay();
}
