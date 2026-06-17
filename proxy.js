/**
 * Proxy local para SECOP II - community.secop.gov.co
 * Ejecutar con: node proxy.js
 * Puerto: 3001
 */

import express from 'express';
import cors from 'cors';
import https from 'https';
import { URL } from 'url';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually (no extra deps)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envLines = readFileSync(resolve(__dirname, '.env'), 'utf-8').split('\n');
  envLines.forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) process.env[k.trim()] = v.trim();
  });
} catch (_) { /* .env not found, no problem */ }

const app = express();
app.use(cors());

const BASE_URL = 'https://community.secop.gov.co';
const SEARCH_PAGE = '/Public/Tendering/ContractNoticeManagement/Index?currentLanguage=es-CO&Page=login&Country=CO&SkinName=CCE';
const SEARCH_ENDPOINT = '/Public/Tendering/ContractNoticeManagement/AdvancedSearchAjax2';

let sessionCookies = '';
let mkey = process.env.SECOP_MKEY || '';
let mkeyFetchedAt = mkey ? Date.now() : 0;

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'es-CO,es;q=0.9',
        ...headers,
      }
    };
    let data = '';
    const req = https.get(options, res => {
      // Capture cookies
      const setCookies = res.headers['set-cookie'] || [];
      if (setCookies.length) {
        sessionCookies = setCookies.map(c => c.split(';')[0]).join('; ');
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.status, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.abort(); reject(new Error('timeout')); });
  });
}

async function refreshSession() {
  const now = Date.now();
  // Refresh mkey every 25 minutes
  if (mkey && (now - mkeyFetchedAt) < 25 * 60 * 1000) return;

  console.log('🔄 Obteniendo sesión y mkey...');
  const res = await httpsGet(BASE_URL + SEARCH_PAGE);
  const match = res.body.match(/mkey(?:%3D|=)([a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12})/i);
  if (match) {
    mkey = match[1];
    mkeyFetchedAt = now;
    console.log('✅ mkey obtenido:', mkey);
  } else {
    throw new Error('No se pudo obtener mkey del portal');
  }
}

function parseContractsFromHtml(html) {
  // Remove script tag content but keep structure
  const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Extract table rows with regex (no DOM parser in Node)
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const tagRegex = /<[^>]+>/g;

  const cleanText = (s) => s.replace(tagRegex, '').replace(/\s+/g, ' ').trim();

  const contracts = [];
  let rowMatch;
  while ((rowMatch = rowRegex.exec(cleanHtml)) !== null) {
    const cells = [];
    let cellMatch;
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      cells.push(cleanText(cellMatch[1]));
    }
    if (cells.length >= 8 && cells[1]) {
      const entidad = cells[1];
      if (entidad && entidad.length > 2 && !/^\s*$/.test(entidad)) {
        contracts.push({
          entidad: cells[1],
          referencia: cells[2],
          descripcion: cells[3],
          fase: cells[4],
          fechaPublicacion: cells[5],
          fechaOferta: cells[6],
          cuantia: cells[7],
          estado: cells[8] || ''
        });
      }
    }
  }

  // Try to get total count
  const totalMatch = html.match(/(\d+)\s+resultado/i) || html.match(/of\s+(\d+)/i);
  const total = totalMatch ? parseInt(totalMatch[1]) : contracts.length;

  return { total, contracts };
}

// Main search endpoint
app.get('/api/search', async (req, res) => {
  try {
    await refreshSession();

    const {
      descripcion = '',
      referencia = '',
      estado = '',
      region = '',
      fechaPublicacionDesde = '',
      fechaPublicacionHasta = '',
      fechaOfertaDesde = '',
      fechaOfertaHasta = '',
      pagina = 0,
      porPagina = 20
    } = req.query;

    const startIndex = parseInt(pagina) * parseInt(porPagina) + 1;
    const endIndex = startIndex + parseInt(porPagina) - 1;

    const params = new URLSearchParams({
      perspective: 'All',
      initAction: 'Index',
      externalId: '', logicalId: '', fromMarketplace: '',
      authorityVat: '', companyData: '', procedureData: '',
      pageNumber: pagina,
      startIndex,
      endIndex,
      currentPagingStyle: 0,
      displayAdvancedParams: 'true',
      orderParam: 'RequestOnlinePublishingDateDESC',
      searchExecuted: 'True',
      reference: referencia,
      description: descripcion,
      mainCategory: '', mainCategoryText: '',
      categorizationSystemCode: 'UNSPSC',
      region,
      regulation: '',
      requestStatus: estado,
      publishDateFrom: fechaPublicacionDesde,
      publishDateTo: fechaPublicacionHasta,
      tendersDeadlineFrom: fechaOfertaDesde,
      tendersDeadlineTo: fechaOfertaHasta,
      openDateFrom: '', openDateTo: '',
      companyCode: '',
      mkey,
      _: Date.now()
    });

    const url = BASE_URL + SEARCH_ENDPOINT + '?' + params.toString();
    const result = await httpsGet(url, {
      Cookie: sessionCookies,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: BASE_URL + SEARCH_PAGE
    });

    const data = parseContractsFromHtml(result.body);
    res.json({ ok: true, pagina: parseInt(pagina), porPagina: parseInt(porPagina), ...data });

  } catch (err) {
    console.error('Error:', err.message);
    // mkey may have expired, force refresh next time
    mkey = '';
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Debug: ver HTML crudo que recibe el proxy
app.get('/api/debug-html', async (req, res) => {
  const result = await httpsGet(BASE_URL + SEARCH_PAGE);
  // Find any UUID-like pattern
  const mkeyMatches = [...result.body.matchAll(/[a-f0-9]{8}[_-][a-f0-9]{4}[_-][a-f0-9]{4}[_-][a-f0-9]{4}[_-][a-f0-9]{12}/gi)];
  const snippet = result.body.substring(0, 500);
  res.json({
    cookiesSet: sessionCookies.substring(0, 100),
    bodyLength: result.body.length,
    uuidMatches: mkeyMatches.slice(0, 5).map(m => m[0]),
    snippet
  });
});

// Recibir mkey desde el browser (lo envía la app React al cargar)
app.get('/api/set-mkey', (req, res) => {
  const newMkey = req.query.mkey;
  const newCookies = req.query.cookies;
  if (newMkey && /^[a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12}$/i.test(newMkey)) {
    mkey = newMkey;
    mkeyFetchedAt = Date.now();
    if (newCookies) sessionCookies = decodeURIComponent(newCookies);
    console.log('✅ mkey recibido desde browser:', mkey);
    res.json({ ok: true, mkey });
  } else {
    res.status(400).json({ ok: false, error: 'mkey inválido' });
  }
});

// Health check
app.get('/api/status', async (req, res) => {
  try {
    await refreshSession();
    res.json({ ok: true, mkey: mkey.substring(0, 8) + '...', sessionActive: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Proxy SECOP II corriendo en http://localhost:${PORT}`);
  console.log(`   GET /api/search?descripcion=obras&estado=Published&porPagina=20`);
  console.log(`   GET /api/status\n`);
  // Pre-fetch session on startup
  refreshSession().catch(e => console.error('Error inicial:', e.message));
});