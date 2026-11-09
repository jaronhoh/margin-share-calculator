import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const node = process.execPath;

test('Site Worker serves the API-enabled app and exposes Yahoo and payment-date routes', async () => {
  execFileSync(node, ['tools/build-site-worker.mjs'], { cwd: root, stdio: 'pipe' });
  const built = await readFile(join(root, 'dist/server/index.js'), 'utf8');
  const temp = await mkdtemp(join(tmpdir(), 'margin-site-worker-'));
  try {
    const modulePath = join(temp, 'worker.mjs');
    await writeFile(modulePath, built);
    const { default: worker } = await import(pathToFileURL(modulePath).href);
    const page = await worker.fetch(new Request('https://site.example/'));
    assert.equal(page.status, 200);
    const html=await page.text();
    assert.match(html, /Margin Share Calculator/);
    assert.match(html, /fetchYahooChart/);
    assert.match(html, /fetchKlsescreenerPaymentDates/);
    const engine = await worker.fetch(new Request('https://site.example/engine.mjs'));
    assert.equal(engine.headers.get('content-type'), 'text/javascript; charset=utf-8');
    assert.equal((await worker.fetch(new Request('https://site.example/api/yahoo-chart?ticker=bad&period1=1&period2=2'))).status, 400);
    assert.equal((await worker.fetch(new Request('https://site.example/api/klsescreener-dividends?ticker=bad'))).status, 400);
    for (const path of ['/no-such-file']) assert.equal((await worker.fetch(new Request(`https://site.example${path}`))).status, 404);
    assert.equal((await worker.fetch(new Request('https://site.example/', { method: 'POST' }))).status, 405);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
