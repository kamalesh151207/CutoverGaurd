// src/js/components/db-status.js - Live PostgreSQL (Supabase) Database Status Badge & Modal
import { dbService } from '../services/db-service.js';
import { EventBus } from '../core/event-bus.js';

export function initDbStatus() {
  const dbStatusBadge = document.getElementById('dbStatusBadge');
  const dbStatusLabel = document.getElementById('dbStatusLabel');
  const dbModal = document.getElementById('dbDiagnosticsModal');
  const closeDbModalBtn = document.getElementById('closeDbModalBtn');
  const recheckDbBtn = document.getElementById('recheckDbBtn');
  const reseedDbBtn = document.getElementById('reseedDbBtn');

  function updateBadge(status) {
    if (!dbStatusBadge || !dbStatusLabel) return;

    if (status && status.connected) {
      dbStatusBadge.className = 'db-status-pill connected';
      dbStatusLabel.textContent = 'PostgreSQL Live';
      dbStatusBadge.title = `Connected to PostgreSQL on Supabase (${status.latencyMs}ms)`;
    } else {
      dbStatusBadge.className = 'db-status-pill disconnected';
      dbStatusLabel.textContent = 'DB Local/Demo';
      dbStatusBadge.title = status && status.error ? `DB Offline: ${status.error}` : 'DB Not Connected';
    }
  }

  function updateModalDetails(status) {
    const hostEl = document.getElementById('dbDiagHost');
    const dbEl = document.getElementById('dbDiagDatabase');
    const statusEl = document.getElementById('dbDiagStatus');
    const latencyEl = document.getElementById('dbDiagLatency');
    const versionEl = document.getElementById('dbDiagVersion');
    const countsEl = document.getElementById('dbDiagCounts');

    if (hostEl) hostEl.textContent = status.host || 'db.awbnjokoyxibmkfcqxey.supabase.co:5432';
    if (dbEl) dbEl.textContent = status.database || 'postgres (Supabase Cloud)';
    if (statusEl) {
      statusEl.innerHTML = status.connected 
        ? '<span class="badge badge-feasible">ONLINE / READY</span>' 
        : '<span class="badge badge-risk">OFFLINE / LOCAL FALLBACK</span>';
    }
    if (latencyEl) latencyEl.textContent = status.latencyMs ? `${status.latencyMs} ms` : 'N/A';
    if (versionEl) versionEl.textContent = status.version ? status.version.split(' on ')[0] : 'PostgreSQL 17.x';
    if (countsEl) {
      if (status.counts) {
        countsEl.innerHTML = `
          <div style="display: flex; gap: 0.75rem; margin-top: 0.25rem;">
            <span><strong>${status.counts.ecns}</strong> ECNs</span>
            <span>&bull;</span>
            <span><strong>${status.counts.decisions}</strong> Decisions</span>
            <span>&bull;</span>
            <span><strong>${status.counts.audit}</strong> Audit Logs</span>
          </div>
        `;
      } else {
        countsEl.textContent = 'Tables synchronized: ecns, decision_history, audit_log';
      }
    }
  }

  // Periodic check
  async function performCheck() {
    const status = await dbService.checkStatus();
    updateBadge(status);
    updateModalDetails(status);
  }

  // Initial check
  performCheck();

  // Listen to status events
  EventBus.on('db:status', (status) => {
    updateBadge(status);
    updateModalDetails(status);
  });

  // Modal interactions
  if (dbStatusBadge && dbModal) {
    dbStatusBadge.addEventListener('click', () => {
      dbModal.classList.add('visible');
    });
  }

  if (closeDbModalBtn && dbModal) {
    closeDbModalBtn.addEventListener('click', () => {
      dbModal.classList.remove('visible');
    });
  }

  if (dbModal) {
    dbModal.addEventListener('click', (e) => {
      if (e.target === dbModal) {
        dbModal.classList.remove('visible');
      }
    });
  }

  if (recheckDbBtn) {
    recheckDbBtn.addEventListener('click', async () => {
      recheckDbBtn.textContent = 'Checking...';
      await performCheck();
      recheckDbBtn.textContent = 'Refresh Connection';
    });
  }

  if (reseedDbBtn) {
    reseedDbBtn.addEventListener('click', async () => {
      reseedDbBtn.textContent = 'Syncing...';
      try {
        const res = await fetch('/api/db/init', { method: 'POST' });
        if (res.ok) {
          await performCheck();
          alert('Database schema and tables synced successfully with Supabase!');
        }
      } catch (e) {
        alert('Sync error: ' + e.message);
      } finally {
        reseedDbBtn.textContent = 'Re-Sync Schema & Data';
      }
    });
  }
}
