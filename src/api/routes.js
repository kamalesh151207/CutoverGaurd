// src/api/routes.js - REST API Handlers backed by PostgreSQL (Supabase) with In-Memory Resilient Fallback
import { pool, testConnection } from '../db/pool.js';
import { initDatabase } from '../db/init.js';
import { aiEngine } from '../js/models/ai-engine.js';
import { SYNTHETIC_ECNS, DECISION_HISTORY_RECORDS, INITIAL_AUDIT_ENTRIES } from '../js/data/demo-data.js';

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  try {
    // 1. Database Connection Status
    if (pathname === '/api/db/status' && method === 'GET') {
      try {
        const status = await testConnection();
        if (status.connected) {
          const counts = await pool.query(`
            SELECT 
              (SELECT COUNT(*) FROM ecns) as ecns_count,
              (SELECT COUNT(*) FROM decision_history) as decisions_count,
              (SELECT COUNT(*) FROM audit_log) as audit_count
          `);
          status.counts = {
            ecns: parseInt(counts.rows[0].ecns_count, 10),
            decisions: parseInt(counts.rows[0].decisions_count, 10),
            audit: parseInt(counts.rows[0].audit_count, 10)
          };
        } else {
          status.fallback = true;
          status.counts = { ecns: SYNTHETIC_ECNS.length, decisions: DECISION_HISTORY_RECORDS.length, audit: INITIAL_AUDIT_ENTRIES.length };
        }
        sendJson(res, 200, { success: true, ...status });
      } catch (err) {
        sendJson(res, 200, {
          success: true,
          connected: false,
          fallback: true,
          error: err.message,
          counts: { ecns: SYNTHETIC_ECNS.length, decisions: DECISION_HISTORY_RECORDS.length, audit: INITIAL_AUDIT_ENTRIES.length }
        });
      }
      return true;
    }

    // 2. Database Re-initialization / Seed
    if (pathname === '/api/db/init' && method === 'POST') {
      try {
        const initResult = await initDatabase();
        sendJson(res, initResult.success ? 200 : 200, initResult);
      } catch (err) {
        sendJson(res, 200, { success: false, fallback: true, error: err.message });
      }
      return true;
    }

    // 3. ECNs - GET /api/ecns
    if (pathname === '/api/ecns' && method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM ecns ORDER BY created_at DESC;');
        const mapped = result.rows.map(r => ({
          id: r.id,
          partOld: r.part_old,
          partNew: r.part_new,
          revision: r.revision,
          changeType: r.change_type,
          reason: r.reason,
          createdDate: r.created_date ? r.created_date.toISOString().slice(0, 10) : '',
          plannedDate: r.planned_date,
          initialStock: r.initial_stock,
          dailyDemand: r.daily_demand,
          dockDay: r.dock_day,
          status: r.status,
          statusCode: r.status_code,
          readiness: r.readiness,
          inputs: r.inputs || {}
        }));
        sendJson(res, 200, { success: true, count: mapped.length, data: mapped });
      } catch (err) {
        // Resilient fallback to demo ECNs
        sendJson(res, 200, { success: true, count: SYNTHETIC_ECNS.length, data: SYNTHETIC_ECNS, fallback: true });
      }
      return true;
    }

    // 4. ECNs - POST /api/ecns
    if (pathname === '/api/ecns' && method === 'POST') {
      const body = await parseJsonBody(req);
      const id = body.id || `ECN-${String(Math.floor(1000 + Math.random() * 9000))}`;
      try {
        const query = `
          INSERT INTO ecns (id, part_old, part_new, revision, change_type, reason, created_date, planned_date, initial_stock, daily_demand, dock_day, status, status_code, readiness, inputs)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *;
        `;
        const values = [
          id,
          body.partOld || 'PART-OLD',
          body.partNew || 'PART-NEW',
          body.revision || 'Rev A → Rev B',
          body.changeType || 'Engineering Revision',
          body.reason || 'General engineering update',
          body.createdDate || new Date().toISOString().slice(0, 10),
          body.plannedDate || '15-DEC-2026',
          body.initialStock || 500,
          body.dailyDemand || 40,
          body.dockDay || 11,
          body.status || 'Active In-Review',
          body.statusCode || 'IN_REVIEW',
          body.readiness || 'READY',
          JSON.stringify(body.inputs || {})
        ];
        const result = await pool.query(query, values);
        const r = result.rows[0];
        sendJson(res, 201, {
          success: true,
          data: {
            id: r.id,
            partOld: r.part_old,
            partNew: r.part_new,
            revision: r.revision,
            changeType: r.change_type,
            reason: r.reason,
            createdDate: r.created_date ? r.created_date.toISOString().slice(0, 10) : '',
            plannedDate: r.planned_date,
            initialStock: r.initial_stock,
            dailyDemand: r.daily_demand,
            dockDay: r.dock_day,
            status: r.status,
            statusCode: r.status_code,
            readiness: r.readiness,
            inputs: r.inputs
          }
        });
      } catch (err) {
        sendJson(res, 201, { success: true, data: { id, ...body }, fallback: true });
      }
      return true;
    }

    // 5. Decision History - GET /api/decisions
    if (pathname === '/api/decisions' && method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM decision_history ORDER BY created_at DESC;');
        const mapped = result.rows.map(r => ({
          id: r.id,
          ecn: r.ecn_id,
          parts: r.parts,
          runVersion: r.run_version,
          recommendedDate: r.recommended_date,
          feasibleWindow: r.feasible_window,
          lrm: r.lrm,
          costIndex: parseFloat(r.cost_index),
          excessStock: r.excess_stock,
          shortageRisk: r.shortage_risk,
          action: r.action,
          planner: r.planner,
          timestamp: r.timestamp,
          status: r.status,
          hash: r.hash,
          notes: r.notes
        }));
        sendJson(res, 200, { success: true, count: mapped.length, data: mapped });
      } catch (err) {
        sendJson(res, 200, { success: true, count: DECISION_HISTORY_RECORDS.length, data: DECISION_HISTORY_RECORDS, fallback: true });
      }
      return true;
    }

    // 6. Decision History - POST /api/decisions
    if (pathname === '/api/decisions' && method === 'POST') {
      const body = await parseJsonBody(req);
      const id = body.id || `DEC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;
      try {
        const query = `
          INSERT INTO decision_history (id, ecn_id, parts, run_version, recommended_date, feasible_window, lrm, cost_index, excess_stock, shortage_risk, action, planner, timestamp, status, hash, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *;
        `;
        const values = [
          id,
          body.ecn || 'ECN-0248',
          body.parts || 'COMP-A-104 → COMP-B-208',
          body.runVersion || 'v1.4 (Deterministic Netting)',
          body.recommendedDate || '15-DEC-2026',
          body.feasibleWindow || '11-DEC to 19-DEC',
          body.lrm || '19-DEC-2026',
          body.costIndex || 82.4,
          body.excessStock || '120 units',
          body.shortageRisk || '0.0%',
          body.action || 'APPROVED',
          body.planner || 'PLN-8842 (Senior Plant Planner)',
          body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          body.status || 'COMMITTED',
          body.hash || Math.random().toString(16).slice(2, 26),
          body.notes || ''
        ];
        const result = await pool.query(query, values);
        sendJson(res, 201, { success: true, data: result.rows[0] });
      } catch (err) {
        sendJson(res, 201, { success: true, data: { id, ...body }, fallback: true });
      }
      return true;
    }

    // 7. Audit Log - GET /api/audit
    if (pathname === '/api/audit' && method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM audit_log ORDER BY timestamp ASC;');
        const mapped = result.rows.map(r => ({
          id: r.id,
          type: r.record_type,
          ts: r.timestamp ? r.timestamp.toISOString() : new Date().toISOString(),
          data: r.data || {},
          prevHash: r.prev_hash,
          hash: r.current_hash
        }));
        sendJson(res, 200, { success: true, count: mapped.length, data: mapped });
      } catch (err) {
        sendJson(res, 200, { success: true, count: INITIAL_AUDIT_ENTRIES.length, data: INITIAL_AUDIT_ENTRIES, fallback: true });
      }
      return true;
    }

    // 8. Audit Log - POST /api/audit
    if (pathname === '/api/audit' && method === 'POST') {
      const body = await parseJsonBody(req);
      const id = body.id || `REC-${String(Math.floor(100 + Math.random() * 900))}`;
      const query = `
        INSERT INTO audit_log (id, record_type, timestamp, data, prev_hash, current_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        id,
        body.type || 'PLANNER_APPROVAL_COMMIT',
        body.ts || new Date().toISOString(),
        JSON.stringify(body.data || {}),
        body.prevHash || '0000000000000000000000000000000000000000000000000000000000000000',
        body.hash || Math.random().toString(16).slice(2, 34)
      ];
      const result = await pool.query(query, values);
      sendJson(res, 201, { success: true, data: result.rows[0] });
      return true;
    }

    // 9. AI Cutover Intelligence - POST /api/ai/predict
    if (pathname === '/api/ai/predict' && method === 'POST') {
      const body = await parseJsonBody(req);
      const predictions = aiEngine.predictRisks(body);
      sendJson(res, 200, { success: true, data: predictions });
      return true;
    }

    // 10. AI Model Metadata / Model Card - GET /api/ai/model-card
    if (pathname === '/api/ai/model-card' && method === 'GET') {
      sendJson(res, 200, { success: true, data: aiEngine.modelCard });
      return true;
    }

    // Not an API route
    return false;
  } catch (err) {
    console.error(`[API Error] ${method} ${pathname}:`, err);
    sendJson(res, 500, { success: false, error: err.message });
    return true;
  }
}
