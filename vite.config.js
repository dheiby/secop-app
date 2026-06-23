import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'

import { cloudflare } from "@cloudflare/vite-plugin";

function nodeProxy(mountPath, hostname, basePath) {
  return (server) => {
    server.middlewares.use(mountPath, (req, res) => {
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      const path = basePath + qs;
      const options = {
        hostname,
        path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, */*',
        },
      };
      const send = (status, body, ct = 'application/json') => {
        if (res.headersSent) return;
        res.writeHead(status, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' });
        res.end(body);
      };
      const proxyReq = https.request(options, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', chunk => chunks.push(chunk));
        proxyRes.on('end', () => send(proxyRes.statusCode, Buffer.concat(chunks), proxyRes.headers['content-type'] || 'application/json'));
        proxyRes.on('error', () => send(502, JSON.stringify({ error: 'stream error' })));
      });
      proxyReq.on('error', (err) => send(502, JSON.stringify({ error: err.message })));
      proxyReq.setTimeout(15000, () => proxyReq.destroy(new Error('timeout')));
      proxyReq.end();
    });
  };
}

function secopProxyPlugin() {
  return {
    name: 'secop-proxy',
    configureServer(server) {
      // Proxy SECOP API (datos.gov.co)
      server.middlewares.use('/api/secop', (req, res) => {
        const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        const path = '/resource/p6dx-8zbt.json' + qs;
        const options = {
          hostname: 'www.datos.gov.co',
          path,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'es-CO,es;q=0.9',
            'Connection': 'keep-alive',
          },
        };
        const send = (status, body, ct = 'application/json') => {
          if (res.headersSent) return;
          res.writeHead(status, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' });
          res.end(body);
        };
        const proxyReq = https.request(options, (proxyRes) => {
          const chunks = [];
          proxyRes.on('data', chunk => chunks.push(chunk));
          proxyRes.on('end', () => {
            send(proxyRes.statusCode, Buffer.concat(chunks), proxyRes.headers['content-type'] || 'application/json');
          });
          proxyRes.on('error', () => send(502, JSON.stringify({ error: 'stream error' })));
        });
        proxyReq.on('error', (err) => send(502, JSON.stringify({ error: err.message })));
        proxyReq.setTimeout(15000, () => proxyReq.destroy(new Error('timeout')));
        proxyReq.end();
      });

      // Proxy WFS GeoServer (evita CORS en dev)
      nodeProxy(
        '/api/wfs',
        'geoserver.giscaleingenieria.com',
        '/geoserver/secop/ows'
      )(server);
    }
  }
}

export default defineConfig({
  plugins: [react(), secopProxyPlugin(), cloudflare()],
})