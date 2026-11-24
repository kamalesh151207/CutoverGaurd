/**
 * Multi-Plant Inventory & Transfer Optimization Component
 * Analyzes cross-facility inventory buffers, inter-plant logistics transfer viability,
 * and multi-site coordinated cutover scheduling.
 */

import { EventBus } from '../core/event-bus.js';

export function initMultiPlant(calculationService) {
  const multiPlantGrid = document.getElementById('multiPlantGrid');
  const executeTransferBtn = document.getElementById('executeTransferBtn');
  const transferToastMsg = document.getElementById('transferToastMsg');

  const plants = [
    {
      id: 'PLANT-03',
      name: 'Plant 3 (Austin, Texas)',
      focus: 'EV Inverters & SiC Powertrain',
      lines: 'Line 1, Line 3',
      onHand: 680,
      reserved: 80,
      available: 600,
      dailyRate: 40,
      runoutDays: 15,
      status: 'OPTIMIZATION_TARGET',
      badgeClass: 'badge-blue'
    },
    {
      id: 'PLANT-01',
      name: 'Plant 1 (Detroit, Michigan)',
      focus: 'Commercial Chassis & Metal Enclosures',
      lines: 'Line 4',
      onHand: 950,
      reserved: 50,
      available: 900,
      dailyRate: 50,
      runoutDays: 18,
      status: 'SURPLUS_BUFFER_AVAILABLE',
      badgeClass: 'badge-feasible'
    },
    {
      id: 'PLANT-02',
      name: 'Plant 2 (Stuttgart, Germany)',
      focus: 'Precision Hydraulic Spool Valves',
      lines: 'Line 2',
      onHand: 420,
      reserved: 20,
      available: 400,
      dailyRate: 25,
      runoutDays: 16,
      status: 'BALANCED_STABLE',
      badgeClass: 'badge-neutral'
    }
  ];

  function renderPlants() {
    if (!multiPlantGrid) return;

    multiPlantGrid.innerHTML = plants.map(p => `
      <div class="card" style="margin-bottom: 0; padding: 1rem; border: 1px solid var(--border-color); background: #FFF;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <span style="font-family: var(--font-mono); font-size: 0.725rem; color: var(--text-muted);">${p.id}</span>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--navy-primary);">${p.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.focus}</div>
          </div>
          <span class="badge ${p.badgeClass}" style="font-size: 0.65rem;">${p.status.replace(/_/g, ' ')}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: var(--bg-surface-subtle); padding: 0.65rem; border-radius: var(--radius-xs); margin: 0.75rem 0; font-family: var(--font-mono); font-size: 0.8rem;">
          <div>
            <span style="font-size: 0.675rem; color: var(--text-muted); display: block;">AVAILABLE</span>
            <strong>${p.available} u</strong>
          </div>
          <div>
            <span style="font-size: 0.675rem; color: var(--text-muted); display: block;">DAILY BURN</span>
            <strong>${p.dailyRate} u/d</strong>
          </div>
          <div>
            <span style="font-size: 0.675rem; color: var(--text-muted); display: block;">RUNOUT</span>
            <strong style="color: var(--blue-primary);">${p.runoutDays} Days</strong>
          </div>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-muted);">
          Assigned Lines: <strong>${p.lines}</strong>
        </div>
      </div>
    `).join('');
  }

  if (executeTransferBtn) {
    executeTransferBtn.addEventListener('click', () => {
      if (transferToastMsg) {
        transferToastMsg.textContent = '✓ Inter-Plant Transfer Order XFER-2026-081 authorized: 120 units routed from Plant 1 (Detroit) to Plant 3 (Austin). Freight transit: 48h. Estimated net savings: $3,840.';
        transferToastMsg.style.display = 'block';
        setTimeout(() => {
          transferToastMsg.style.display = 'none';
        }, 6000);
      }
    });
  }

  renderPlants();
}
