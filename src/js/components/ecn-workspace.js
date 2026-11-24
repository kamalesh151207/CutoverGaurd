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
      const revParts = (item.revision || '').split('→');
      const revOld = revParts[0]?.trim() || item.revOld || 'Rev A';
      const revNew = revParts[1]?.trim() || item.revNew || 'Rev B';

      return `
        <tr class="${isActive ? 'active-row' : ''}" data-ecn-id="${item.id}" style="cursor: pointer;">
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--navy-primary);">
            ${item.id} ${isActive ? '<span class="badge badge-blue" style="font-size: 0.65rem; margin-left: 0.25rem;">ACTIVE</span>' : ''}
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-weight: 600;">${item.partOld}</div>
            <div style="font-size: 0.75rem; color: var(--text-light);">${revOld}</div>
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-weight: 600; color: var(--blue-primary);">${item.partNew}</div>
            <div style="font-size: 0.75rem; color: var(--text-light);">${revNew}</div>
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
      const row = e.target.closest('tr[data-ecn-id]');
      const id = btn ? btn.getAttribute('data-ecn-id') : (row ? row.getAttribute('data-ecn-id') : null);
      if (id) {
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

  // Auto-fill & live preview in modal
  const inpPartOld = document.getElementById('inpPartOld');
  const inpPartNew = document.getElementById('inpPartNew');
  const inpRevOld = document.getElementById('inpRevOld');
  const inpRevNew = document.getElementById('inpRevNew');
  const inpStock = document.getElementById('inpStock');
  const inpReservedOld = document.getElementById('inpReservedOld');
  const inpAllocatedOld = document.getElementById('inpAllocatedOld');
  const inpUnitCost = document.getElementById('inpUnitCost');
  const inpDemand = document.getElementById('inpDemand');
  const inpDockDay = document.getElementById('inpDockDay');
  const inpPoQty = document.getElementById('inpPoQty');
  const inpLeadTime = document.getElementById('inpLeadTime');
  const inpUnitCostNew = document.getElementById('inpUnitCostNew');
  const calcAvailablePreview = document.getElementById('calcAvailablePreview');
  const newEcnErrorBanner = document.getElementById('newEcnErrorBanner');

  function updateAvailablePreview() {
    const onHand = parseInt(inpStock ? inpStock.value : 0, 10) || 0;
    const reserved = parseInt(inpReservedOld ? inpReservedOld.value : 0, 10) || 0;
    const allocated = parseInt(inpAllocatedOld ? inpAllocatedOld.value : 0, 10) || 0;
    const avail = Math.max(0, onHand - reserved - allocated);
    if (calcAvailablePreview) {
      calcAvailablePreview.textContent = `${avail} Units (${onHand} on-hand − ${reserved} reserved − ${allocated} allocated)`;
    }
  }

  [inpStock, inpReservedOld, inpAllocatedOld].forEach(el => {
    if (el) el.addEventListener('input', updateAvailablePreview);
  });

  if (inpPartOld) {
    inpPartOld.addEventListener('change', () => {
      const partId = inpPartOld.value.trim();
      if (!partId) return;
      const comp = bomModel.getComponent(partId);
      const impact = bomModel.analyzeComponentImpact(partId);
      if (comp) {
        if (inpRevOld && comp.revision) inpRevOld.value = comp.revision;
        if (inpStock && comp.onHand !== undefined) inpStock.value = comp.onHand;
        if (inpReservedOld && comp.reserved !== undefined) inpReservedOld.value = comp.reserved;
        if (inpAllocatedOld && comp.allocated !== undefined) inpAllocatedOld.value = comp.allocated || 0;
        if (inpUnitCost && comp.unitCost) inpUnitCost.value = comp.unitCost.toFixed(2);
      }
      if (inpDemand && impact.totalDailyDemand) {
        inpDemand.value = impact.totalDailyDemand;
      }
      updateAvailablePreview();
    });
  }

  if (inpPartNew) {
    inpPartNew.addEventListener('change', () => {
      const partId = inpPartNew.value.trim();
      if (!partId) return;
      const compNew = bomModel.getComponent(partId);
      if (compNew) {
        if (inpRevNew && compNew.revision) inpRevNew.value = compNew.revision;
        if (inpDockDay && compNew.dockDay) inpDockDay.value = compNew.dockDay;
        if (inpLeadTime && compNew.leadTime) inpLeadTime.value = compNew.leadTime;
        if (inpPoQty && compNew.poQty) inpPoQty.value = compNew.poQty;
        if (inpUnitCostNew && compNew.unitCost) inpUnitCostNew.value = compNew.unitCost.toFixed(2);
      }
    });
  }

  // Submit automated ECN form
  if (newEcnForm) {
    newEcnForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (newEcnErrorBanner) newEcnErrorBanner.style.display = 'none';

      const formId = (document.getElementById('inpEcnId')?.value || '').trim();
      const partOld = (document.getElementById('inpPartOld')?.value || '').trim();
      const partNew = (document.getElementById('inpPartNew')?.value || '').trim();
      const changeType = document.getElementById('inpChangeType')?.value || 'Form-Fit-Function Revision';
      const plant = document.getElementById('inpPlant')?.value || 'Plant 3 (Austin / TX)';
      const reason = (document.getElementById('inpReason')?.value || '').trim();
      const revOld = (document.getElementById('inpRevOld')?.value || 'Rev A').trim();
      const revNew = (document.getElementById('inpRevNew')?.value || 'Rev B').trim();

      const onHand = parseInt(document.getElementById('inpStock')?.value, 10);
      const reserved = parseInt(document.getElementById('inpReservedOld')?.value, 10) || 0;
      const allocated = parseInt(document.getElementById('inpAllocatedOld')?.value, 10) || 0;
      const unitCost = parseFloat(document.getElementById('inpUnitCost')?.value) || 12.0;

      const dockDay = parseInt(document.getElementById('inpDockDay')?.value, 10);
      const poQty = parseInt(document.getElementById('inpPoQty')?.value, 10) || 800;
      const leadTime = parseInt(document.getElementById('inpLeadTime')?.value, 10) || 25;
      const poStatus = document.getElementById('inpPoStatus')?.value || 'confirmed';
      const dualSource = document.getElementById('inpDualSource')?.value === 'true';
      const unitCostNew = parseFloat(document.getElementById('inpUnitCostNew')?.value) || 14.5;

      const demand = parseInt(document.getElementById('inpDemand')?.value, 10);
      const safetyBuffer = parseInt(document.getElementById('inpSafetyBuffer')?.value, 10) || 2;
      const shortagePenalty = parseFloat(document.getElementById('inpShortagePenalty')?.value) || 45.0;
      const constraint = document.getElementById('inpConstraint')?.value || 'BALANCED';

      // Validation check
      const missing = [];
      if (!formId) missing.push('ECN Identifier');
      if (!partOld) missing.push('Current Component ID');
      if (!partNew) missing.push('Replacement Component ID');
      if (isNaN(onHand) || onHand < 0) missing.push('Valid On-Hand Stock (>= 0)');
      if (isNaN(demand) || demand <= 0) missing.push('Valid Daily Demand (> 0)');
      if (isNaN(dockDay) || dockDay <= 0) missing.push('Valid Dock Ready Day (> 0)');

      if (missing.length > 0) {
        if (newEcnErrorBanner) {
          newEcnErrorBanner.innerHTML = `<strong>Cannot Launch Analysis:</strong> The following required inputs are missing or invalid: <ul>${missing.map(m => `<li>${m}</li>`).join('')}</ul>`;
          newEcnErrorBanner.style.display = 'block';
        }
        return;
      }

      // Automated ECN Analysis Pipeline using actual user inputs
      const analysis = ecnIntelligenceService.analyzeEcn({
        id: formId,
        partOld,
        partNew,
        revision: `${revOld} → ${revNew}`,
        changeType,
        plant,
        reason: reason || 'Engineering change notice',
        onHand,
        initialStock: onHand,
        reserved,
        allocated,
        unitCost,
        dockDay,
        poQty,
        leadTime,
        poStatus,
        dualSource,
        unitCostNew,
        dailyDemand: demand,
        safetyBuffer,
        shortagePenalty,
        constraint
      });

      const newRecord = {
        id: formId,
        partOld,
        partNew,
        revision: `${revOld} → ${revNew}`,
        changeType,
        plant,
        reason: reason || 'Engineering change notice',
        createdDate: new Date().toISOString().slice(0, 10),
        plannedDate: analysis.optimization.recommendedDate,
        initialStock: onHand,
        onHand,
        reserved,
        allocated,
        dailyDemand: demand,
        dockDay,
        status: analysis.status || (analysis.optimization.isFeasible ? 'Analysis Ready' : 'Infeasible Window'),
        statusCode: analysis.statusCode || (analysis.optimization.isFeasible ? 'ANALYSIS_READY' : 'DATA_PENDING'),
        readiness: analysis.readiness || (analysis.optimization.isFeasible ? 'READY' : 'NEEDS_VALIDATION'),
        analysis,
        inputs: {
          inventory: { label: 'Inventory Balances', status: 'READY', detail: `${onHand} on-hand (${analysis.inventory.available}u freely available, ${reserved}u reserved)` },
          bom: { label: 'BOM Structure', status: 'READY', detail: `${analysis.bomImpact.productCount} Finished Product(s) Affected` },
          demand: { label: 'Demand Forecast', status: 'READY', detail: `${demand} units/day aggregate` },
          materialReady: { label: 'Replacement Material', status: 'READY', detail: `Dock ready Day ${dockDay} (${analysis.optimization.earliestDate || 'Pending'})` },
          leadTime: { label: 'Supplier Lead Time', status: 'READY', detail: `${leadTime} days (${poStatus})` },
          productionSchedule: { label: 'Plant Line Schedule', status: 'READY', detail: `${analysis.bomImpact.affectedLines.join(', ') || plant} Active` }
        }
      };

      // Persist to local array and database
      const existingIdx = ecns.findIndex(e => e.id === newRecord.id);
      if (existingIdx >= 0) {
        ecns[existingIdx] = newRecord;
      } else {
        ecns.unshift(newRecord);
      }

      try {
        await dbService.createEcn(newRecord);
      } catch (err) {
        console.warn('DB persistence warning:', err);
      }

      closeModal();
      setActiveEcn(newRecord.id);
      newEcnForm.reset();
      renderEcnTable();
      router.navigate('/cutover');
    });
  }

  // Listen to external ECN updates (e.g. from tuning controls on Cutover Analysis)
  EventBus.on('ecn:updated', (updatedEcn) => {
    const idx = ecns.findIndex(e => e.id === updatedEcn.id);
    if (idx >= 0) {
      ecns[idx] = { ...ecns[idx], ...updatedEcn };
      renderEcnTable();
    }
  });

  // Initial render
  const defaultEcn = ecns[0];
  if (defaultEcn) {
    updateActiveEcnBadges(defaultEcn);
  }
  renderEcnTable();
}
