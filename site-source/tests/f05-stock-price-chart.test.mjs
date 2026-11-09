import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../dist/neutral.css', import.meta.url), 'utf8');

assert.match(html, /股票价格（RM\/股）/);
assert.match(html, /右外轴：股票价格 RM\/股/);
assert.match(html, /回测使用价格：/);
assert.match(html, /非交易日沿用 \$\{from\|\|\x27前一有效交易日\x27\} 收盘价/);
assert.match(html, /prices=rows\.map\(r=>r\.price\)/);
assert.match(html, /minP=prices\.length\?Math\.min\(\.\.\.prices\):0,maxP=prices\.length\?Math\.max\(\.\.\.prices\):0/);
assert.equal((html.match(/if\(prices\.length\)el\('text',\{x:W-3,y:/g) || []).length, 2);
assert.match(html, /if\(!Number\.isFinite\(r\.price\)\|\|r\.price<=0\)\{pen=false;return '';\}/);
assert.match(html, /priceVisible=input.checked/);
assert.match(html, /drawChart\(lastResult\.rows\)/);
assert.match(css, /--series-price:/);
assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css, /\.chartwrap~\.legend>span\{white-space:normal\}/);
assert.match(html, /data-chart-series="price" checked/);
assert.match(html, /if\(chartSeriesVisible\[key\]\)el/);

assert.match(css, /\/\* UI-008: center all five chart series as a single legend row on desktop\. \*\//);
assert.match(css, /\.chartwrap~\.legend\{justify-content:center;flex-wrap:nowrap\}/);
assert.match(css, /@media\(max-width:700px\)\{\.chartwrap~\.legend\{flex-wrap:wrap;overflow-x:visible;overflow-y:visible;justify-content:center/);
assert.equal((html.match(/data-chart-series="(?:loan|marketValue|netWorth|lsr|price)" checked/g)||[]).length,5);

console.log('PASS F05 chart uses backtest price, independent scale, toggle, tooltip and missing-value gaps');
