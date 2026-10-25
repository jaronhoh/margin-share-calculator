import { parseKlsescreenerDividendTable } from './klsescreener-dividends.mjs';
import { reconcileKlsescreenerDividends, approveKlsescreenerPaymentDate } from './klsescreener-reconciliation.mjs';

function decodeHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/[\t\r\n ]+/g, ' ').trim();
}

export function parseKlsescreenerDividendHtml(html, { ticker, sourceUrl } = {}) {
  if (typeof html !== 'string' || html.length > 5_000_000) throw new Error('KLSE Screener 页面内容无效。');
  const code = String(ticker || '').trim().toUpperCase().slice(0, -3);
  if (!new RegExp(`(?:\\(${code}\\)|>\\s*${code}\\s*<)`).test(html)) throw new Error('KLSE Screener 页面股票代码与请求不匹配。');
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table\s*>/gi)].map(match => match[0]);
  const target = tables.find(table => {
    const header = decodeHtml((/<tr\b[^>]*>[\s\S]*?<\/tr\s*>/i.exec(table) || [''])[0]);
    return /Announced/i.test(header) && /Financial Year/i.test(header) && /EX Date/i.test(header) && /Payment Date/i.test(header) && /Amount/i.test(header);
  });
  if (!target) throw new Error('KLSE Screener 页面没有可识别的股息历史表。');
  const lines = [];
  for (const row of target.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)) {
    const cells = [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]\s*>/gi)].map(cell => decodeHtml(cell[1]));
    if (cells.length) lines.push(cells.join(' | '));
  }
  return parseKlsescreenerDividendTable(lines.join('\n'), { ticker, sourceUrl });
}

export async function fetchKlsescreenerPaymentDates(yahooEvents, { ticker, fetchImpl = globalThis.fetch, cached, now = Date.now(), signal } = {}) {
  const symbol = String(ticker || '').trim().toUpperCase();
  if (!/^\d{4,5}\.KL$/.test(symbol) || !Array.isArray(yahooEvents) || typeof fetchImpl !== 'function') throw new Error('KLSE Screener Payment Date 查询目前支持四位或五位数字 Bursa 代码。');
  let data = cached?.ticker === symbol && cached.expiresAt > now && Array.isArray(cached.events) ? cached : null;
  if (!data) {
    const response = await fetchImpl(`/api/klsescreener-dividends?ticker=${encodeURIComponent(symbol)}`, { headers: { Accept: 'application/json' }, signal });
    if (!response?.ok) throw new Error(`KLSE Screener 股息历史获取失败（HTTP ${response?.status || '网络错误'}）。`);
    data = await response.json();
  }
  if (data?.ticker !== symbol || !Array.isArray(data.events) || data.events.length > 3000 || data.events.some(row => row.ticker !== symbol || row.source !== 'klsescreener-dividend-history')) throw new Error('KLSE Screener 股息历史响应与股票代码不匹配。');
  return { ticker: symbol, source: 'klsescreener', sourceUrl: data.sourceUrl, retrievedAt: data.retrievedAt || new Date(now).toISOString(), expiresAt: data.expiresAt || now + 6 * 60 * 60 * 1000, events: reconcileKlsescreenerDividends(yahooEvents, data.events, { ticker: symbol }), sourceEvents: data.events };
}

export { approveKlsescreenerPaymentDate };
