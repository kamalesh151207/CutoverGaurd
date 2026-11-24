/**
 * Decision Comparison Report Generator Component
 * Generates exportable executive reports with print-ready formatting and CSV matrix download.
 */
import { router } from '../core/router.js';

export function initDecisionReport(calculationService) {
  const openReportModalBtn = document.getElementById('openReportModalBtn');
  const reportModal = document.getElementById('decisionReportModal');
  const closeReportModalBtn = document.getElementById('closeReportModalBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  const exportReportCsvBtn = document.getElementById('exportReportCsvBtn');

  // Report Fields
  const repEcnId = document.getElementById('repEcnId');
  const repParts = document.getElementById('repParts');
  const repRecDate = document.getElementById('repRecDate');
  const repWindow = document.getElementById('repWindow');
  const repCost = document.getElementById('repCost');
  const repScrap = document.getElementById('repScrap');
  const repShortage = document.getElementById('repShortage');
  const repGuardrailsStatus = document.getElementById('repGuardrailsStatus');
  const repAiSummary = document.getElementById('repAiSummary');
  const repTimestamp = document.getElementById('repTimestamp');

  function populateReport() {
    const ecn = calculationService.activeEcn || {};
    const day = calculationService.cutoverModel.targetOptimalDay || 15;
    const model = calculationService.evaluateCandidateDay(day);
    const summary = calculationService.cutoverModel.getOptimizationSummary();
    const guardrails = calculationService.evaluateGuardrails(day);
    const aiRisks = calculationService.predictAiRisks();

    if (repEcnId) repEcnId.textContent = ecn.id || 'ECN-0248';
    if (repParts) repParts.textContent = `${ecn.partOld || 'COMP-A-104'} → ${ecn.partNew || 'COMP-B-208'}`;
    if (repRecDate) repRecDate.textContent = `${day}-DEC-2026`;
    if (repWindow) repWindow.textContent = summary.feasibleWindow;
    if (repCost) repCost.textContent = `${model.totalIndex} pts`;
    if (repScrap) repScrap.textContent = `${model.excessOldUnits} units ($${(model.excessOldUnits * 12).toLocaleString()})`;
    if (repShortage) repShortage.textContent = `${model.shortageUnits} units ($0 deficit)`;
    if (repGuardrailsStatus) {
      repGuardrailsStatus.textContent = guardrails.statusLabel;
      repGuardrailsStatus.className = `badge ${guardrails.badgeClass}`;
    }
    if (repAiSummary) {
      repAiSummary.textContent = calculationService.generateAiExplanation(day);
    }
    if (repTimestamp) {
      repTimestamp.textContent = new Date().toUTCString();
    }
  }

  function openReport() {
    populateReport();
    if (reportModal) reportModal.classList.add('visible');
  }

  function closeReport() {
    if (reportModal) reportModal.classList.remove('visible');
  }

  if (openReportModalBtn) openReportModalBtn.addEventListener('click', openReport);
  document.querySelectorAll('.open-report-btn').forEach(btn => {
    btn.addEventListener('click', openReport);
  });
  if (closeReportModalBtn) closeReportModalBtn.addEventListener('click', closeReport);

  if (reportModal) {
    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) closeReport();
    });
  }

  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (exportReportCsvBtn) {
    exportReportCsvBtn.addEventListener('click', () => {
      const horizon = calculationService.computeFullHorizon();
      const headers = ['Day', 'Date', 'Excess_Old_Stock', 'Scrap_Cost_USD', 'Shortage_Units', 'Shortage_Cost_Index', 'Total_Cost_Index', 'Feasibility_Status'];
      const rows = horizon.map(h => [
        h.day,
        `2026-12-${h.day < 10 ? '0' + h.day : h.day}`,
        h.excessOldUnits,
        (h.excessOldUnits * 12).toFixed(2),
        h.shortageUnits,
        h.shortageCostIndex.toFixed(2),
        h.totalIndex.toFixed(2),
        h.status
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CutoverGuard_Decision_Matrix_${calculationService.activeEcn.id || 'ECN-0248'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
