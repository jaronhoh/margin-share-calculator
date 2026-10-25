import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const node = process.execPath;

test('Site Worker serves the app and same-origin Yahoo requests with safe validation', async () => {
  execFileSync(node, ['tools/build-site-worker.mjs'], { cwd: root, stdio: 'pipe' });
  const built = await readFile(join(root, 'dist/server/index.js'), 'utf8');
  const temp = await mkdtemp(join(tmpdir(), 'margin-site-worker-'));
  const modulePath = join(temp, 'worker.mjs');
  await writeFile(modulePath, built);
  const { default: worker } = await import(`${pathToFileURL(modulePath).href}?test=${Date.now()}`);

  const page = await worker.fetch(new Request('https://site.example/'));
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Margin Share Calculator/);
  const module = await worker.fetch(new Request('https://site.example/yahoo-chart.mjs'));
  assert.equal(module.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.match(await module.text(), /api\/yahoo-chart/);
  assert.equal((await worker.fetch(new Request('https://site.example/no-such-file'))).status, 404);
  assert.equal((await worker.fetch(new Request('https://site.example/', { method: 'POST' }))).status, 405);

  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify({ chart: { result: [] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const ok = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=1066.KL&period1=1&period2=2', { headers: { 'user-agent': 'Test Browser', 'accept-language': 'zh-MY' } }));
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('cache-control'), 'no-store');
    assert.equal(calls.length, 1);
    const upstream = new URL(calls[0].url);
    assert.equal(upstream.hostname, 'query1.finance.yahoo.com');
    assert.equal(upstream.pathname, '/v8/finance/chart/1066.KL');
    assert.equal(upstream.searchParams.get('interval'), '1d');
    assert.equal(upstream.searchParams.get('events'), 'div,splits');
    assert.equal(calls[0].options.headers.get('user-agent'), 'Test Browser');
    assert.equal(calls[0].options.headers.get('accept-language'), 'zh-MY');
    assert.equal(calls[0].options.headers.get('referer'), 'https://finance.yahoo.com/');

    const calendar = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=%5EKLSE&period1=1&period2=2'));
    assert.equal(calendar.status, 200, 'Yahoo Bursa market benchmark is available for dynamic calendar updates');
    assert.equal(new URL(calls[1].url).pathname, '/v8/finance/chart/%5EKLSE');

    const invalid = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=AAPL&period1=1&period2=2'));
    assert.equal(invalid.status, 400);
    assert.equal(calls.length, 2, 'invalid ticker must not reach Yahoo');

    const klBoundary = Math.floor(Date.now() / 1000) + 2 * 86400;
    const malaysiaMidnight = await worker.fetch(new Request(`https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=${klBoundary}`));
    assert.equal(malaysiaMidnight.status, 200, 'exclusive KL-midnight date boundary remains valid across UTC dates');
    assert.equal(calls.length, 3);
    const farFuture = await worker.fetch(new Request(`https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=${klBoundary + 1}`));
    assert.equal(farFuture.status, 400, 'requests beyond two days are rejected');
    assert.equal(calls.length, 3);

    globalThis.fetch = async () => new Response('rate limited', { status: 429 });
    const limited = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=2'));
    assert.equal(limited.status, 429, 'Yahoo rate limit is passed through for the UI to display');

    const marketHtml = '<title>RHBBANK: RHB BANK BERHAD &#40;1066&#41; | KLSE Screener</title><h5 class="stock-code"><a><span>1066</span></a></h5><table><thead><tr><th>Announced</th><th>Financial Year</th><th>Subject</th><th>EX Date</th><th>Payment Date</th><th>Amount</th><th>Indicator</th><th></th></tr></thead><tbody><tr><td>27 Feb 2025</td><td>31 Dec 2024</td><td>Second Interim Dividend</td><td>21 Mar 2025</td><td>09 Apr 2025</td><td>0.2800</td><td>Currency</td><td>View</td></tr><tr><td>24 Aug 2010</td><td>31 Dec 2010</td><td>Interim Dividend</td><td>15 Sep 2010</td><td>30 Sep 2010</td><td>5.0000</td><td>Percentage</td><td>View</td></tr></tbody></table>';
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(marketHtml, { status: 200, headers: { 'content-type': 'text/html' } });
    };
    const history = await worker.fetch(new Request('https://site.example/api/klsescreener-dividends?ticker=1066.KL'));
    assert.equal(history.status, 200);
    const historyData = await history.json();
    assert.equal(historyData.ticker, '1066.KL');
    assert.equal(historyData.events[0].exDate, '2025-03-21');
    assert.equal(historyData.events[0].paymentDate, '2025-04-09');
    assert.equal(historyData.events[0].perShare, 0.28);
    assert.equal(historyData.events.length, 1, 'percentage-denominated dividend rows must not be treated as per-share currency');
    assert.equal(historyData.events[0].source, 'klsescreener-dividend-history');
    assert.equal(new URL(calls.at(-1).url).hostname, 'www.klsescreener.com');
    assert.equal(new URL(calls.at(-1).url).pathname, '/v2/stocks/view/1066');
    assert.equal(calls.at(-1).options.headers.get('referer'), 'https://www.klsescreener.com/');
    const invalidSource = await worker.fetch(new Request('https://site.example/api/klsescreener-dividends?ticker=AAPL'));
    assert.equal(invalidSource.status, 400);
    assert.equal(calls.length, 4, 'invalid Bursa code must not reach KLSE Screener');
    globalThis.fetch = async () => new Response(marketHtml.replaceAll('1066', '1155'), { status: 200 });
    const wrongStock = await worker.fetch(new Request('https://site.example/api/klsescreener-dividends?ticker=1066.KL'));
    assert.equal(wrongStock.status, 502, 'source page must contain the requested stock code');
    assert.match((await wrongStock.json()).error, /RHBBANK.*1155/, 'stock identity failures include a short title diagnostic');
    globalThis.fetch = async url => {
      calls.push({ url: String(url) });
      return new Response(marketHtml.replaceAll('1066', '03050'), { status: 200, headers: { 'content-type': 'text/html' } });
    };
    const fiveDigit = await worker.fetch(new Request('https://site.example/api/klsescreener-dividends?ticker=03050.KL'));
    assert.equal(fiveDigit.status, 200, 'five-digit Bursa codes must use the complete code in the source path');
    assert.equal(new URL(calls.at(-1).url).pathname, '/v2/stocks/view/03050');
  } finally {
    globalThis.fetch = originalFetch;
    await rm(temp, { recursive: true, force: true });
  }
});

console.log('PASS Site Worker static assets, Yahoo Chart route, KLSE Screener dividend history, ticker validation, and upstream rate-limit handling');
