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
    let localCache = [];
    try {
      const stored = localStorage.getItem('cutoverguard_ecns');
      if (stored) localCache = JSON.parse(stored);
    } catch (e) {}

    try {
      const res = await fetch('/api/ecns');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          try {
            localStorage.setItem('cutoverguard_ecns', JSON.stringify(json.data));
          } catch (e) {}
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[DB Service] API fetch error, checking local storage:', e);
    }

    if (localCache.length > 0) {
      return localCache;
    }
    return [...SYNTHETIC_ECNS];
  }

  async createEcn(ecnData) {
    let saved = ecnData;
    try {
      const res = await fetch('/api/ecns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ecnData)
      });
      if (res.ok) {
        const json = await res.json();
        saved = json.data || ecnData;
      }
    } catch (e) {
      console.warn('[DB Service] Failed to save ECN to database:', e);
    }

    // Persist to local storage
    try {
      const stored = localStorage.getItem('cutoverguard_ecns');
      let list = stored ? JSON.parse(stored) : [...SYNTHETIC_ECNS];
      const idx = list.findIndex(item => item.id === saved.id);
      if (idx >= 0) {
        list[idx] = saved;
      } else {
        list.unshift(saved);
      }
      localStorage.setItem('cutoverguard_ecns', JSON.stringify(list));
    } catch (e) {}

    EventBus.emit('ecn:created', saved);
    return saved;
  }

  async updateEcn(ecnId, updates) {
    let updatedRecord = { id: ecnId, ...updates };
    try {
      const res = await fetch('/api/ecns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });
      if (res.ok) {
        const json = await res.json();
        updatedRecord = json.data || updatedRecord;
      }
    } catch (e) {
      console.warn('[DB Service] Failed to update ECN via API:', e);
    }

    // Update local storage
    try {
      const stored = localStorage.getItem('cutoverguard_ecns');
      if (stored) {
        let list = JSON.parse(stored);
        const idx = list.findIndex(e => e.id === ecnId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updatedRecord };
          localStorage.setItem('cutoverguard_ecns', JSON.stringify(list));
        }
      }
    } catch (e) {}

    EventBus.emit('ecn:updated', updatedRecord);
    EventBus.emit('ecn:changed', updatedRecord);
    return updatedRecord;
  }

  async getDecisions() {
    let localDecisions = [];
    try {
      const stored = localStorage.getItem('cutoverguard_decisions');
      if (stored) localDecisions = JSON.parse(stored);
    } catch (e) {}

    try {
      const res = await fetch('/api/decisions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          try {
            localStorage.setItem('cutoverguard_decisions', JSON.stringify(json.data));
          } catch (e) {}
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[DB Service] Failed to fetch decisions from database:', e);
    }

    if (localDecisions.length > 0) return localDecisions;
    return [...DECISION_HISTORY_RECORDS];
  }

  async saveDecision(decisionData) {
    let saved = decisionData;
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionData)
      });
      if (res.ok) {
        const json = await res.json();
        saved = json.data || decisionData;
      }
    } catch (e) {
      console.warn('[DB Service] Failed to save decision to database:', e);
    }

    // Local storage
    try {
      const stored = localStorage.getItem('cutoverguard_decisions');
      let list = stored ? JSON.parse(stored) : [...DECISION_HISTORY_RECORDS];
      list.unshift(saved);
      localStorage.setItem('cutoverguard_decisions', JSON.stringify(list));
    } catch (e) {}

    EventBus.emit('decision:saved', saved);
    return saved;
  }

  async saveScenario(scenarioData) {
    let saved = { id: `SCEN-${Date.now()}`, timestamp: new Date().toISOString(), ...scenarioData };
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved)
      });
      if (res.ok) {
        const json = await res.json();
        saved = json.data || saved;
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem('cutoverguard_scenarios');
      let list = stored ? JSON.parse(stored) : [];
      list.unshift(saved);
      localStorage.setItem('cutoverguard_scenarios', JSON.stringify(list));
    } catch (e) {}

    EventBus.emit('scenario:saved', saved);
    return saved;
  }

  async getScenarios() {
    try {
      const res = await fetch('/api/scenarios');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem('cutoverguard_scenarios');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
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
