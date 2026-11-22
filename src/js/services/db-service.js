// src/js/services/db-service.js - Client Database Service for PostgreSQL (Supabase) Integration
import { EventBus } from '../core/event-bus.js';
import { SYNTHETIC_ECNS, DECISION_HISTORY_RECORDS, INITIAL_AUDIT_ENTRIES } from '../data/demo-data.js';

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.statusDetails = null;
  }

  async checkStatus() {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        this.isConnected = data.connected;
        this.statusDetails = data;
        EventBus.emit('db:status', data);
        return data;
      }
    } catch (e) {
      this.isConnected = false;
      this.statusDetails = { connected: false, error: e.message };
    }
    EventBus.emit('db:status', this.statusDetails);
    return this.statusDetails;
  }

  async getEcns() {
    try {
      const res = await fetch('/api/ecns');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[DB Service] Failed to fetch ECNs from database, using cached/demo data:', e);
    }
    return [...SYNTHETIC_ECNS];
  }

  async createEcn(ecnData) {
    try {
      const res = await fetch('/api/ecns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ecnData)
      });
      if (res.ok) {
        const json = await res.json();
        EventBus.emit('ecn:created', json.data);
        return json.data;
      }
    } catch (e) {
      console.warn('[DB Service] Failed to save ECN to database:', e);
    }
    // Fallback: emit locally
    EventBus.emit('ecn:created', ecnData);
    return ecnData;
  }

  async getDecisions() {
    try {
      const res = await fetch('/api/decisions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[DB Service] Failed to fetch decisions from database:', e);
    }
    return [...DECISION_HISTORY_RECORDS];
  }

  async saveDecision(decisionData) {
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionData)
      });
      if (res.ok) {
        const json = await res.json();
        EventBus.emit('decision:saved', json.data);
        return json.data;
      }
    } catch (e) {
      console.warn('[DB Service] Failed to save decision to database:', e);
    }
    EventBus.emit('decision:saved', decisionData);
    return decisionData;
  }

  async getAuditLog() {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[DB Service] Failed to fetch audit log from database:', e);
    }
    return [...INITIAL_AUDIT_ENTRIES];
  }

  async saveAuditRecord(recordData) {
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('[DB Service] Failed to save audit record to database:', e);
    }
    return recordData;
  }
}

export const dbService = new DatabaseService();
