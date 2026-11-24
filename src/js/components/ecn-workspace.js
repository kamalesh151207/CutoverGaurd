// src/js/components/ecn-workspace.js - Engineering Change Management Workspace
import { SYNTHETIC_ECNS } from '../data/demo-data.js';
import { getState, setState } from '../core/state.js';
import { EventBus } from '../core/event-bus.js';
import { router } from '../core/router.js';
import { dbService } from '../services/db-service.js';
import { ecnIntelligenceService } from '../services/ecn-intelligence-service.js';
import { bomModel } from '../models/bom-model.js';

export function initEcnWorkspace() {
  const ecnTableBody = document.getElementById('ecnTableBody');
  const ecnSearchInput = document.getElementById('ecnSearchInput');
  const ecnStatusFilter = document.getElementById('ecnStatusFilter');
  const newEcnModal = document.getElementById('newEcnModal');
  const openNewEcnModalBtn = document.getElementById('openNewEcnModalBtn');
  const headerNewEcnBtn = document.getElementById('headerNewEcnBtn');
  const overviewNewEcnBtn = document.getElementById('overviewNewEcnBtn');
  const overviewOpenEcnBtn = document.getElementById('overviewOpenEcnBtn');
  const closeNewEcnModalBtn = document.getElementById('closeNewEcnModalBtn');
  const cancelNewEcnBtn = document.getElementById('cancelNewEcnBtn');
  const newEcnForm = document.getElementById('newEcnForm');

  let ecns = [...SYNTHETIC_ECNS];

  // Asynchronously load live ECNs from PostgreSQL database
  dbService.getEcns().then(loadedEcns => {
    if (loadedEcns && loadedEcns.length > 0) {
      ecns = loadedEcns;
      renderEcnTable();
    }
  });

  function renderEcnTable() {
    if (!ecnTableBody) return;

    const query = (ecnSearchInput ? ecnSearchInput.value : '').toLowerCase().trim();
    const filter = (ecnStatusFilter ? ecnStatusFilter.value : 'ALL');
    const currentState = getState();

    const filtered = ecns.filter(item => {
      const matchesQuery = item.id.toLowerCase().includes(query) ||
                           item.partOld.toLowerCase().includes(query) ||
                           item.partNew.toLowerCase().includes(query) ||
                           item.changeType.toLowerCase().includes(query);
      const matchesFilter = (filter === 'ALL') || (item.statusCode === filter);
      return matchesQuery && matchesFilter;
    });

    if (filtered.length === 0) {
      ecnTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No Engineering Change Orders match the specified filter.
          </td>
        </tr>
      `;
      return;
    }

    ecnTableBody.innerHTML = filtered.map(item => {
      const isActive = item.id === currentState.ecn;
      const statusBadgeClass = item.statusCode === 'IN_REVIEW' ? 'badge-warning' :
                              item.statusCode === 'ANALYSIS_READY' ? 'badge-feasible' : 'badge-risk';
      const readinessBadgeClass = item.readiness === 'READY' ? 'badge-feasible' :
                                  item.readiness === 'NEEDS_VALIDATION' ? 'badge-warning' : 'badge-risk';

      return `
        <tr class="${isActive ? 'active-row' : ''}">
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--navy-primary);">
            ${item.id} ${isActive ? '<span class="badge badge-blue" style="font-size: 0.65rem; margin-left: 0.25rem;">ACTIVE</span>' : ''}
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-weight: 600;">${item.partOld}</div>
            <div style="font-size: 0.75rem; color: var(--text-light);">${item.revision.split('→')[0].trim()}</div>
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-weight: 600; color: var(--blue-primary);">${item.partNew}</div>
            <div style="font-size: 0.75rem; color: var(--text-light);">${item.revision.split('→')[1].trim()}</div>
          </td>
          <td style="font-size: 0.825rem; max-width: 240px;">
            <div style="font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.changeType}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.createdDate}</div>
          </td>
          <td>
            <span class="badge ${statusBadgeClass}">${item.status}</span>
          </td>
          <td>
            <span class="badge ${readinessBadgeClass}">${item.readiness}</span>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.825rem;">
            ${item.plannedDate}
          </td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm select-ecn-btn" data-ecn-id="${item.id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
              ${isActive ? 'Selected' : 'Select &amp; Analyze'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function setActiveEcn(ecnId) {
    const target = ecns.find(e => e.id === ecnId);
    if (!target) return;

    setState({
      ecn: target.id,
      componentOld: target.partOld,
      componentNew: target.partNew,
      initialOldStock: target.initialStock,
      baseDemand: target.dailyDemand,
      newMaterialReadyDay: target.dockDay
    });

    // Update active badges across header and dashboard
    updateActiveEcnBadges(target);
    renderEcnTable();
    EventBus.emit('ecn:changed', target);
  }

  function updateActiveEcnBadges(target) {
    const headerEcnId = document.getElementById('headerEcnId');
    const headerEcnParts = document.getElementById('headerEcnParts');
    const overviewActiveEcnId = document.getElementById('overviewActiveEcnId');
    const overviewActiveParts = document.getElementById('overviewActiveParts');
    const overviewActiveRev = document.getElementById('overviewActiveRev');
    const overviewActiveReason = document.getElementById('overviewActiveReason');
    const overviewActiveStatus = document.getElementById('overviewActiveStatus');
    const overviewActivePlanned = document.getElementById('overviewActivePlanned');

    if (headerEcnId) headerEcnId.textContent = target.id;
    if (headerEcnParts) headerEcnParts.textContent = `${target.partOld} → ${target.partNew}`;

    if (overviewActiveEcnId) overviewActiveEcnId.textContent = target.id;
    if (overviewActiveParts) overviewActiveParts.textContent = `${target.partOld} (Rev C) → ${target.partNew} (Rev D)`;
    if (overviewActiveRev) overviewActiveRev.textContent = target.revision;
    if (overviewActiveReason) overviewActiveReason.textContent = target.reason;
    if (overviewActiveStatus) overviewActiveStatus.textContent = target.status;
    if (overviewActivePlanned) overviewActivePlanned.textContent = target.plannedDate;

    // Update input readiness grid details
    const rdStock = document.getElementById('rd-stock-detail');
    const rdDemand = document.getElementById('rd-demand-detail');
    const rdDock = document.getElementById('rd-dock-detail');
    if (rdStock) rdStock.textContent = `${target.initialStock} units on-hand`;
    if (rdDemand) rdDemand.textContent = `${target.dailyDemand} units/day rate`;
    if (rdDock) rdDock.textContent = `Dock ready Day ${target.dockDay}`;
  }

  // Delegated click for ECN selection
  if (ecnTableBody) {
    ecnTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.select-ecn-btn');
      if (btn) {
        const id = btn.getAttribute('data-ecn-id');
        setActiveEcn(id);
        router.navigate('/cutover');
      }
    });
  }

  if (ecnSearchInput) ecnSearchInput.addEventListener('input', renderEcnTable);
  if (ecnStatusFilter) ecnStatusFilter.addEventListener('change', renderEcnTable);

  // Modal open/close handlers
  function openModal() {
    if (newEcnModal) newEcnModal.classList.add('visible');
  }
  function closeModal() {
    if (newEcnModal) newEcnModal.classList.remove('visible');
  }

  if (openNewEcnModalBtn) openNewEcnModalBtn.addEventListener('click', openModal);
  if (headerNewEcnBtn) headerNewEcnBtn.addEventListener('click', openModal);
  if (overviewNewEcnBtn) overviewNewEcnBtn.addEventListener('click', openModal);
  if (overviewOpenEcnBtn) overviewOpenEcnBtn.addEventListener('click', () => router.navigate('/ecn'));
  if (closeNewEcnModalBtn) closeNewEcnModalBtn.addEventListener('click', closeModal);
  if (cancelNewEcnBtn) cancelNewEcnBtn.addEventListener('click', closeModal);

  if (newEcnModal) {
    newEcnModal.addEventListener('click', (e) => {
      if (e.target === newEcnModal) closeModal();
    });
  }

  // Auto-fill component inventory & dock day when typing/selecting components in modal
  const inpPartOld = document.getElementById('inpPartOld');
  const inpPartNew = document.getElementById('inpPartNew');
  const inpStock = document.getElementById('inpStock');
  const inpDemand = document.getElementById('inpDemand');
  const inpDockDay = document.getElementById('inpDockDay');

  if (inpPartOld) {
    inpPartOld.addEventListener('change', () => {
      const comp = bomModel.getComponent(inpPartOld.value.trim());
      const impact = bomModel.analyzeComponentImpact(inpPartOld.value.trim());
      if (inpStock && comp.onHand) inpStock.value = comp.onHand;
      if (inpDemand && impact.totalDailyDemand) inpDemand.value = impact.totalDailyDemand;
    });
  }
  if (inpPartNew) {
    inpPartNew.addEventListener('change', () => {
      const compNew = bomModel.getComponent(inpPartNew.value.trim());
      if (inpDockDay && compNew.dockDay) inpDockDay.value = compNew.dockDay;
    });
  }

  // Submit automated ECN form
  if (newEcnForm) {
    newEcnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formId = document.getElementById('inpEcnId').value.trim() || `ECN-0${Math.floor(Math.random() * 800 + 200)}`;
      const partOld = document.getElementById('inpPartOld').value.trim() || 'COMP-A-104';
      const partNew = document.getElementById('inpPartNew').value.trim() || 'COMP-B-208';
      const reason = document.getElementById('inpReason').value.trim() || 'Engineering specification update';
      const stock = parseInt(document.getElementById('inpStock').value, 10) || 680;
      const demand = parseInt(document.getElementById('inpDemand').value, 10) || 40;
      const dockDay = parseInt(document.getElementById('inpDockDay').value, 10) || 11;

      // Automated ECN Analysis Pipeline
      const analysis = ecnIntelligenceService.analyzeEcn({
        id: formId,
        partOld,
        partNew,
        initialStock: stock,
        dailyDemand: demand,
        dockDay,
        reason
      });

      const newRecord = {
        id: formId,
        partOld,
        partNew,
        revision: 'Rev A → Rev B',
        changeType: 'Form-Fit-Function Revision',
        reason,
        createdDate: new Date().toISOString().slice(0, 10),
        plannedDate: analysis.optimization.recommendedDate,
        initialStock: stock,
        dailyDemand: demand,
        dockDay,
        status: 'Analysis Ready (Automated Pipeline)',
        statusCode: 'ANALYSIS_READY',
        readiness: 'READY',
        analysis,
        inputs: {
          inventory: { label: 'Inventory Balances', status: 'READY', detail: `${stock} units on-hand (${analysis.inventory.available}u available)` },
          bom: { label: 'BOM Structure', status: 'READY', detail: `${analysis.bomImpact.productCount} Finished Products Affected` },
          demand: { label: 'Demand Forecast', status: 'READY', detail: `${demand} units/day combined` },
          materialReady: { label: 'Replacement Material', status: 'READY', detail: `Dock ready Day ${dockDay}` },
          leadTime: { label: 'Supplier Lead Time', status: 'READY', detail: `${analysis.inventory.leadTime} days confirmed PO` },
          productionSchedule: { label: 'Plant Line Schedule', status: 'READY', detail: `${analysis.bomImpact.affectedLines.join(', ') || 'Line 3'} Active` }
        }
      };

      ecns.unshift(newRecord);
      EventBus.emit('ecn:created', newRecord);
      // Persist to PostgreSQL database asynchronously
      dbService.createEcn(newRecord).catch(err => console.warn('Could not persist to DB:', err));
      closeModal();
      setActiveEcn(newRecord.id);
      newEcnForm.reset();
      router.navigate('/cutover');
    });
  }

  // Initial render
  const defaultEcn = ecns[0];
  if (defaultEcn) {
    updateActiveEcnBadges(defaultEcn);
  }
  renderEcnTable();
}
