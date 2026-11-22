/**
 * Data Quality Gate CSV Validator Component
 */
import { ValidationService } from '../services/validation-service.js';
import { CLEAN_CSV, CORRUPT_CSV } from '../data/csv-samples.js';

export function initCsvValidator() {
  const csvInputTextarea = document.getElementById('csvInputTextarea');
  const validateCsvBtn = document.getElementById('validateCsvBtn');
  const loadCleanCsvBtn = document.getElementById('loadCleanCsvBtn');
  const loadCorruptCsvBtn = document.getElementById('loadCorruptCsvBtn');
  const downloadSampleCsvBtn = document.getElementById('downloadSampleCsvBtn');

  const dqTotalCount = document.getElementById('dq-total-count');
  const dqValidCount = document.getElementById('dq-valid-count');
  const dqWarningCount = document.getElementById('dq-warning-count');
  const dqErrorCount = document.getElementById('dq-error-count');
  const dqResultsTableBody = document.getElementById('dqResultsTableBody');
  const dqOverallBadge = document.getElementById('dqOverallBadge');

  if (csvInputTextarea) {
    csvInputTextarea.value = CLEAN_CSV;
  }

  function runCheck() {
    if (!csvInputTextarea) return;

    const res = ValidationService.validate(csvInputTextarea.value);

    if (dqTotalCount) dqTotalCount.textContent = res.totalRecords;
    if (dqValidCount) dqValidCount.textContent = res.validCount;
    if (dqWarningCount) dqWarningCount.textContent = res.warningCount;
    if (dqErrorCount) dqErrorCount.textContent = res.errorCount;

    if (dqOverallBadge) {
      dqOverallBadge.textContent = res.status;
      dqOverallBadge.className = `badge ${res.badgeClass}`;
    }

    if (dqResultsTableBody) {
      dqResultsTableBody.innerHTML = '';
      if (res.issues.length === 0) {
        dqResultsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--success-green); padding: 1rem;">[OK] All records passed data quality constraints. Clean ingestion verified.</td></tr>';
      } else {
        res.issues.forEach(iss => {
          const tr = document.createElement('tr');
          const sevBadge = iss.sev === 'ERROR' ? '<span class="badge badge-risk">ERROR</span>' : '<span class="badge badge-warning">WARN</span>';
          tr.innerHTML = `<td>R${iss.row}</td><td><code>${iss.id}</code></td><td>${iss.desc}</td><td>${sevBadge}</td>`;
          dqResultsTableBody.appendChild(tr);
        });
      }
    }
  }

  if (validateCsvBtn) validateCsvBtn.addEventListener('click', runCheck);

  if (loadCleanCsvBtn) {
    loadCleanCsvBtn.addEventListener('click', () => {
      if (csvInputTextarea) csvInputTextarea.value = CLEAN_CSV;
      runCheck();
    });
  }

  if (loadCorruptCsvBtn) {
    loadCorruptCsvBtn.addEventListener('click', () => {
      if (csvInputTextarea) csvInputTextarea.value = CORRUPT_CSV;
      runCheck();
    });
  }

  if (downloadSampleCsvBtn) {
    downloadSampleCsvBtn.addEventListener('click', () => {
      const blob = new Blob([CLEAN_CSV], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cutoverguard_sample_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  runCheck();
}
