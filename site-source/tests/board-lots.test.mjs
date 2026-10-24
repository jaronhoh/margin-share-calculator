import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runBacktest} from '../src/engine.mjs';
import {defaultDividends} from '../dist/dividend-events.mjs';
const base={ownShares:11400,financedShares:17100,startPrice:9.17,annualRate:.05,targetLsr:.6,refinanceTrigger:.58,marginCallLsr:.7,forceSellLsr:null,callStrategy:'cash',safeGap:.001,feeRate:0,lotSize:100};
const one=(c,price)=>runBacktest({...base,annualRate:0,...c},[{date:'2026-01-02',price,dividendPerShare:0}]).rows[0];
assert.throws(()=>one({lotSize:1},9.17),/100/);assert.throws(()=>one({lotSize:200},9.17),/100/);
const small=one({ownShares:110,financedShares:100,startPrice:10},10);assert.equal(small.refinanceShares,0);
const buy=one({ownShares:1000,financedShares:1000,startPrice:10},11);assert.equal(buy.refinanceShares,700);assert(buy.lsr<=.6);assert((buy.loan+1100)/(buy.marketValue+1100)>.6);
const sell=one({ownShares:3000,financedShares:7000,startPrice:10,callStrategy:'sell'},8);assert.equal(sell.soldShares,5900);assert(sell.lsr<=.699);assert((sell.loan+800)/(sell.marketValue+800)>.699);
const odd=one({ownShares:30,financedShares:69,startPrice:10,callStrategy:'sell'},8);assert.equal(odd.soldShares,0);assert.match(odd.events,/整手不足/);
const priced=JSON.parse(fs.readFileSync(new URL('../dist/maybank-prices.json',import.meta.url)));const events=new Map(defaultDividends().map(x=>[x.date,x.perShare]));const market=priced.map(r=>({date:r.date,price:r.close,dividendPerShare:events.get(r.date)||0,tradeAllowed:![0,6].includes(new Date(r.date+'T00:00:00Z').getUTCDay())}));
for(const callStrategy of ['cash','sell']){const r=runBacktest({...base,callStrategy},market);assert.equal(r.rows.length,4314);for(const row of r.rows){assert.equal(row.soldShares%100,0);assert.equal(row.refinanceShares%100,0);assert(row.soldShares>=0&&row.refinanceShares>=0);assert.equal(row.shares,row.cashShares+row.financedShares);assert.equal(row.financedBuyShares,row.refinanceShares);assert.equal(row.cashBuyShares%100,0);if(callStrategy==='sell')assert.equal(row.cashBuyShares,0);assert.equal(row.soldFinancedShares,row.soldShares);assert.equal(row.soldCashShares,0);assert(Number.isFinite(row.loan));}assert(r.rows.some(x=>x.refinanceShares>0));if(callStrategy==='cash')assert(r.rows.some(x=>x.cashBuyShares>0));if(callStrategy==='sell')assert(r.rows.some(x=>x.soldShares>0));console.log(`PASS ${callStrategy}: 4314 rows, all trades in 100-share lots, holdings classification invariant, 58% trigger; buy days ${r.rows.filter(x=>x.refinanceShares>0).length}, sell days ${r.rows.filter(x=>x.soldShares>0).length}`);}
console.log('PASS lot validation, sub-lot buy, minimal rounded buy/sell, insufficient odd-lot holdings');
