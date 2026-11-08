import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../dist/neutral.css', import.meta.url), 'utf8');
test('BUG-UI-005 legend order, one-row scrolling, theme colors and toggle tooltip mapping', () => {
  const block = html.match(/<div class="legend">([\\s\\S]*?)<\\/div>/)?.[1];
  assert.ok(block, 'chart legend exists');
  const labels = [...block.matchAll(/data-chart-series="([^"]+)"[^>]*>[\\s\\S]*?<\\/label>/g)].map(m => m[1]);
  assert.deepEqual(labels, ['loan', 'marketValue', 'netWorth', 'lsr', 'price']);
  for (const label of ['日终贷款余额','股票市值','净资产','LSR','股票价格（RM/股）']) assert.ok(block.includes(label));
  assert.match(css, /chartwrap~\\.legend\\{display:flex;flex-wrap:nowrap;[^}]*overflow-x:auto/);
  assert.match(css, /chartwrap~\\.legend>label\\{[^}]*flex:0 0 auto;[^}]*white-space:nowrap/);
  for (const color of ['#b91c1c','#1d4ed8','#15803d','#7e22ce','#0e7490','#f87171','#60a5fa','#4ade80','#c084fc','#22d3ee']) assert.ok(css.includes(color), color);
  for (const key of ['marketValue','loan','netWorth','lsr']) assert.ok(html.includes("['"+key+"'"));
  assert.match(html, /swatch.className='chart-tip-swatch '\\+key/);
  assert.match(html, /addEventListener\\('change',[\\s\\S]*?drawChart/);
  assert.match(html, /svg\\.onkeydown/);
});
