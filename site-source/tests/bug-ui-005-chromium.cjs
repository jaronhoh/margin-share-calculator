const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.route('**/api/yahoo-chart?**', async route => {
    const url = new URL(route.request().url());
    const ticker = url.searchParams.get('ticker');
    const dates = ticker === '^KLSE'
      ? ['2025-02-04', '2025-02-07']
      : ['2025-02-04', '2025-02-05', '2025-02-07'];
    const closes = ticker === '^KLSE' ? [1600, 1610] : [6.3, 6.35, 6.4];
    const timestamp = dates.map(date => Math.floor(Date.parse(date + 'T04:00:00Z') / 1000));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ chart: { result: [{
        meta: { symbol: ticker, currency: 'MYR', exchangeTimezoneName: 'Asia/Kuala_Lumpur' },
        timestamp,
        indicators: { quote: [{ close: closes }] },
      }], error: null } }),
    });
  });

  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8765');
  await page.locator('#resultStatus').waitFor();
  await page.locator('#openSettings').click();
  await page.locator('#stockCode').fill('1066.KL');
  await page.locator('#startDate').fill('2025-02-04');
  await page.locator('#endDate').fill('2025-02-07');
  await page.locator('#run').click();
  await page.waitForFunction(() => document.querySelector('#resultStatus').textContent.includes('回测完成'));
  assert.equal(await page.locator('#error').textContent(), '');
  await page.locator('#closeSettings').click();
  await page.locator('.chartwrap ~ .legend').waitFor({ state: 'visible' });

  const series = [
    { input: 'loan', variable: 'loan', tip: '贷款', text: '日终贷款余额' },
    { input: 'marketValue', variable: 'value', tip: '股票市值', text: '股票市值' },
    { input: 'netWorth', variable: 'net', tip: '净资产', text: '净资产' },
    { input: 'lsr', variable: 'lsr', tip: 'LSR', text: 'LSR' },
    { input: 'price', variable: 'price', tip: '价格', text: '股票价格（RM/股）' },
  ];

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      const layout = await page.locator('.chartwrap ~ .legend').evaluate(element => {
        const labels = [...element.querySelectorAll('label')];
        return {
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          pageWidth: document.documentElement.scrollWidth,
          keys: labels.map(label => label.querySelector('input').dataset.chartSeries),
          tops: labels.map(label => label.getBoundingClientRect().top),
          whiteSpace: labels.map(label => getComputedStyle(label).whiteSpace),
          fontSizes: labels.map(label => getComputedStyle(label).fontSize),
        };
      });
      assert.deepEqual(layout.keys, series.map(item => item.input), 'legend order');
      assert(layout.tops.every(top => Math.abs(top - layout.tops[0]) < 1), 'all five legend labels stay on one row');
      assert(layout.whiteSpace.every(value => value === 'nowrap'), 'legend labels do not wrap');
      assert(layout.fontSizes.every(value => value === '12px'), 'legend text size is preserved');
      assert(layout.pageWidth <= width, 'page has no horizontal overflow');
      if (width < 560) assert(layout.scrollWidth > layout.clientWidth, 'narrow legend scrolls within its own container');
      if (width === 1440) assert(layout.scrollWidth <= layout.clientWidth + 1, 'desktop legend fits without scrolling');

      await page.locator('#chart').focus();
      await page.keyboard.press('Home');
      await page.locator('.chart-tip').waitFor({ state: 'visible' });
      const colors = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const context = document.createElement('canvas').getContext('2d');
        const normalize = value => {
          context.fillStyle = value;
          context.fillRect(0, 0, 1, 1);
          const pixel = context.getImageData(0, 0, 1, 1).data;
          return 'rgb(' + pixel[0] + ', ' + pixel[1] + ', ' + pixel[2] + ')';
        };
        const names = ['loan', 'value', 'net', 'lsr', 'price'];
        const variables = Object.fromEntries(names.map(name => [name, normalize(rootStyle.getPropertyValue('--series-' + name).trim())]));
        const pathColors = Object.fromEntries(names.map(name => {
          const path = document.querySelector('#chart path[stroke="var(--series-' + name + ')"]');
          return [name, path ? normalize(getComputedStyle(path).stroke) : null];
        }));
        const dotInputs = { loan: 'loan', value: 'marketValue', net: 'netWorth', lsr: 'lsr', price: 'price' };
        const dotStyles = Object.fromEntries(names.map(name => {
          const input = document.querySelector('[data-chart-series="' + dotInputs[name] + '"]');
          const dot = input.closest('label').querySelector('.dot');
          const style = getComputedStyle(dot);
          const colorProbe = document.createElement('span');
          colorProbe.style.color = 'var(--series-' + name + ')';
          document.body.appendChild(colorProbe);
          const resolvedSeriesColor = getComputedStyle(colorProbe).color;
          colorProbe.remove();
          const solidMatches = normalize(style.backgroundColor) === variables[name];
          const patternedMatches = style.backgroundImage.includes(resolvedSeriesColor);
          return [name, solidMatches || patternedMatches];
        }));
        const tipColors = [...document.querySelector('.chart-tip').children].slice(1)
          .map(line => normalize(getComputedStyle(line).borderLeftColor));
        return { variables, pathColors, dotStyles, tipColors };
      });
      const tipOrder = ['price', 'value', 'loan', 'net', 'lsr'];
      for (const item of series) {
        const expected = colors.variables[item.variable];
        assert.equal(colors.pathColors[item.variable], expected, item.variable + ' curve color');
        assert.equal(colors.dotStyles[item.variable], true, item.variable + ' legend color matches its series token');
      }
      assert.deepEqual(colors.tipColors, tipOrder.map(name => colors.variables[name]), 'tooltip colors match their curves and legend');
      assert.notEqual(colors.variables.loan, colors.variables.price, 'loan and stock price colors are distinguishable');
      await page.keyboard.press('Escape');
      await page.screenshot({ path: 'artifacts/bug-ui-005-' + width + '-' + theme + '.png', fullPage: true });
    }
  }

  for (const item of series) {
    const checkbox = page.locator('[data-chart-series="' + item.input + '"]');
    const path = page.locator('#chart path[stroke="var(--series-' + item.variable + ')"]');
    assert.equal(await path.count(), 1, item.input + ' curve initially visible');
    await checkbox.uncheck();
    assert.equal(await path.count(), 0, item.input + ' curve hides independently');
    await checkbox.check();
    assert.equal(await path.count(), 1, item.input + ' curve restores independently');
  }

  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log('PASS BUG-UI-005 Chromium viewports 1440/390/320, light/dark colors, tooltip colors, no page overflow, and independent series toggles');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
