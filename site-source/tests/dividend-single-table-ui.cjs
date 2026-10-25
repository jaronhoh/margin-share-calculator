const { chromium } = require('/Users/jaron/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');

function datesBetween(start, end) {
  const out = [];
  for (let time = Date.parse(`${start}T00:00:00Z`); time <= Date.parse(`${end}T00:00:00Z`); time += 86400000) {
    const date = new Date(time), day = date.getUTCDay();
    if (day !== 0 && day !== 6) out.push(date.toISOString().slice(0, 10));
  }
  return out;
}
function yahooPayload(ticker) {
  const dates = datesBetween('2025-03-20', '2025-04-10');
  const timestamps = dates.map(date => Math.floor(Date.parse(`${date}T04:00:00Z`) / 1000));
  const closes = ticker === '^KLSE' ? dates.map((_, i) => 1600 + i) : dates.map((_, i) => 7.3 + i * 0.01);
  const dividends = ticker === '1155.KL' ? { [Math.floor(Date.parse('2025-03-21T04:00:00Z') / 1000)]: { date: Math.floor(Date.parse('2025-03-21T04:00:00Z') / 1000), amount: 0.28 } } : {};
  return { chart: { result: [{ meta: { symbol: ticker, currency: 'MYR', exchangeTimezoneName: 'Asia/Kuala_Lumpur' }, timestamp: timestamps, indicators: { quote: [{ close: closes }] }, events: { dividends } }], error: null } };
}

(async () => {
  const sourceRoot = path.resolve(__dirname, '..');
  execFileSync(process.execPath, ['tools/build-site-worker.mjs'], { cwd: sourceRoot, stdio: 'pipe' });
  const { default: worker } = await import(`${pathToFileURL(path.join(sourceRoot, 'dist/server/index.js')).href}?dividend-ui=${Date.now()}`);
  const server = http.createServer(async (req, res) => {
    const response = await worker.fetch(new Request(new URL(req.url, 'http://127.0.0.1'), { method: req.method, headers: req.headers }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/jaron/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.confirm = () => true; });
  let yahooCalls = 0, failNextYahoo = false;
  await page.route('**/api/yahoo-chart?**', async route => {
    yahooCalls++;
    await new Promise(resolve => setTimeout(resolve, 120));
    if (failNextYahoo) { failNextYahoo = false; return route.abort(); }
    const ticker = new URL(route.request().url()).searchParams.get('ticker');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(yahooPayload(ticker)) });
  });
  await page.route('**/api/klsescreener-dividends?**', route => {
    const ticker = new URL(route.request().url()).searchParams.get('ticker');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      ticker, source: 'klsescreener', sourceUrl: 'https://www.klsescreener.com/v2/stocks/view/1155',
      events: [{ ticker, exDate: '2025-03-21', paymentDate: '2025-04-09', perShare: 0.28, source: 'klsescreener-dividend-history', sourceUrl: 'https://www.klsescreener.com/v2/stocks/view/1155' }],
    }) });
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#resultStatus').waitFor();
  await page.locator('#navDividends').click();
  const dividendPage = page.locator('#dividendPage');
  assert.equal(await dividendPage.locator('table').count(), 1, 'dividend page has exactly one table');
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').count(), 24, 'the original 24 dividend records remain');
  assert.equal(await page.locator('#dividendCsv').count(), 0, 'dividend CSV import is removed');
  assert.equal(await page.locator('#dividendReviewRows').count(), 0, 'dividend CSV review is removed');
  assert.equal(await page.locator('#paymentDateRows').count(), 0, 'there is no separate Payment Date table');
  assert.equal(await page.getByText('导入并审核股息 CSV').count(), 0);
  assert.equal(await page.locator('#saveDividends').count(), 0, 'there is no manual save/return button');
  await page.locator('#addDividend').click();
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').count(), 25);
  await page.locator('#dividendRows tr[data-dividend-event]').last().locator('[data-remove]').click();
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').count(), 24);
  await page.locator('#navBacktest').click();
  assert.equal(await page.locator('#backtestPage').isVisible(), true, 'Backtest navigation saves and returns without a separate save action');
  await page.locator('#openSettings').click();
  await page.locator('#stockCode').fill('1155.KL');
  await page.locator('#startDate').fill('2025-03-20');
  await page.locator('#endDate').fill('2025-04-10');
  await page.locator('#run').click();
  await page.waitForFunction(() => document.querySelector('#resultStatus').textContent.includes('回测完成') || document.querySelector('#error').textContent.length > 0);
  assert.equal(await page.locator('#error').textContent(), '');
  await page.waitForFunction(() => document.querySelectorAll('#dividendRows tr[data-payment-candidate]').length === 1);
  await page.locator('#closeSettings').click();
  await page.locator('#navDividends').click();
  assert.equal(await dividendPage.locator('table').count(), 1);
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').count(), 24);
  const candidateRow = page.locator('#dividendRows tr[data-payment-candidate]').first();
  assert.match(await candidateRow.textContent(), /2025-04-09/);
  assert.match(await candidateRow.textContent(), /第三方匹配 · 待确认/);
  await candidateRow.locator('[data-approve-payment]').click();
  await page.waitForFunction(() => document.querySelector('#dividendRows tr[data-payment-candidate]')?.textContent.includes('已确认并纳入回测'));
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').count(), 24, 'approving a candidate leaves original Excel events unchanged');
  const firstAmount = page.locator('#dividendRows tr[data-dividend-event]').first().locator('[data-amount]');
  await firstAmount.fill('-1');
  await page.locator('#navBacktest').click();
  assert.equal(await page.locator('#dividendPage').isVisible(), true, 'invalid dividend data keeps the user on the dividend page');
  assert.notEqual(await page.locator('#dividendError').textContent(), '');
  await firstAmount.fill('0.123');
  await page.evaluate(() => { window.__savedSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }; });
  await page.locator('#navBacktest').click();
  assert.equal(await page.locator('#dividendPage').isVisible(), true, 'storage failure keeps the user on the dividend page');
  assert.match(await page.locator('#dividendError').textContent(), /自动保存失败/);
  await page.evaluate(() => { Storage.prototype.setItem = window.__savedSetItem; delete window.__savedSetItem; });
  await page.locator('#navBacktest').click();
  assert.equal(await page.locator('#dividendPage').isVisible(), false);
  await page.locator('#navDividends').click();
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').first().locator('[data-amount]').inputValue(), '0.123', 'dividend edits persist automatically when returning to Backtest');
  await page.locator('#navBacktest').click();
  await page.locator('#openSettings').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()]);
  const fs = require('node:fs'), snapshot = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  assert.equal(snapshot.marketOverrides.paymentDateApprovals.length, 1);
  assert.equal(snapshot.marketOverrides.paymentDateApprovals[0].paymentDate, '2025-04-09');
  assert.equal(snapshot.marketOverrides.dividendEvents.length, 24);
  assert.equal(snapshot.marketOverrides.dividendEvents[0].perShare, 0.123, 'latest dividend edit is saved to the existing snapshot');
  const callsBeforeRefresh = yahooCalls, savedBeforeRefresh = await page.evaluate(() => localStorage.getItem('margin-share-market-snapshot/v1'));
  await page.locator('#startPrice').evaluate(element => { element.value = '99'; });
  await page.locator('#run').click();
  await page.waitForTimeout(25);
  assert.equal(yahooCalls, callsBeforeRefresh + 2, 'every run fetches the selected ticker and fresh market calendar');
  assert.equal(await page.locator('#rows tr').count(), 0, 'old daily ledger is cleared while fresh Yahoo data loads');
  assert.equal(await page.locator('#dividendRows tr').count(), 0, 'old dividend table rows are cleared while fresh Yahoo data loads');
  assert.equal(await page.locator('#summary .metric').count(), 0, 'old summary is cleared while rerunning');
  await page.waitForFunction(() => document.querySelector('#resultStatus').textContent.includes('回测完成') || document.querySelector('#error').textContent.length > 0);
  assert.equal(await page.locator('#error').textContent(), '', 'stale startPrice does not block a fresh same-ticker run');
  assert.ok(await page.locator('#rows tr').count() > 0, 'new daily ledger appears after fresh calculation');
  assert.equal(await page.locator('#dividendRows tr[data-dividend-event]').count(), 24, 'the same-ticker MAYBANK events are restored from retained user data');
  assert.notEqual(await page.evaluate(() => localStorage.getItem('margin-share-market-snapshot/v1')), savedBeforeRefresh, 'successful refresh saves its new snapshot');
  const savedAfterRefresh = await page.evaluate(() => localStorage.getItem('margin-share-market-snapshot/v1'));
  failNextYahoo = true;
  await page.locator('#run').click();
  await page.waitForFunction(() => document.querySelector('#error').textContent.includes('Yahoo 回测失败'));
  assert.equal(await page.locator('#rows tr').count(), 0, 'failed fetch leaves the previous ledger cleared');
  assert.equal(await page.locator('#dividendRows tr').count(), 0, 'failed fetch leaves the previous dividend rows cleared');
  assert.equal(await page.evaluate(() => localStorage.getItem('margin-share-market-snapshot/v1')), savedAfterRefresh, 'failed refresh preserves the prior saved snapshot without showing stale output');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', checks: ['one unified dividend table', 'no dividend CSV import/review', '24 original records preserved', 'add/remove event', 'Yahoo Payment Date candidate shown inline', 'explicit approval and snapshot provenance', 'automatic save and return without a separate button', 'invalid data and storage failures remain on the dividend page', 'each run clears stale ledger/dividend rows and fetches fresh Yahoo data', 'stale start price is replaced by fresh Yahoo quote', 'failed refresh keeps old saved snapshot but displays no stale output', 'zero browser errors'] }));
  await browser.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
})().catch(error => { console.error(error); process.exit(1); });
