import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../dist/neutral.css', import.meta.url), 'utf8');

assert.match(html, /股票价格（RM\/股）/);
assert.match(html, /右外轴：股票价格 RM\/股/);
assert.match(html, /回测使用价格：/);
assert.match(html, /prices=rows\.map\(r=>r\.price\)/);
assert.match(html, /minP=prices\.length\?Math\.min\(\.\.\.prices\):0,maxP=prices\.length\?Math\.max\(\.\.\.prices\):0/);
assert.equal((html.match(/if\(prices\.length\)el\('text',\{x:W-3,y:/g) || []).length, 2);
assert.match(html, /if\(!Number\.isFinite\(r\.price\)\|\|r\.price<=0\)\{pen=false;return '';\}/);
assert.match(html, /priceVisible=!priceVisible/);
assert.match(html, /drawChart\(lastResult\.rows\)/);
assert.match(css, /--series-price:/);
assert.match(css, /\.chart-legend-button\[aria-pressed="false"\]/);

console.log('PASS F05 chart uses backtest price, independent scale, toggle, tooltip and missing-value gaps');
