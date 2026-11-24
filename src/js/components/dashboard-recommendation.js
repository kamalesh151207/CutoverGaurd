/**
 * Dashboard Recommended Cutover & Multi-ECN Summary Component
 * Displays prominent executive recommendation metrics, transition timeline,
 * and searchable active ECN recommendation table directly on the Overview Dashboard.
 */

import { EventBus } from '../core/event-bus.js';
import { router } from '../core/router.js';
import { SYNTHETIC_ECNS } from '../data/demo-data.js';
import { ecnIntelligenceService } from '../services/ecn-intelligence-service.js';

export function initDashboardRecommendation(calculationService) {
  // Metric Readouts
  const ovRecDateDisplay = document.getElementById('ovRecDateDisplay');
  const ovFeasibleWindowDisplay = document.getElementById('ovFeasibleWindowDisplay');
  const ovLrmDisplay = document.getElementById('ovLrmDisplay');
  const ovCostIndexDisplay = document.getElementById('ovCostIndexDisplay');
  const ovOldStockDisplay = document.getElementById('ovOldStockDisplay');
  const ovReplacementStockDisplay = document.getElementById('ovReplacementStockDisplay');
  const ovShortageDisplay = document.getElementById('ovShortageDisplay');
  const ovFeasibilityBadge = document.getElementById('ovFeasibilityBadge');
  const ovActiveEcnBadge = document.getElementById('ovActiveEcnBadge');
  const ovConfidenceDisplay = document.getElementById('ovConfidenceDisplay');
  const ovTimestampDisplay = document.getElementById('ovTimestampDisplay');
  const ovTimelineSvg = document.getElementById('ovTimelineSvg');
  const ovEcnSummaryTableBody = document.getElementById('ovEcnSummaryTableBody');
  const ovEcnSearchInput = document.getElementById('ovEcnSearchInput');

  function renderExecutiveRecommendation() {
    const ecn = calculationService.activeEcn || SYNTHETIC_ECNS[0] || {};
    const analysis = ecnIntelligenceService.analyzeEcn(ecn);
    const opt = analysis.optimization;
    const inv = analysis.inventory;

    if (ovRecDateDisplay) ovRecDateDisplay.textContent = opt.recommendedDate;
    if (ovFeasibleWindowDisplay) ovFeasibleWindowDisplay.textContent = `${opt.feasibleWindow} 2026`;
    if (ovLrmDisplay) ovLrmDisplay.textContent = opt.lrmDate;
    if (ovCostIndexDisplay) ovCostIndexDisplay.textContent = `${opt.costIndex} pts`;
    if (ovOldStockDisplay) ovOldStockDisplay.textContent = `${opt.excessOldUnits} units ($${opt.scrapCostUsd.toLocaleString()})`;
    if (ovReplacementStockDisplay) ovReplacementStockDisplay.textContent = `${inv.replacementPoQty} units (Day ${inv.dockDay} Arrival)`;
    if (ovShortageDisplay) {
      ovShortageDisplay.textContent = `${opt.shortageUnits} units`;
      ovShortageDisplay.style.color = opt.shortageUnits === 0 ? 'var(--success-green)' : 'var(--risk-red)';
    }
    if (ovFeasibilityBadge) {
      ovFeasibilityBadge.textContent = opt.feasibilityStatus;
      ovFeasibilityBadge.className = `badge ${opt.isFeasible ? 'badge-feasible' : 'badge-risk'}`;
    }
    if (ovActiveEcnBadge) {
      ovActiveEcnBadge.textContent = `${ecn.id || 'ECN-0248'} (${analysis.partOld} → ${analysis.partNew})`;
    }
    if (ovConfidenceDisplay) {
      ovConfidenceDisplay.textContent = '95.4% Certified High Confidence';
    }
    if (ovTimestampDisplay) {
      ovTimestampDisplay.textContent = `Calculated: ${new Date().toLocaleTimeString()} UTC`;
    }

    renderTransitionTimeline(opt, inv);
    renderMultiEcnTable();
  }

  function renderTransitionTimeline(opt, inv) {
    if (!ovTimelineSvg) return;

    const width = 860;
    const height = 90;
    const padL = 40;
    const padR = 40;
    const plotW = width - padL - padR;

    const scaleX = (d) => padL + ((d - 1) / 30) * plotW;

    const dockX = scaleX(inv.dockDay || 11);
    const recX = scaleX(opt.recommendedDay || 15);
    const burnX = scaleX(opt.burnDays || 17);
    const lrmX = scaleX(opt.lrmDay || 19);

    ovTimelineSvg.innerHTML = `
      <!-- Track Background Horizon -->
      <line x1="${padL}" y1="40" x2="${width - padR}" y2="40" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" />
      
      <!-- Feasible Window Band -->
      <rect x="${dockX}" y="36" width="${lrmX - dockX}" height="8" fill="var(--success-green)" opacity="0.3" rx="4" />

      <!-- Dock Milestone -->
      <circle cx="${dockX}" cy="40" r="6" fill="#16A34A" stroke="#FFFFFF" stroke-width="2" />
      <text x="${dockX}" y="22" font-size="10" font-family="var(--font-mono)" font-weight="bold" fill="#16A34A" text-anchor="middle">Dock: ${inv.dockDay} DEC</text>

      <!-- Recommended Cutover Vertex -->
      <circle cx="${recX}" cy="40" r="9" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" />
      <line x1="${recX}" y1="15" x2="${recX}" y2="65" stroke="#2563EB" stroke-dasharray="3,2" stroke-width="1.5" />
      <text x="${recX}" y="78" font-size="11" font-family="var(--font-mono)" font-weight="bold" fill="#2563EB" text-anchor="middle">★ Recommended: ${opt.recommendedDay} DEC</text>

      <!-- Old Stock Burnout Milestone -->
      <circle cx="${burnX}" cy="40" r="5" fill="#172B4D" stroke="#FFFFFF" stroke-width="1.5" />
      <text x="${burnX}" y="22" font-size="9" font-family="var(--font-mono)" fill="#172B4D" text-anchor="middle">Burnout: ${opt.burnDays} DEC</text>

      <!-- LRM Milestone -->
      <circle cx="${lrmX}" cy="40" r="7" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2" />
      <text x="${lrmX}" y="22" font-size="10" font-family="var(--font-mono)" font-weight="bold" fill="#F59E0B" text-anchor="middle">LRM: ${opt.lrmDay} DEC</text>
    `;
  }

  function renderMultiEcnTable() {
    if (!ovEcnSummaryTableBody) return;

    const query = (ovEcnSearchInput ? ovEcnSearchInput.value : '').toLowerCase().trim();
    const activeId = calculationService.activeEcn?.id || 'ECN-0248';

    const ecnList = SYNTHETIC_ECNS.filter(e => 
      e.id.toLowerCase().includes(query) ||
      e.partOld.toLowerCase().includes(query) ||
      e.partNew.toLowerCase().includes(query)
    );

    ovEcnSummaryTableBody.innerHTML = ecnList.map(ecn => {
      const analysis = ecnIntelligenceService.analyzeEcn(ecn);
      const opt = analysis.optimization;
      const isActive = ecn.id === activeId;

      return `
        <tr style="${isActive ? 'background: rgba(37, 99, 235, 0.04); font-weight: 600;' : ''}">
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--navy-primary);">
            ${ecn.id} ${isActive ? '<span class="badge badge-blue" style="font-size: 0.65rem; margin-left: 0.25rem;">ACTIVE</span>' : ''}
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">
            ${ecn.partOld} &rarr; <strong style="color: var(--blue-primary);">${ecn.partNew}</strong>
          </td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--blue-primary); font-size: 0.85rem;">
            ${opt.recommendedDate}
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">
            ${opt.feasibleWindow}
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">
            ${opt.excessOldUnits} units ($${opt.scrapCostUsd.toLocaleString()})
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: ${opt.shortageUnits === 0 ? 'var(--success-green)' : 'var(--risk-red)'};">
            ${opt.shortageUnits} units
          </td>
          <td>
            <span class="badge ${opt.isFeasible ? 'badge-feasible' : 'badge-risk'}">${opt.feasibilityStatus}</span>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm select-dashboard-ecn-btn" data-ecn-id="${ecn.id}" style="padding: 0.2rem 0.55rem; font-size: 0.725rem;">
              ${isActive ? 'Active Workbench' : 'Analyze Cutover &rarr;'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    ovEcnSummaryTableBody.querySelectorAll('.select-dashboard-ecn-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ecn-id');
        const target = SYNTHETIC_ECNS.find(e => e.id === id);
        if (target) {
          calculationService.reconfigureWithEcn(target);
          EventBus.emit('ecn:changed', target);
          router.navigate('/cutover');
        }
      });
    });
  }

  if (ovEcnSearchInput) {
    ovEcnSearchInput.addEventListener('input', renderMultiEcnTable);
  }

  EventBus.on('ecn:changed', renderExecutiveRecommendation);
  EventBus.on('ecn:created', renderExecutiveRecommendation);
  EventBus.on('calculations:reconfigured', renderExecutiveRecommendation);

  renderExecutiveRecommendation();
}
