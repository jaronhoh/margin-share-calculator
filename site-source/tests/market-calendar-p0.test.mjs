import assert from 'node:assert/strict';
import prices from '../dist/maybank-prices.json' with {type:'json'};
import {runBacktest} from '../dist/engine.mjs';
import {defaultDividends} from '../dist/dividend-events.mjs';
import {classifyMarketDate} from '../dist/market-calendar.mjs';
const events=defaultDividends();
const base={ownShares:11400,financedShares:17100,startPrice:9.17,annualRate:.05,targetLsr:.6,refinanceTrigger:.58,marginCallLsr:.7,forceSellLsr:.8,safeGap:.001,feeRate:.001,brokerageMinimum:8,stampDutyRate:.001,clearingFeeRate:.0003,sstRate:0,lotSize:100};
const oldTradingRule=prices.map(p=>({date:p.date,price:p.close,dividendPerShare:events.filter(x=>x.date===p.date).reduce((sum,x)=>sum+x.perShare,0),tradeAllowed:![0,6].includes(new Date(p.date+'T00:00:00Z').getUTCDay())}));
const confirmedCalendarRule=prices.map(p=>({...oldTradingRule.find(x=>x.date===p.date),tradeAllowed:classifyMarketDate(p.date,{hasObservedPrice:true}).tradeAllowed}));
assert.equal(oldTradingRule.length,4314);
for(const callStrategy of ['cash','sell']){
 const config={...base,callStrategy};const before=runBacktest(config,oldTradingRule),after=runBacktest(config,confirmedCalendarRule);
 assert.equal(before.rows.length,4314);assert.equal(after.rows.length,4314);
 for(let i=0;i<before.rows.length;i++)for(const key of ['shares','marketValue','loan','netWorth','lsr','dailyInterest','accruedInterest','capitalizedInterest','dividend','topUp','soldShares'])assert.ok(Math.abs((before.rows[i][key]??0)-(after.rows[i][key]??0))<1e-8,`${callStrategy} ${before.rows[i].date} ${key}`);
 assert.equal(before.summary.cumulativeInterest,after.summary.cumulativeInterest);
 assert.equal(before.summary.cumulativeDividend,after.summary.cumulativeDividend);
 console.log(`PASS ${callStrategy}: 4,314 calendar days unchanged across all P0 daily values under confirmed closures`);
}

