// src/db/init.js - Database Schema Initialization and Data Seeding
import { pool } from './pool.js';
import { SYNTHETIC_ECNS, DECISION_HISTORY_RECORDS, INITIAL_AUDIT_ENTRIES } from '../js/data/demo-data.js';

export async function initDatabase() {
  console.log('[CutoverGuard DB] Checking and initializing database schema...');

  const schemaQuery = `
    -- ECNs Table
    CREATE TABLE IF NOT EXISTS ecns (
      id VARCHAR(50) PRIMARY KEY,
      part_old VARCHAR(100) NOT NULL,
      part_new VARCHAR(100) NOT NULL,
      revision VARCHAR(50) NOT NULL,
      change_type VARCHAR(200) NOT NULL,
      reason TEXT NOT NULL,
      created_date DATE NOT NULL DEFAULT CURRENT_DATE,
      planned_date VARCHAR(50) NOT NULL,
      initial_stock INTEGER NOT NULL DEFAULT 0,
      daily_demand INTEGER NOT NULL DEFAULT 0,
      dock_day INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(100) NOT NULL DEFAULT 'In Review',
      status_code VARCHAR(50) NOT NULL DEFAULT 'IN_REVIEW',
      readiness VARCHAR(50) NOT NULL DEFAULT 'READY',
      inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Decision History Table
    CREATE TABLE IF NOT EXISTS decision_history (
      id VARCHAR(50) PRIMARY KEY,
      ecn_id VARCHAR(50) REFERENCES ecns(id) ON DELETE CASCADE,
      parts VARCHAR(200) NOT NULL,
      run_version VARCHAR(100) NOT NULL,
      recommended_date VARCHAR(50) NOT NULL,
      feasible_window VARCHAR(100) NOT NULL,
      lrm VARCHAR(50) NOT NULL,
      cost_index NUMERIC(10, 2) NOT NULL DEFAULT 0,
      excess_stock VARCHAR(50) NOT NULL,
      shortage_risk VARCHAR(50) NOT NULL,
      action VARCHAR(50) NOT NULL,
      planner VARCHAR(150) NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL,
      hash VARCHAR(100) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Cryptographic Audit Log Table
    CREATE TABLE IF NOT EXISTS audit_log (
      id VARCHAR(50) PRIMARY KEY,
      record_type VARCHAR(100) NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      prev_hash VARCHAR(128) NOT NULL,
      current_hash VARCHAR(128) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- System Configuration Table
    CREATE TABLE IF NOT EXISTS system_config (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await pool.query(schemaQuery);
    console.log('[CutoverGuard DB] Tables verified/created successfully.');

    // Seed ECNs if empty
    const ecnCountRes = await pool.query('SELECT COUNT(*) as count FROM ecns;');
    if (parseInt(ecnCountRes.rows[0].count, 10) === 0) {
      console.log('[CutoverGuard DB] Seeding initial ECN records...');
      for (const ecn of SYNTHETIC_ECNS) {
        await pool.query(
          `INSERT INTO ecns (id, part_old, part_new, revision, change_type, reason, created_date, planned_date, initial_stock, daily_demand, dock_day, status, status_code, readiness, inputs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING;`,
          [
            ecn.id,
            ecn.partOld,
            ecn.partNew,
            ecn.revision,
            ecn.changeType,
            ecn.reason,
            ecn.createdDate,
            ecn.plannedDate,
            ecn.initialStock,
            ecn.dailyDemand,
            ecn.dockDay,
            ecn.status,
            ecn.statusCode,
            ecn.readiness,
            JSON.stringify(ecn.inputs || {})
          ]
        );
      }
      console.log(`[CutoverGuard DB] Seeded ${SYNTHETIC_ECNS.length} initial ECNs.`);
    }

    // Seed Decision History if empty
    const decCountRes = await pool.query('SELECT COUNT(*) as count FROM decision_history;');
    if (parseInt(decCountRes.rows[0].count, 10) === 0) {
      console.log('[CutoverGuard DB] Seeding initial Decision History records...');
      for (const dec of DECISION_HISTORY_RECORDS) {
        await pool.query(
          `INSERT INTO decision_history (id, ecn_id, parts, run_version, recommended_date, feasible_window, lrm, cost_index, excess_stock, shortage_risk, action, planner, timestamp, status, hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING;`,
          [
            dec.id,
            dec.ecn,
            dec.parts,
            dec.runVersion,
            dec.recommendedDate,
            dec.feasibleWindow,
            dec.lrm,
            dec.costIndex,
            dec.excessStock,
            dec.shortageRisk,
            dec.action,
            dec.planner,
            dec.timestamp,
            dec.status,
            dec.hash
          ]
        );
      }
      console.log(`[CutoverGuard DB] Seeded ${DECISION_HISTORY_RECORDS.length} Decision History records.`);
    }

    // Seed Audit Log if empty
    const auditCountRes = await pool.query('SELECT COUNT(*) as count FROM audit_log;');
    if (parseInt(auditCountRes.rows[0].count, 10) === 0) {
      console.log('[CutoverGuard DB] Seeding initial Audit Log records...');
      for (const aud of INITIAL_AUDIT_ENTRIES) {
        await pool.query(
          `INSERT INTO audit_log (id, record_type, timestamp, data, prev_hash, current_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING;`,
          [
            aud.id,
            aud.type,
            aud.ts,
            JSON.stringify(aud.data || {}),
            aud.prevHash || '0000000000000000000000000000000000000000000000000000000000000000',
            aud.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
          ]
        );
      }
      console.log(`[CutoverGuard DB] Seeded ${INITIAL_AUDIT_ENTRIES.length} Audit Log records.`);
    }

    return { success: true };
  } catch (err) {
    console.error('[CutoverGuard DB] Initialization error:', err);
    return { success: false, error: err.message };
  }
}

// Direct invocation script
if (process.argv[1] && process.argv[1].endsWith('init.js')) {
  initDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
