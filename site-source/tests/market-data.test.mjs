import assert from 'node:assert/strict';
import {parsePriceCsv,comparePriceRows,buildPriceSnapshot,commitSnapshot,restoreSnapshot} from '../dist/market-data.mjs';
import {parseDividendCsv,compareDividendCandidates,approveDividendCandidates} from '../dist/dividend-data.mjs';
import {defaultDividends} from '../dist/dividend-events.mjs';

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
const store=new Map([['active','before']]),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};let active='before';
const old=commitSnapshot(storage,'active',{version:2},()=>{active='after';},()=>{active='before';});
assert.equal(old,'before');assert.equal(active,'after');assert.equal(JSON.parse(storage.getItem('active')).version,2);
restoreSnapshot(storage,'active',old);active='before';assert.equal(storage.getItem('active'),'before');
const failingStorage={getItem:k=>store.get(k)??null,setItem(){throw new Error('quota exceeded');},removeItem:k=>store.delete(k)};
assert.throws(()=>commitSnapshot(failingStorage,'active',{version:3},()=>{active='broken';},()=>{active='before';}),/保存失败/);assert.equal(active,'before');assert.equal(storage.getItem('active'),'before');
assert.throws(()=>commitSnapshot(storage,'active',{version:4},()=>{active='broken';throw new Error('render failed');},()=>{active='before';}),/原有数据已恢复/);assert.equal(active,'before');assert.equal(storage.getItem('active'),'before');
const excelEvents=defaultDividends(),divCandidates=parseDividendCsv('Ex-Date,Record Date,Payment Date,Dividend\n2021-06-28,2021-06-29,,0.39\n',{fileName:'new.csv'});
assert.equal(excelEvents.length,24);assert.equal(divCandidates[0].paymentDate,'');assert.equal(divCandidates[0].approved,false);
assert.throws(()=>approveDividendCandidates(divCandidates,[divCandidates[0].id]),/Ex-Date 不会代替付款日/);
divCandidates[0].paymentDate='2021-07-20';const reviewed=compareDividendCandidates(excelEvents,divCandidates);assert.equal(reviewed[0].suspectedDuplicate,true);
assert.throws(()=>approveDividendCandidates(reviewed,[reviewed[0].id]),/须明确确认/);
const imported=approveDividendCandidates(reviewed,[reviewed[0].id],[reviewed[0].id]);assert.equal(imported[0].date,'2021-07-20');assert.equal(imported[0].exDate,'2021-06-28');assert.equal(imported[0].dateType,'confirmed-payment-date');assert.equal(excelEvents.length,24);
assert.throws(()=>parseDividendCsv('Ex-Date,Dividend\n2026-02-30,0.12'),/日期无效/);
assert.throws(()=>parseDividendCsv('Ex-Date,Dividend\n2026-01-01,0.12\n2026-01-01,0.12'),/重复股息/);
console.log('PASS CSV validation, Kuala Lumpur calendar dates, duplicate rejection, change classification, immutable candidate snapshot, manual-price provenance and missing-day rejection');
console.log('PASS explicit snapshot commit, storage failure rollback, post-commit failure rollback, and previous snapshot restoration');
console.log('PASS dividend dates stay distinct, payment-date confirmation is mandatory, suspected duplicates require explicit approval, provenance survives, and all 24 Excel events remain unchanged');

const weekend=buildPriceSnapshot([{date:'2026-01-02',close:9.12}],parsePriceCsv('Date,Close\n2026-01-05,9.3'),['2026-01-05']);
assert.deepEqual(weekend.rows.map(x=>[x.date,x.close]),[['2026-01-02',9.12],['2026-01-03',9.12],['2026-01-04',9.12],['2026-01-05',9.3]]);
assert.equal(weekend.rows[1].carryForwardFrom,'2026-01-02');
assert.throws(()=>buildPriceSnapshot([{date:'2026-01-02',close:9.12}],parsePriceCsv('Date,Close\n2026-01-06,9.3'),['2026-01-06']),/未核实的休市日 2026-01-05/);

// 4,999 weekday records fit the raw limit, but calendar-day carry-forward must still enforce 5,000.
const weekdayRows=[];
for(let day=Date.parse('2020-01-01T00:00:00Z');weekdayRows.length<4999;day+=86400000){
  const weekday=new Date(day).getUTCDay();
  if(weekday!==0&&weekday!==6)weekdayRows.push({date:new Date(day).toISOString().slice(0,10),close:10});
}
assert.throws(()=>buildPriceSnapshot(weekdayRows,[],[]),/补齐周末后的完整行情快照超过 5,000/);
console.log('PASS expanded calendar-day snapshot limit is enforced after weekend carry-forward');
