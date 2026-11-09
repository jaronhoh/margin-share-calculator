import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const node = process.execPath;

test('Site Worker serves the manual-import app without a market-data API', async () => {
  execFileSync(node, ['tools/build-site-worker.mjs'], { cwd: root, stdio: 'pipe' });
  const built = await readFile(join(root, 'dist/server/index.js'), 'utf8');
  const temp = await mkdtemp(join(tmpdir(), 'margin-site-worker-'));
  try {
    const modulePath = join(temp, 'worker.mjs');
    await writeFile(modulePath, built);
    const { default: worker } = await import(pathToFileURL(modulePath).href);
    const page = await worker.fetch(new Request('https://site.example/'));
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Margin Share Calculator/);
    const engine = await worker.fetch(new Request('https://site.example/engine.mjs'));
    assert.equal(engine.headers.get('content-type'), 'text/javascript; charset=utf-8');
    for (const path of ['/api/yahoo-chart?ticker=1155.KL&period1=1&period2=2', '/yahoo-chart.mjs', '/maybank-prices.json', '/persistence.mjs', '/no-such-file']) {
      assert.equal((await worker.fetch(new Request(`https://site.example${path}`))).status, 404);
    }
    assert.equal((await worker.fetch(new Request('https://site.example/', { method: 'POST' }))).status, 405);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
