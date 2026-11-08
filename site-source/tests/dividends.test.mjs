import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULT_DIVIDENDS,DIVIDEND_SOURCE} from '../dist/maybank-dividends.mjs';
import {defaultDividends,defaultPaymentDateApprovals,mergeDefaultPaymentDateApprovals,MAYBANK_DIVIDEND_SOURCE_URL,normalizeDividend,validateDividends} from '../dist/dividend-events.mjs';
import {runBacktest} from '../dist/engine.mjs';
const extracted=JSON.parse(fs.readFileSync(process.argv[2]??new URL('./fixtures/table1.json',import.meta.url),'utf8'));
assert.deepEqual(DEFAULT_DIVIDENDS,extracted.events);
assert.deepEqual(DIVIDEND_SOURCE,extracted.metadata);
assert.equal(DEFAULT_DIVIDENDS.length,24);assert.equal(DEFAULT_DIVIDENDS.reduce((n,e)=>n+Math.round(e.perShare*100),0),699);
assert.equal(new Set(DEFAULT_DIVIDENDS.map(e=>e.date)).size,24);
assert.deepEqual(DEFAULT_DIVIDENDS.map(x=>x.sourceRow),Array.from({length:24},(_,i)=>i+3));
assert.equal(DEFAULT_DIVIDENDS.at(-1).date,'2015-05-26');assert.equal(DEFAULT_DIVIDENDS[0].date,'2026-10-22');
validateDividends(DEFAULT_DIVIDENDS);
const suppliedDates=[
 ['2026-09-23','2026-10-22'],['2026-03-12','2026-03-26'],['2025-09-11','2025-09-26'],['2025-03-12','2025-03-26'],
 ['2024-09-11','2024-09-26'],['2024-03-13','2024-03-26'],['2023-09-14','2023-09-27'],['2023-03-13','2023-03-24'],
 ['2022-09-19','2022-10-19'],['2022-03-16','2022-04-14'],['2021-09-22','2021-10-21'],['2021-05-28','2021-06-28'],
 ['2020-12-17','2021-01-15'],['2020-04-10','2020-05-06'],['2019-09-18','2019-10-02'],['2019-05-07','2019-06-07'],
 ['2018-09-28','2018-10-30'],['2018-06-05','2018-07-06'],['2017-09-29','2017-11-01'],['2017-05-04','2017-06-06'],
 ['2016-09-23','2016-10-25'],['2016-05-04','2016-06-03'],['2015-10-08','2015-11-11'],['2015-04-23','2015-05-26']
];
const dateApprovals=defaultPaymentDateApprovals();
assert.equal(dateApprovals.length,24);
assert.equal(new Set(dateApprovals.map(x=>x.targetSourceRow)).size,24);
for(const [i,approval] of dateApprovals.entries()){
 assert.deepEqual([approval.exDate,approval.paymentDate],[...suppliedDates[i]]);
 assert.equal(approval.paymentDate,DEFAULT_DIVIDENDS[i].date);
 assert.equal(approval.perShare,DEFAULT_DIVIDENDS[i].perShare);
 assert.equal(approval.sourceUrl,MAYBANK_DIVIDEND_SOURCE_URL);
 assert.equal(approval.approvalMode,'user-provided-table');
}
const protectedManual={...dateApprovals[0],paymentDate:'2026-10-23',approvalMode:'user-edited-payment-date'};
assert.equal(mergeDefaultPaymentDateApprovals(DEFAULT_DIVIDENDS,[protectedManual],'1155.KL').find(x=>x.targetSourceRow===3).paymentDate,'2026-10-23','existing manual date is never replaced');
assert.equal(mergeDefaultPaymentDateApprovals(DEFAULT_DIVIDENDS,[],'1066.KL').length,0,'MAYBANK dates never apply to another ticker');
const modified=normalizeDividend({...DEFAULT_DIVIDENDS[0],perShare:.4});assert.equal(modified.source,'excel-edited');assert.equal(modified.originalPerShare,.31);
assert.equal(normalizeDividend({...modified,perShare:.31}).source,'excel-table1');
assert.equal(normalizeDividend({date:'2026-10-22',perShare:.31}).source,'manual');
const confirmed={date:'2021-07-20',paymentDate:'2021-07-20',exDate:'2021-06-28',recordDate:'2021-06-29',perShare:.39,source:'user-dividend-csv-confirmed',sourceFile:'verified.csv',sourceRow:2,dateType:'confirmed-payment-date',duplicateConfirmed:true};
assert.deepEqual(normalizeDividend(JSON.parse(JSON.stringify(confirmed))),confirmed);
const copy=defaultDividends();copy[0].perShare=1;assert.equal(defaultDividends()[0].perShare,.31);
assert.deepEqual(JSON.parse(JSON.stringify(defaultDividends())).map(normalizeDividend),defaultDividends());
assert.throws(()=>validateDividends([{date:'2026-02-30',perShare:.3}]));
const eventMap=new Map(DEFAULT_DIVIDENDS.map(e=>[e.date,e.perShare]));
const market=[];for(let d=new Date('2015-01-01T00:00:00Z');d<=new Date('2026-10-22T00:00:00Z');d.setUTCDate(d.getUTCDate()+1)){const date=d.toISOString().slice(0,10);market.push({date,price:10,dividendPerShare:eventMap.get(date)??0});}
const r=runBacktest({ownShares:2000,financedShares:18000,startPrice:10,annualRate:0,targetLsr:.6,refinanceTrigger:0,marginCallLsr:.99,forceSellLsr:null,callStrategy:'cash',safeGap:.001,feeRate:0,lotSize:100},market);
assert.equal(r.rows.filter(x=>x.dividend>0).length,24);
assert.ok(Math.abs(r.summary.cumulativeDividend-139800)<1e-8);
for(const e of DEFAULT_DIVIDENDS)assert.equal(r.rows.find(r=>r.date===e.date).dividend,20000*e.perShare);
console.log('PASS original Table1 remains intact; 24 Ex-Date/Payment Date defaults match user data, preserve manual edits, and remain MAYBANK-only');
