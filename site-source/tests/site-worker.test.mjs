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
    const ok = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=2', { headers: { 'user-agent': 'Test Browser', 'accept-language': 'zh-MY' } }));
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('cache-control'), 'no-store');
    assert.equal(calls.length, 1);
    const upstream = new URL(calls[0].url);
    assert.equal(upstream.hostname, 'query1.finance.yahoo.com');
    assert.equal(upstream.pathname, '/v8/finance/chart/1155.KL');
    assert.equal(upstream.searchParams.get('interval'), '1d');
    assert.equal(upstream.searchParams.get('events'), 'div,splits');
    assert.equal(calls[0].options.headers.get('user-agent'), 'Test Browser');
    assert.equal(calls[0].options.headers.get('accept-language'), 'zh-MY');
    assert.equal(calls[0].options.headers.get('referer'), 'https://finance.yahoo.com/');

    const invalid = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=AAPL&period1=1&period2=2'));
    assert.equal(invalid.status, 400);
    assert.equal(calls.length, 1, 'invalid ticker must not reach Yahoo');

    const klBoundary = Math.floor(Date.now() / 1000) + 2 * 86400;
    const malaysiaMidnight = await worker.fetch(new Request(`https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=${klBoundary}`));
    assert.equal(malaysiaMidnight.status, 200, 'exclusive KL-midnight date boundary remains valid across UTC dates');
    assert.equal(calls.length, 2);
    const farFuture = await worker.fetch(new Request(`https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=${klBoundary + 1}`));
    assert.equal(farFuture.status, 400, 'requests beyond two days are rejected');
    assert.equal(calls.length, 2);

    globalThis.fetch = async () => new Response('rate limited', { status: 429 });
    const limited = await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=1155.KL&period1=1&period2=2'));
    assert.equal(limited.status, 429, 'Yahoo rate limit is passed through for the UI to display');
  } finally {
    globalThis.fetch = originalFetch;
    await rm(temp, { recursive: true, force: true });
  }
});

console.log('PASS Site Worker static assets, same-origin Yahoo Chart route, validation, and upstream rate-limit handling');
