// server.js - CutoverGuard Backend Server with PostgreSQL (Supabase) Integration and SPA Routing
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/api/routes.js';
import { initDatabase } from './src/db/init.js';
import { testConnection } from './src/db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  // Check if API endpoint
  if (req.url.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res);
    if (handled) return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  let filePath = path.normalize(path.join(__dirname, reqPath));

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    // If not found or directory without index, check for SPA fallback (serve index.html for page routes)
    if (err || !stats.isFile()) {
      // If requesting a file with an extension that doesn't exist, return 404
      if (path.extname(reqPath) !== '') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${reqPath}`);
        return;
      }

      // Route fallback to index.html for clean client-side routing (/cutover, /ecn, etc.)
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, async () => {
  console.log(`[CutoverGuard] Dev server running at http://localhost:${PORT}`);
  console.log(`[CutoverGuard] Serving static files from: ${__dirname}`);
  console.log(`[CutoverGuard] SPA routing enabled (routes fallback to index.html)`);

  // Verify PostgreSQL Database Connection on server boot
  try {
    const dbStatus = await testConnection();
    if (dbStatus.connected) {
      console.log(`[CutoverGuard DB] Connected to PostgreSQL on Supabase (${dbStatus.host}) in ${dbStatus.latencyMs}ms`);
      await initDatabase();
    } else {
      console.warn(`[CutoverGuard DB] Database connection warning: ${dbStatus.error}`);
    }
  } catch (err) {
    console.warn(`[CutoverGuard DB] Startup check error:`, err.message);
  }
});
