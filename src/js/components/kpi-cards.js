/**
 * Executive KPI Cards Synchronization
 */
import { EventBus } from '../core/event-bus.js';

export function initKpiCards(calculationService) {
  const kpiOldStock = document.getElementById('kpi-old-stock');
  const kpiShortage = document.getElementById('kpi-shortage');
  const kpiCostIndex = document.getElementById('kpi-cost-index');

  function updateCards(data) {
    if (!data) return;
    if (kpiOldStock && data.excessOldUnits !== undefined) kpiOldStock.textContent = data.excessOldUnits;
    if (kpiShortage && data.shortageUnits !== undefined) kpiShortage.textContent = data.shortageUnits;
    if (kpiCostIndex && data.totalIndex !== undefined) kpiCostIndex.textContent = Number(data.totalIndex).toFixed(1);
  }

  EventBus.on('cutover:evaluated', updateCards);
  EventBus.on('ecn:changed', () => {
    if (calculationService) {
      const opt = calculationService.evaluateCandidateDay(calculationService.cutoverModel.targetOptimalDay || 15);
      updateCards(opt);
    }
  });
  EventBus.on('calculations:reconfigured', () => {
    if (calculationService) {
      const opt = calculationService.evaluateCandidateDay(calculationService.cutoverModel.targetOptimalDay || 15);
      updateCards(opt);
    }
  });
}
