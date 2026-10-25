import assert from 'node:assert/strict';
import {parsePriceCsv,comparePriceRows,buildPriceSnapshot,commitSnapshot,restoreSnapshot} from '../dist/market-data.mjs';
import {createYahooMarketCalendar} from '../dist/yahoo-calendar.mjs';

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
assert.throws(()=>buildPriceSnapshot([original[0]],parsePriceCsv('Date,Close\n2026-01-03,9.3'),['2026-01-03']),/缺少交易日或未核实的休市日 2026-01-02/);
assert.throws(()=>buildPriceSnapshot(original,incoming,['2026-01-04']),/不在导入数据中/);
const store=new Map([['active','before']]),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};let active='before';
const old=commitSnapshot(storage,'active',{version:2},()=>{active='after';},()=>{active='before';});
assert.equal(old,'before');assert.equal(active,'after');assert.equal(JSON.parse(storage.getItem('active')).version,2);
restoreSnapshot(storage,'active',old);active='before';assert.equal(storage.getItem('active'),'before');
const failingStorage={getItem:k=>store.get(k)??null,setItem(){throw new Error('quota exceeded');},removeItem:k=>store.delete(k)};
assert.throws(()=>commitSnapshot(failingStorage,'active',{version:3},()=>{active='broken';},()=>{active='before';}),/保存失败/);assert.equal(active,'before');assert.equal(storage.getItem('active'),'before');
assert.throws(()=>commitSnapshot(storage,'active',{version:4},()=>{active='broken';throw new Error('render failed');},()=>{active='before';}),/原有数据已恢复/);assert.equal(active,'before');assert.equal(storage.getItem('active'),'before');

const weekendSnapshot=buildPriceSnapshot([{date:'2025-01-24',close:9.1}],parsePriceCsv('Date,Close\n2025-01-27,9.3'),['2025-01-27']);
assert.deepEqual(weekendSnapshot.rows.slice(1,3).map(x=>[x.date,x.close,x.carryForward,x.carryForwardFrom,x.reason]),[
 ['2025-01-25',9.1,true,'2025-01-24','weekend'],['2025-01-26',9.1,true,'2025-01-24','weekend']
]);
const closureSnapshot=buildPriceSnapshot([{date:'2025-01-28',close:9.1}],parsePriceCsv('Date,Close\n2025-01-31,9.3'),['2025-01-31']);
assert.deepEqual(closureSnapshot.rows.slice(1,3).map(x=>[x.date,x.close,x.carryForward,x.carryForwardFrom,x.reason,x.source]),[
 ['2025-01-29',9.1,true,'2025-01-28','confirmed-market-holiday','bursa-chinese-new-year-2025'],['2025-01-30',9.1,true,'2025-01-28','confirmed-market-holiday','bursa-chinese-new-year-2025']
]);
const yahooCalendar=createYahooMarketCalendar([{date:'2025-02-04',close:1600},{date:'2025-02-07',close:1610}],{startDate:'2025-02-04',endDate:'2025-02-07'});
const yahooClosure=buildPriceSnapshot([], [{date:'2025-02-04',close:6.3},{date:'2025-02-07',close:6.4}],['2025-02-04','2025-02-07'],[],yahooCalendar);
assert.deepEqual(yahooClosure.rows.slice(1,3).map(x=>[x.date,x.close,x.carryForward,x.carryForwardFrom,x.reason,x.source]),[
 ['2025-02-05',6.3,true,'2025-02-04','yahoo-market-holiday','Yahoo Finance ^KLSE'],['2025-02-06',6.3,true,'2025-02-04','yahoo-market-holiday','Yahoo Finance ^KLSE']
]);
const protectedPrice=buildPriceSnapshot([{date:'2025-01-24',close:9.1}],parsePriceCsv('Date,Close\n2025-01-24,9.8\n2025-01-27,9.3'),['2025-01-24','2025-01-27'],['2025-01-24']);
assert.equal(protectedPrice.rows[0].close,9.8);assert(protectedPrice.manualPriceDates.includes('2025-01-24'));
const weekdays=[];for(let ms=Date.parse('2010-01-01T00:00:00Z');weekdays.length<3600;ms+=86400000){const d=new Date(ms),day=d.getUTCDay();if(day!==0&&day!==6)weekdays.push({date:d.toISOString().slice(0,10),close:9.1});}
assert.throws(()=>buildPriceSnapshot(weekdays,[],[]),/超过 5,000 条日历日记录/);
console.log('PASS weekend and consecutive confirmed-holiday carry-forward provenance, unconfirmed weekday gaps, expanded limit, and manual-price preservation');
