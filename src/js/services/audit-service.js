/**
 * Cryptographic Audit Chain & Hash Integrity Service
 */

export class AuditService {
  constructor() {
    this.algorithmLabel = 'SHA-256 (WEB CRYPTO API)';
  }

  /**
   * Generates SHA-256 hash using native Web Crypto API with deterministic fallback.
   */
  async hash(str) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      this.algorithmLabel = 'SHA-256 (WEB CRYPTO API)';
      const enc = new TextEncoder();
      const buf = await window.crypto.subtle.digest('SHA-256', enc.encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    this.algorithmLabel = 'DETERMINISTIC FNV-1A (OFFLINE FALLBACK)';
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(16).padStart(16, '0') + 'b42c8a3f91d7';
  }

  /**
   * Initializes and seals an immutable audit chain from initial entry records.
   */
  async buildChain(entries) {
    const chain = JSON.parse(JSON.stringify(entries));
    for (let i = 0; i < chain.length; i++) {
      if (i === 0) {
        chain[i].prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
      } else {
        const prevPayload = `${chain[i-1].id}|${chain[i-1].type}|${chain[i-1].ts}|${JSON.stringify(chain[i-1].data)}|${chain[i-1].prevHash}`;
        chain[i].prevHash = await this.hash(prevPayload);
      }
      const currentPayload = `${chain[i].id}|${chain[i].type}|${chain[i].ts}|${JSON.stringify(chain[i].data)}|${chain[i].prevHash}`;
      chain[i].recordedBlockHash = await this.hash(currentPayload);
      chain[i].computedHash = chain[i].recordedBlockHash;
    }
    return chain;
  }

  /**
   * Verifies chain integrity without mutating recorded previous hashes.
   */
  async verifyChain(chain) {
    const verifiedBlocks = [];
    let broken = false;

    for (let i = 0; i < chain.length; i++) {
      const rec = chain[i];
      const payload = `${rec.id}|${rec.type}|${rec.ts}|${JSON.stringify(rec.data)}|${rec.prevHash}`;
      const computedHash = await this.hash(payload);
      rec.computedHash = computedHash;

      let statusHtml = '<span class="badge badge-feasible">VALID &mdash; HASH VERIFIED</span>';
      let nodeClass = 'audit-node valid';
      let isTampered = false;
      let isMismatch = false;

      // Has this record's payload been modified?
      if (rec.recordedBlockHash && computedHash !== rec.recordedBlockHash) {
        broken = true;
        isTampered = true;
        statusHtml = '<span class="badge badge-risk">RECORD DATA ALTERED (FORGERY DETECTED)</span>';
        nodeClass = 'audit-node compromised';
      } else if (i > 0) {
        const expectedPrev = verifiedBlocks[i - 1].computedHash;
        if (rec.prevHash !== expectedPrev || broken) {
          broken = true;
          isMismatch = true;
          statusHtml = '<span class="badge badge-risk">INTEGRITY BREACH &mdash; PREV HASH MISMATCH</span>';
          nodeClass = 'audit-node compromised';
        }
      }

      verifiedBlocks.push({
        ...rec,
        nodeClass,
        statusHtml,
        broken,
        isTampered,
        isMismatch
      });
    }

    return {
      blocks: verifiedBlocks,
      isValid: !broken,
      algorithm: this.algorithmLabel
    };
  }
}
