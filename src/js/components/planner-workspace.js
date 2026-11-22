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

  function commitApproval(source = 'Cockpit') {
    const currentState = getState();
    if (cockpitStatusBadge) {
      cockpitStatusBadge.className = 'badge badge-feasible';
      cockpitStatusBadge.textContent = 'STATUS: APPROVED — COMMITTED TO SCHEDULE';
    }
    const overviewStatus = document.getElementById('overviewActiveStatus');
    if (overviewStatus) {
      overviewStatus.textContent = 'Approved — Committed to Plant Line 3';
    }

    addLog(`[APPROVAL CONFIRMED via ${source}] Planner PLN-8842 signed cutover for 15 DEC 2026. Signed block appended to audit chain.`, true);

    const newDecision = {
      id: `DEC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      ecn: currentState.ecn,
      parts: `${currentState.componentOld} → ${currentState.componentNew}`,
      runVersion: 'v1.4 (Deterministic Netting)',
      recommendedDate: '15-DEC-2026',
      feasibleWindow: '11-DEC to 19-DEC',
      lrm: '19-DEC-2026',
      costIndex: 82.4,
      excessStock: '120 units',
      shortageRisk: '0.0%',
      action: 'APPROVED',
      planner: 'PLN-8842 (Senior Plant Planner)',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'COMMITTED',
      hash: Math.random().toString(16).slice(2, 26)
    };

    // Persist to PostgreSQL database
    dbService.saveDecision(newDecision).catch(err => console.warn('Could not save decision to DB:', err));
    dbService.saveAuditRecord({
      id: `REC-${String(Math.floor(100 + Math.random() * 900))}`,
      type: 'PLANNER_APPROVAL_COMMIT',
      ts: new Date().toISOString(),
      data: { plannerId: 'PLN-8842', action: 'APPROVED', cutoverCommitted: '15 DEC 2026', ecn: currentState.ecn },
      prevHash: newDecision.hash,
      hash: Math.random().toString(16).slice(2, 34)
    }).catch(err => console.warn('Could not save audit to DB:', err));

    EventBus.emit('planner:action', {
      action: 'APPROVED',
      ecn: currentState.ecn,
      parts: `${currentState.componentOld} → ${currentState.componentNew}`,
      date: '15-DEC-2026',
      costIndex: 82.4
    });

    showActionToast('Cutover date 15-DEC approved and committed to plant schedule.');
  }

  function commitDeferral(source = 'Cockpit') {
    const currentState = getState();
    if (cockpitStatusBadge) {
      cockpitStatusBadge.className = 'badge badge-risk';
      cockpitStatusBadge.textContent = 'STATUS: DEFERRED PENDING SUPPLIER RE-CONFIRMATION';
    }
    const overviewStatus = document.getElementById('overviewActiveStatus');
    if (overviewStatus) {
      overviewStatus.textContent = 'Deferred — Vendor Confirmation Pending';
    }

    addLog(`[DECISION DEFERRED via ${source}] Transition deferred by planner pending vendor lead-time re-confirmation.`, false);

    EventBus.emit('planner:action', {
      action: 'DEFERRED',
      ecn: currentState.ecn,
      parts: `${currentState.componentOld} → ${currentState.componentNew}`,
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
    const day = dateSlider ? parseInt(dateSlider.value, 10) : 15;
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
}
