/**
 * Cryptographic Audit Chain Component
 */
import { AuditService } from '../services/audit-service.js';
import { INITIAL_AUDIT_ENTRIES } from '../data/demo-data.js';
import { dbService } from '../services/db-service.js';

export function initAuditChain() {
  const auditChainStream = document.getElementById('auditChainStream');
  const auditVerifyBtn = document.getElementById('auditVerifyBtn');
  const auditTamperBtn = document.getElementById('auditTamperBtn') || document.getElementById('tamperAuditChainBtn');
  const auditRestoreBtn = document.getElementById('auditRestoreBtn') || document.getElementById('restoreAuditChainBtn');
  const auditAlgorithmBadge = document.getElementById('auditAlgorithmBadge');

  const auditService = new AuditService();
  let currentChain = [];

  async function restoreOriginal() {
    let entries = INITIAL_AUDIT_ENTRIES;
    try {
      const dbEntries = await dbService.getAuditLog();
      if (dbEntries && dbEntries.length > 0) {
        entries = dbEntries;
      }
    } catch {}
    currentChain = await auditService.buildChain(entries);
    await renderChain();
  }

  async function renderChain() {
    if (!auditChainStream) return;

    const verification = await auditService.verifyChain(currentChain);

    if (auditAlgorithmBadge) {
      auditAlgorithmBadge.textContent = verification.algorithm;
    }

    auditChainStream.innerHTML = '';

    verification.blocks.forEach((rec, i) => {
      const node = document.createElement('div');
      node.className = rec.nodeClass;
      node.innerHTML = `
        <div class="audit-meta-row">
          <div>
            <span class="audit-id">${rec.id} &mdash; ${rec.type}</span>
          </div>
          <div>${rec.statusHtml}</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; background: var(--bg-surface-subtle); padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
          <strong>PAYLOAD:</strong> ${JSON.stringify(rec.data)}
        </div>
        <div class="hash-row">
          <span class="hash-label">RECORDED PREV HASH:</span>
          <span class="hash-val ${rec.isMismatch ? 'alert' : ''}">${rec.prevHash.substring(0, 32)}...</span>
          <span class="hash-label">COMPUTED BLOCK HASH:</span>
          <span class="hash-val ${rec.isTampered ? 'alert' : ''}">${rec.computedHash.substring(0, 32)}...</span>
        </div>
      `;
      auditChainStream.appendChild(node);

      if (i < verification.blocks.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'chain-connector';
        connector.innerHTML = rec.broken 
          ? '<span style="color: var(--risk-red); font-weight: bold;">&times; [INTEGRITY CHAIN COMPROMISED]</span>' 
          : '&darr;';
        auditChainStream.appendChild(connector);
      }
    });

    return verification;
  }

  if (auditVerifyBtn) {
    auditVerifyBtn.addEventListener('click', async () => {
      const result = await renderChain();
      if (result && result.isValid) {
        alert('Cryptographic Verification PASSED: All blocks in the ledger have valid SHA-256 parent-child hash linkages and uncorrupted payloads.');
      } else {
        alert('Cryptographic Verification FAILED: Tamper detected! Block hashes do not match recorded cryptographic signatures.');
      }
    });
  }

  if (auditTamperBtn) {
    auditTamperBtn.addEventListener('click', async () => {
      if (currentChain.length > 1) {
        // Retroactively modify committed cutover date & cost in Block 2
        currentChain[1].data.minCostDate = '05 DEC'; // ILLEGAL CHANGE
        currentChain[1].data.costIndex = 42.0;       // FORGED VALUE
        await renderChain();
      }
    });
  }

  if (auditRestoreBtn) {
    auditRestoreBtn.addEventListener('click', restoreOriginal);
  }

  restoreOriginal();
}
