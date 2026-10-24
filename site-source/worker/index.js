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

async function yahooChart(request, url) {
  const ticker = url.searchParams.get('ticker');
  const period1 = url.searchParams.get('period1');
  const period2 = url.searchParams.get('period2');
  if (!/^\d{4}\.KL$/.test(ticker || '') || !/^\d+$/.test(period1 || '') || !/^\d+$/.test(period2 || '')) {
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
    return assetResponse(url.pathname);
  },
};
