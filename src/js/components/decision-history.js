// src/js/components/decision-history.js - Decision History & Commitments Log
import { DECISION_HISTORY_RECORDS } from '../data/demo-data.js';
import { EventBus } from '../core/event-bus.js';
import { dbService } from '../services/db-service.js';

export function initDecisionHistory() {
  const historyTableBody = document.getElementById('historyTableBody');
  const historyDetailModal = document.getElementById('historyDetailModal');
  const closeHistoryDetailBtn = document.getElementById('closeHistoryDetailBtn');
  const exportHistoryCsvBtn = document.getElementById('exportHistoryCsvBtn');
  const replayDecisionBtn = document.getElementById('replayDecisionBtn');

  let records = [...DECISION_HISTORY_RECORDS];
  let activeDetailRecord = null;

  // Asynchronously load decision records from PostgreSQL database
  dbService.getDecisions().then(loadedDecisions => {
    if (loadedDecisions && loadedDecisions.length > 0) {
      records = loadedDecisions;
      renderHistoryTable();
    }
  });

  EventBus.on('decision:saved', (newDec) => {
    records.unshift(newDec);
    renderHistoryTable();
  });

  function renderHistoryTable() {
    if (!historyTableBody) return;

    historyTableBody.innerHTML = records.map(rec => {
      const badgeClass = rec.action === 'APPROVED' ? 'badge-feasible' :
                         rec.action === 'RECALCULATED' ? 'badge-blue' : 'badge-warning';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--navy-primary);">${rec.id}</td>
          <td style="font-family: var(--font-mono); font-weight: 600;">${rec.ecn}</td>
          <td style="font-size: 0.825rem;">${rec.parts}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">${rec.runVersion}</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--blue-primary);">${rec.recommendedDate}</td>
          <td style="font-family: var(--font-mono); font-weight: 600;">${rec.costIndex}</td>
          <td><span class="badge ${badgeClass}">${rec.action}</span></td>
          <td style="font-size: 0.775rem; color: var(--text-muted);">${rec.planner}</td>
          <td style="font-size: 0.75rem; color: var(--text-light); font-family: var(--font-mono);">${rec.timestamp}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm view-history-btn" data-history-id="${rec.id}" style="padding: 0.2rem 0.55rem; font-size: 0.725rem;">
              Inspect
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function showRecordDetail(recordId) {
    const rec = records.find(r => r.id === recordId);
    if (!rec || !historyDetailModal) return;
    activeDetailRecord = rec;

    document.getElementById('histDetailId').textContent = rec.id;
    document.getElementById('histDetailEcn').textContent = rec.ecn;
    document.getElementById('histDetailParts').textContent = rec.parts;
    document.getElementById('histDetailDate').textContent = rec.recommendedDate;
    document.getElementById('histDetailWindow').textContent = rec.feasibleWindow;
    document.getElementById('histDetailLrm').textContent = rec.lrm;
    document.getElementById('histDetailCost').textContent = rec.costIndex;
    document.getElementById('histDetailExcess').textContent = rec.excessStock;
    document.getElementById('histDetailShortage').textContent = rec.shortageRisk;
    document.getElementById('histDetailPlanner').textContent = rec.planner;
    document.getElementById('histDetailTs').textContent = rec.timestamp;
    document.getElementById('histDetailHash').textContent = rec.hash;

    historyDetailModal.classList.add('visible');
  }

  if (historyTableBody) {
    historyTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-history-btn');
      if (btn) {
        const id = btn.getAttribute('data-history-id');
        showRecordDetail(id);
      }
    });
  }

  if (closeHistoryDetailBtn && historyDetailModal) {
    closeHistoryDetailBtn.addEventListener('click', () => {
      historyDetailModal.classList.remove('visible');
    });
    historyDetailModal.addEventListener('click', (e) => {
      if (e.target === historyDetailModal) historyDetailModal.classList.remove('visible');
    });
  }

  if (replayDecisionBtn) {
    replayDecisionBtn.addEventListener('click', () => {
      if (!activeDetailRecord) return;
      const dayMatch = activeDetailRecord.recommendedDate.match(/^(\d+)/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 15;
      
      const dateSlider = document.getElementById('cutoverDateSlider');
      if (dateSlider) {
        dateSlider.value = day;
        dateSlider.dispatchEvent(new Event('input'));
      }
      
      if (historyDetailModal) historyDetailModal.classList.remove('visible');
      import('../core/router.js').then(({ router }) => {
        router.navigate('/cutover');
      });
    });
  }

  if (exportHistoryCsvBtn) {
    exportHistoryCsvBtn.addEventListener('click', () => {
      const headers = ['Record_ID', 'ECN', 'Transition_Parts', 'Version', 'Recommended_Date', 'Cost_Index', 'Action', 'Planner', 'Timestamp', 'Hash'];
      const rows = records.map(r => [
        r.id, r.ecn, `"${r.parts}"`, `"${r.runVersion}"`, r.recommendedDate, r.costIndex, r.action, `"${r.planner}"`, `"${r.timestamp}"`, r.hash
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CutoverGuard_Decision_History_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Listen for planner actions committed elsewhere
  EventBus.on('planner:action', (data) => {
    const newEntry = {
      id: `DEC-2026-00${records.length + 2}`,
      ecn: data.ecn || 'ECN-0248',
      parts: data.parts || 'COMP-A-104 → COMP-B-208',
      runVersion: 'v1.4 (Interactive Session Commit)',
      recommendedDate: data.date || '15-DEC-2026',
      feasibleWindow: '11-DEC to 19-DEC',
      lrm: '19-DEC-2026',
      costIndex: data.costIndex || 82.4,
      excessStock: '120 units',
      shortageRisk: '0.0%',
      action: data.action || 'APPROVED',
      planner: 'PLN-8842 (User Planner)',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'COMMITTED',
      hash: Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10)
    };
    records.unshift(newEntry);
    renderHistoryTable();
  });

  renderHistoryTable();
}
