// src/db/pool.js - PostgreSQL Connection Pool for CutoverGuard
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || 'db.awbnjokoyxibmkfcqxey.supabase.co',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || ',@kDrp9-Ncft&G#',
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test connection helper
export async function testConnection() {
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW() as current_time, version() as version;');
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latencyMs,
      currentTime: res.rows[0].current_time,
      version: res.rows[0].version,
      host: process.env.PGHOST || 'db.awbnjokoyxibmkfcqxey.supabase.co',
      database: process.env.PGDATABASE || 'postgres'
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      host: process.env.PGHOST || 'db.awbnjokoyxibmkfcqxey.supabase.co'
    };
  }
}
