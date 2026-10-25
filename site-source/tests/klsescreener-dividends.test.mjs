import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKlsescreenerDividendTable} from '../dist/klsescreener-dividends.mjs';
const url='https://www.klsescreener.com/v2/stocks/view/1155/malayan-banking-berhad';
const table=`Announced | Financial Year | Subject | EX Date | Payment Date | Amount | Indicator |
--- | --- | --- | --- | --- | --- | --- | ---
27 Feb 2026 | 31 Dec 2025 | Second Interim Dividend | 12 Mar 2026 | 26 Mar 2026 | 0.3300 | Currency | View
27 Aug 2025 | 31 Dec 2025 | First Interim Dividend | 11 Sep 2025 | 26 Sep 2025 | 0.3000 | Currency | View`;
test('extracts KLSE Screener dividend history with distinct ex and payment dates',()=>{
 const rows=parseKlsescreenerDividendTable(table,{ticker:'1155.KL',sourceUrl:url});
 assert.equal(rows.length,2);assert.equal(rows[0].exDate,'2026-03-12');assert.equal(rows[0].paymentDate,'2026-03-26');
 assert.equal(rows[0].perShare,0.33);assert.equal(rows[0].reviewStatus,'third-party-unverified');
});
test('rejects mismatched ticker, domain and missing table',()=>{
 assert.throws(()=>parseKlsescreenerDividendTable(table,{ticker:'1066.KL',sourceUrl:url}));
 assert.throws(()=>parseKlsescreenerDividendTable(table,{ticker:'1155.KL',sourceUrl:'https://evil.example/v2/stocks/view/1155/test'}));
 assert.throws(()=>parseKlsescreenerDividendTable('No dividends',{ticker:'1155.KL',sourceUrl:url}));
});
test('rejects invalid payment date instead of inventing it',()=>{
 assert.throws(()=>parseKlsescreenerDividendTable(table.replaceAll('26 Mar 2026','31 Feb 2026').replaceAll('26 Sep 2025','31 Feb 2025'),{ticker:'1155.KL',sourceUrl:url}));
});
