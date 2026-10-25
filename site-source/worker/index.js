// Site-local Worker: serves the existing static UI and makes a validated,
// same-origin Yahoo Finance Chart request so browser CORS does not block it.
const siteAssets = __SITE_ASSETS__;

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

function badRequest(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function jsonResponse(data, status = 200, maxAge = 0) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store', 'x-content-type-options': 'nosniff' } });
}

async function fetchKlsescreenerPage(url, ttlSeconds, request) {
  const headers = new Headers({ accept: 'text/html', referer: 'https://www.klsescreener.com/' });
  const language = request.headers.get('accept-language');
  if (language) headers.set('accept-language', language);
  try {
    return await fetch(url, { headers, signal: AbortSignal.timeout(15000), cf: { cacheTtl: ttlSeconds, cacheEverything: true } });
  } catch {
    return null;
  }
}

function klsescreenerText(value) {
  return String(value || '').replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/[\t\r\n ]+/g, ' ').trim();
}

function klsescreenerDate(value) {
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(String(value || '').trim());
  if (!match || !months[match[2].toLowerCase()]) return '';
  const date = `${match[3]}-${String(months[match[2].toLowerCase()]).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date ? date : '';
}

function klsescreenerPageIdentity(html) {
  const identityMarkup = [];
  const title = /<title\\b[^>]*>([\\s\\S]*?)<\\/title\\s*>/i.exec(html);
  if (title) identityMarkup.push(title[1]);
  const metaTitles = [...html.matchAll(/<meta\\b[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']*)["'][^>]*>/gi)];
  identityMarkup.push(...metaTitles.map(match => match[1]));
  const headings = [...html.matchAll(/<h[1-3]\\b[^>]*>([\\s\\S]*?)<\\/h[1-3]\\s*>/gi)].slice(0, 8);
  identityMarkup.push(...headings.map(match => match[1]));
  return klsescreenerText(identityMarkup.join(' '));
}

async function klsescreenerDividends(request, url) {
  const ticker = String(url.searchParams.get('ticker') || '').trim().toUpperCase();
  if (!/^\d{4,5}\.KL$/.test(ticker)) return badRequest('KLSE Screener 股息查询目前仅支持四位或五位数字 Bursa 股票代码（例如 1155.KL、1066.KL、03050.KL）。');
  const code = ticker.slice(0, -3);
  const upstreamUrl = `https://www.klsescreener.com/v2/stocks/view/${code}`;
  const response = await fetchKlsescreenerPage(upstreamUrl, 21600, request);
  if (!response?.ok) return badRequest(`KLSE Screener 股息历史请求失败（HTTP ${response?.status || '网络错误'}）。`, 502);
  const html = await response.text();
  if (html.length > 5_000_000) return badRequest('KLSE Screener 股息历史页面超出大小限制。', 502);
  const pageIdentity = klsescreenerPageIdentity(html);
  const codePattern = new RegExp(`(?:^|[^0-9])${code}(?:[^0-9]|$)`);
  if (!codePattern.test(pageIdentity)) return badRequest(`KLSE Screener 返回页面的标题/股票抬头未确认代码 ${code}；页面身份校验失败，未显示股息候选。`, 502);
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table\s*>/gi)].map(match => match[0]);
  const table = tables.find(value => {
    const firstRow = /<tr\b[^>]*>[\s\S]*?<\/tr\s*>/i.exec(value)?.[0] || '';
    const text = klsescreenerText(firstRow);
    return /Announced/i.test(text) && /Financial Year/i.test(text) && /EX Date/i.test(text) && /Payment Date/i.test(text) && /Amount/i.test(text);
  });
  if (!table) return badRequest('KLSE Screener 页面没有可识别的股息历史表。', 502);
  const tableRows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)].map(row => [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]\s*>/gi)].map(cell => klsescreenerText(cell[1]))).filter(cells => cells.length);
  if (tableRows.length < 2 || tableRows.length > 3002) return badRequest('KLSE Screener 股息历史行数无效。', 502);
  const seen = new Set(), events = [];
  for (const cells of tableRows.slice(1)) {
    if (cells.length < 7 || !/^(currency|rm|myr)$/i.test(cells[6])) continue;
    const announcedDate = klsescreenerDate(cells[0]), exDate = klsescreenerDate(cells[3]), paymentDate = klsescreenerDate(cells[4]), perShare = Number(cells[5]);
    if (!announcedDate || !exDate || !paymentDate || !Number.isFinite(perShare) || perShare <= 0 || perShare > 1000) continue;
    const signature = `${exDate}|${perShare}|${paymentDate}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    events.push({ ticker, announcedDate, exDate, paymentDate, perShare, subject: String(cells[2] || '').slice(0, 300), source: 'klsescreener-dividend-history', sourceUrl: upstreamUrl, reviewStatus: 'third-party-unverified' });
  }
  if (!events.length) return badRequest('KLSE Screener 页面没有可用的完整股息记录。', 502);
  return jsonResponse({ ticker, source: 'klsescreener', sourceUrl: upstreamUrl, retrievedAt: new Date().toISOString(), expiresAt: Date.now() + 21600_000, events }, 200, 21600);
}

async function yahooChart(request, url) {
  const ticker = url.searchParams.get('ticker');
  const period1 = url.searchParams.get('period1');
  const period2 = url.searchParams.get('period2');
  if ((ticker !== '^KLSE' && !/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(ticker || '')) || !/^\d+$/.test(period1 || '') || !/^\d+$/.test(period2 || '')) {
    return badRequest('Yahoo 行情参数无效。');
  }
  const from = Number(period1);
  const to = Number(period2);
  const now = Math.floor(Date.now() / 1000);
  // period2 is exclusive and the UI sends Malaysia-local dates as UTC day
  // boundaries; KL midnight can be up to 32 hours ahead of the Worker's UTC clock.
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to <= from || to > now + 2 * 86400) {
    return badRequest('Yahoo 日期范围无效。');
  }

  const upstream = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
  upstream.search = new URLSearchParams({ period1: String(from), period2: String(to), interval: '1d', events: 'div,splits' }).toString();
  try {
    const requestHeaders = new Headers({ accept: 'application/json', referer: 'https://finance.yahoo.com/' });
    const userAgent = request.headers.get('user-agent');
    const language = request.headers.get('accept-language');
    if (userAgent) requestHeaders.set('user-agent', userAgent);
    if (language) requestHeaders.set('accept-language', language);
    const response = await fetch(upstream, { headers: requestHeaders });
    const responseHeaders = new Headers({
      'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return badRequest('Site 无法连接 Yahoo Finance；请稍后重试。', 502);
  }
}

function assetResponse(path) {
  const normalized = path === '/' ? '/index.html' : path;
  const name = normalized.replace(/^\//, '');
  const body = siteAssets[name];
  if (body === undefined) return new Response('Not found', { status: 404 });
  const extension = name.slice(name.lastIndexOf('.'));
  return new Response(body, {
    headers: {
      'content-type': MIME[extension] || 'application/octet-stream',
      'cache-control': name === 'index.html' ? 'no-cache' : 'public, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    if (url.pathname === '/api/yahoo-chart') {
      if (request.method === 'HEAD') return new Response(null, { status: 405 });
      return yahooChart(request, url);
    }
    if (url.pathname === '/api/klsescreener-dividends') {
      if (request.method === 'HEAD') return new Response(null, { status: 405 });
      return klsescreenerDividends(request, url);
    }
    return assetResponse(url.pathname);
  },
};
