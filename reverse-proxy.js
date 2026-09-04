import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import httpProxy from 'http-proxy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create proxy instances
const frontendProxy = httpProxy.createProxyServer({
  target: 'https://localhost:8443',
  changeOrigin: true,
  ws: true,
  rejectUnauthorized: false,
});

const backendProxy = httpProxy.createProxyServer({
  target: 'http://localhost:5000',
  changeOrigin: true,
});

// SSL options
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
};

// HTTPS Server (Port 443)
const httpsServer = https.createServer(sslOptions, (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  if (req.url.startsWith('/api/')) {
    // Route to backend
    backendProxy.web(req, res, (err) => {
      console.error('Backend proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable' }));
    });
  } else {
    // Route to frontend
    frontendProxy.web(req, res, (err) => {
      console.error('Frontend proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Frontend unavailable' }));
    });
  }
});

// Handle WebSocket upgrades
httpsServer.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/api/')) {
    backendProxy.ws(req, socket, head);
  } else {
    frontendProxy.ws(req, socket, head);
  }
});

// HTTP Server (Port 80) - Redirect to HTTPS
const httpServer = http.createServer((req, res) => {
  const host = req.headers.host || 'telefonbuch.vbe.local';
  res.writeHead(301, { Location: `https://${host}${req.url}` });
  res.end();
});

// Start servers
const HTTPS_PORT = 443;
const HTTP_PORT = 80;

// Try to start on port 443 (requires sudo)
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`✅ HTTPS Reverse Proxy läuft auf Port ${HTTPS_PORT}`);
  console.log(`📍 URL: https://telefonbuch.vbe.local`);
  console.log(`🔗 Frontend: https://localhost:8443`);
  console.log(`🔗 Backend: http://localhost:5000`);
}).on('error', (err) => {
  if (err.code === 'EACCES') {
    console.warn(`⚠️  Port ${HTTPS_PORT} benötigt Root-Rechte`);
    console.log(`📍 Starte auf Port 8443 stattdessen...`);
    httpsServer.listen(8443, () => {
      console.log(`✅ HTTPS Reverse Proxy läuft auf Port 8443`);
      console.log(`📍 URL: https://telefonbuch.vbe.local:8443`);
    });
  } else {
    console.error('Server error:', err);
  }
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`✅ HTTP Redirect läuft auf Port ${HTTP_PORT}`);
}).on('error', (err) => {
  if (err.code === 'EACCES') {
    console.warn(`⚠️  Port ${HTTP_PORT} benötigt Root-Rechte`);
  } else {
    console.error('HTTP Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Fahre Server herunter...');
  httpsServer.close();
  httpServer.close();
  process.exit(0);
});
