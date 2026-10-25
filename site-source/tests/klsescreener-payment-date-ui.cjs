const { chromium } = require('/Users/jaron/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function datesBetween(start, end) {
  const out = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += 86400000) {
    const date = new Date(t).toISOString().slice(0, 10), day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) out.push(date);
  }
  return out;
}
function yahooPayload(ticker) {
  const dates = datesBetween('2025-03-20', '2025-04-10');
  const timestamps = dates.map(date => Math.floor(Date.parse(`${date}T04:00:00Z`) / 1000));
  return { chart: { result: [{ meta: { symbol: ticker, currency: 'MYR', exchangeTimezoneName: 'Asia/Kuala_Lumpur' }, timestamp: timestamps, indicators: { quote: [{ close: dates.map((_, i) => 7.3 + i * 0.01) }] }, events: ticker === '1066.KL' ? { dividends: { [Math.floor(Date.parse('2025-03-21T04:00:00Z') / 1000)]: { date: Math.floor(Date.parse('2025-03-21T04:00:00Z') / 1000), amount: 0.28 } } } : {} }], error: null } };
}

(async () => {
  const node = process.execPath, sourceRoot = path.resolve(__dirname, '..');
  const { execFileSync } = require('node:child_process');
  execFileSync(node, ['tools/build-site-worker.mjs'], { cwd: sourceRoot, stdio: 'pipe' });
  const { default: worker } = await import(`${pathToFileURL(path.join(sourceRoot, 'dist/server/index.js')).href}?ui=${Date.now()}`);
  const server = http.createServer(async (req, res) => {
    const response = await worker.fetch(new Request(new URL(req.url, 'http://127.0.0.1'), { method: req.method, headers: req.headers }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(), baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/jaron/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.route('**/api/yahoo-chart?**', route => {
    const ticker = new URL(route.request().url()).searchParams.get('ticker');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(yahooPayload(ticker)) });
  });
  await page.route('**/api/klsescreener-dividends?**', route => {
    const ticker = new URL(route.request().url()).searchParams.get('ticker');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ticker, source: 'klsescreener', sourceUrl: `https://www.klsescreener.com/v2/stocks/view/${ticker.slice(0, 4)}`, retrievedAt: new Date().toISOString(), expiresAt: Date.now() + 21600000, events: [{ ticker, announcedDate: '2025-03-07', exDate: '2025-03-21', paymentDate: '2025-04-09', perShare: 0.28, subject: 'Second Interim Dividend', source: 'klsescreener-dividend-history', sourceUrl: `https://www.klsescreener.com/v2/stocks/view/${ticker.slice(0, 4)}`, reviewStatus: 'third-party-unverified' }] }) });
  });
  await page.goto(baseUrl);
  await page.locator('#resultStatus').waitFor();
  await page.locator('#openSettings').click();
  await page.locator('#stockCode').fill('1066.KL');
  await page.locator('#startDate').fill('2025-03-20');
  await page.locator('#endDate').fill('2025-04-10');
  await page.locator('#run').click();
  await page.waitForFunction(() => document.querySelector('#resultStatus').textContent.includes('回测完成') || document.querySelector('#error').textContent.length > 0);
  assert.equal(await page.locator('#error').textContent(), '');
  await page.waitForFunction(() => document.querySelector('#paymentDateStatus').textContent.includes('待确认') || document.querySelector('#paymentDateError').textContent.length > 0);
  assert.equal(await page.locator('#paymentDateError').textContent(), '');
  await page.locator('#closeSettings').click();
  await page.locator('#navDividends').click();
  assert.equal(await page.locator('#paymentDateRows tr').count(), 1);
  const candidate = page.locator('#paymentDateRows tr').first();
  assert.match(await candidate.textContent(), /2025-04-09/);
  assert.match(await candidate.textContent(), /third-party-match-pending-review/);
  assert.match(await candidate.locator('a').getAttribute('href'), /^https:\/\/www\.klsescreener\.com\/v2\/stocks\/view\/1066$/);
  await candidate.locator('[data-payment-select]').check();
  await candidate.locator('[data-payment-target]').selectOption('add');
  await page.locator('#previewPaymentDates').click();
  assert.equal(await page.locator('#paymentDateCompareRows tr').count(), 9);
  await page.locator('#approvePaymentDates').click();
  assert.equal(await page.locator('#paymentDateStatus').textContent(), '已保存用户确认记录并纳入回测');
  const paidRow = page.locator('#rows tr[data-date="2025-04-09"]');
  assert.equal(await paidRow.count(), 1);
  assert(Number((await paidRow.locator('td').nth(12).textContent()).replace(/[^0-9.]/g, '')) > 0, 'confirmed event posts on its Payment Date');
  await page.locator('#navBacktest').click();
  await page.locator('#openSettings').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()]);
  const fs = require('node:fs'), snapshotPath = await download.path(), snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  assert.equal(snapshot.marketOverrides.paymentDateApprovals.length, 1);
  assert.equal(snapshot.marketOverrides.paymentDateApprovals[0].paymentDate, '2025-04-09');
  assert.equal(snapshot.marketOverrides.paymentDateApprovals[0].source, 'klsescreener-user-approved');
  await page.locator('#import').setInputFiles(snapshotPath);
  await page.waitForFunction(() => document.querySelector('#autoSaveStatus').textContent.includes('已自动保存'));
  const [roundTripDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()]);
  const roundTrip = JSON.parse(fs.readFileSync(await roundTripDownload.path(), 'utf8'));
  assert.equal(roundTrip.marketOverrides.paymentDateApprovals[0].paymentDate, '2025-04-09', 'JSON import preserves the explicit payment-date approval');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', cases: ['same ticker/ex-date/amount match', 'review and nine-metric preview', 'explicit approval', 'Payment Date ledger posting', 'snapshot provenance', 'no browser errors'], rows: await page.locator('#rows tr').count() }));
  await browser.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
})().catch(error => { console.error(error); process.exit(1); });
