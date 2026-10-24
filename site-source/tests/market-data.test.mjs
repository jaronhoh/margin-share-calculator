import assert from 'node:assert/strict';
import {parsePriceCsv,comparePriceRows,buildPriceSnapshot} from '../dist/market-data.mjs';

assert.deepEqual(parsePriceCsv('\uFEFFDate,Close\r\n2026-01-02,9.12\r\n2026-01-01,9.17\r\n'),[
  {date:'2026-01-01',close:9.17},{date:'2026-01-02',close:9.12}
]);
assert.deepEqual(parsePriceCsv('日期,收盘价\n2026-01-01,9.17'),[{date:'2026-01-01',close:9.17}]);
assert.throws(()=>parsePriceCsv('Date,Close\n2026-02-30,9'),/日期无效/);
assert.throws(()=>parsePriceCsv('Date,Close\n2026-01-01,0'),/收盘价无效/);
assert.throws(()=>parsePriceCsv('Date,Close\n2026-01-01,9\n2026-01-01,9.1'),/重复/);
assert.throws(()=>parsePriceCsv('Date,Close\n2026-01-01,"9.1'),/引号未闭合/);
assert.throws(()=>parsePriceCsv('Date,Close\n2026-01-01,"9.1"oops'),/闭合引号后/);
assert.deepEqual(comparePriceRows([{date:'2026-01-01',close:9.17},{date:'2026-01-02',close:9.1}],parsePriceCsv('Date,Close\n2026-01-01,9.17\n2026-01-02,9.2\n2026-01-03,9.3')),
 [{date:'2026-01-01',close:9.17,kind:'same',currentClose:9.17},{date:'2026-01-02',close:9.2,kind:'conflict',currentClose:9.1},{date:'2026-01-03',close:9.3,kind:'new',currentClose:null}]);
const original=[{date:'2026-01-01',close:9.17},{date:'2026-01-02',close:9.1}],incoming=parsePriceCsv('Date,Close\n2026-01-02,9.2\n2026-01-03,9.3');
const snapshot=buildPriceSnapshot(original,incoming,['2026-01-02','2026-01-03'],['2026-01-01']);
assert.deepEqual(snapshot.rows,[{date:'2026-01-01',close:9.17},{date:'2026-01-02',close:9.2},{date:'2026-01-03',close:9.3}]);
assert.deepEqual(snapshot.manualPriceDates,['2026-01-01','2026-01-02']);
assert.equal(original[1].close,9.1,'candidate must not mutate the active snapshot');
assert.throws(()=>buildPriceSnapshot([original[0]],parsePriceCsv('Date,Close\n2026-01-03,9.3'),['2026-01-03']),/缺少 2026-01-02/);
assert.throws(()=>buildPriceSnapshot(original,incoming,['2026-01-04']),/不在导入数据中/);
console.log('PASS CSV validation, Kuala Lumpur calendar dates, duplicate rejection, change classification, immutable candidate snapshot, manual-price provenance and missing-day rejection');
