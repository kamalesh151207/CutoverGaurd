/**
 * Executive KPI Cards Synchronization
 */
import { eventBus } from '../core/event-bus.js';

export function initKpiCards() {
  const kpiOldStock = document.getElementById('kpi-old-stock');
  const kpiShortage = document.getElementById('kpi-shortage');
  const kpiCostIndex = document.getElementById('kpi-cost-index');

  eventBus.on('cutover:evaluated', (data) => {
    if (kpiOldStock) kpiOldStock.textContent = data.excessOldUnits;
    if (kpiShortage) kpiShortage.textContent = data.shortageUnits;
    if (kpiCostIndex) kpiCostIndex.textContent = data.totalIndex.toFixed(1);
  });
}
