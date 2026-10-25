import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runBacktest,transactionFees,calculateInitialAllocation} from '../dist/engine.mjs';
import {validateImportedConfig} from '../dist/config.mjs';
import {defaultDividends} from '../dist/dividend-events.mjs';
import {classifyMarketDate} from '../dist/market-calendar.mjs';
const base={ownShares:1000,financedShares:1500,startPrice:10,annualRate:0,targetLsr:.6,refinanceTrigger:.58,marginCallLsr:.7,forceSellLsr:null,callStrategy:'cash',safeGap:.001,feeRate:0,lotSize:100};
const fees={feeRate:.001,brokerageMinimum:8,stampDutyRate:.001,clearingFeeRate:.0003,sstRate:0};
const one=(config,price,dividendPerShare=0)=>runBacktest({...base,...config},[{date:'2026-01-02',price,dividendPerShare}]);
assert.equal(one({},10,6).rows[0].refinanceShares,3700);
assert.equal(transactionFees({...fees,feeRate:0},10000).brokerage,8);
assert.equal(transactionFees({...fees,stampDutyRate:.002},1500).stampDuty,4);
for(const cashBudget of [1e20,1e308])assert.throws(()=>calculateInitialAllocation({cashBudget,startPrice:9.17,targetLsr:.6,feeRate:0}),/安全计算范围/);
assert.throws(()=>one({},1e308),/安全计算范围/);
const badSale=one({...fees,ownShares:100,financedShares:100,startPrice:.015,callStrategy:'sell',forceSellLsr:.8},.01);
assert(badSale.blocked);assert.equal(badSale.rows[0].soldShares,0);assert.equal(badSale.rows[0].loan,1.5);
const excess=one({ownShares:0,financedShares:100,callStrategy:'sell'},6,5);assert.equal(excess.summary.saleCash,100);assert.equal(excess.rows[0].saleDebtPayment,500);assert.equal(excess.rows[0].saleCashBalance,100);
assert.throws(()=>one({safeGap:.2},10),/安全余量/);
const rounded=one({ownShares:100,financedShares:200,startPrice:10},9);assert.equal(rounded.rows[0].cashBuyShares,100);assert.equal(rounded.rows[0].refinanceShares,0);
const prices=JSON.parse(fs.readFileSync(new URL('../dist/maybank-prices.json',import.meta.url)));const events=defaultDividends();
const inputs={startDate:'2015-01-01',endDate:'2026-10-23',cashBudget:105139.75,ownShares:11400,financedShares:17100,startPrice:9.17,annualRate:5,targetLsr:60,refinanceTrigger:58,marginCallLsr:70,forceSellLsr:80,callStrategy:'cash',safeGap:.1,feeRate:.1,brokerageMinimum:8,stampDutyRate:.1,clearingFeeRate:.03,sstRate:0,lotSize:100};
const data={schema:'margin-share-config/v1',inputs,stockCode:'1155.KL',marketOverrides:{dividendEvents:events}};
let candidate=validateImportedConfig(structuredClone(data),prices,inputs);assert.deepEqual(candidate.inputs,inputs);assert.deepEqual(candidate.events,events);
const csvSnapshot=structuredClone(data);csvSnapshot.marketDataSource={type:'user-csv-confirmed',ticker:'1155.KL',startDate:prices[0].date,endDate:prices.at(-1).date,rowCount:prices.length,fileName:'prices.csv',importedAt:'2026-10-25T00:00:00.000Z',manualDates:['2015-01-01']};csvSnapshot.marketData={type:'daily-close',unit:'MYR/share',rows:prices.map(({date,close})=>({date,close}))};csvSnapshot.marketOverrides.manualPriceDates=['2015-01-01'];candidate=validateImportedConfig(csvSnapshot,prices,inputs);assert.deepEqual(candidate.manualPriceDates,['2015-01-01']);assert.equal(candidate.marketDataSource.fileName,'prices.csv');const badManual=structuredClone(csvSnapshot);badManual.marketOverrides.manualPriceDates=['1900-01-01'];badManual.marketDataSource.manualDates=['1900-01-01'];assert.throws(()=>validateImportedConfig(badManual,prices,inputs),/人工修正价格日期无效/);
const yahooSnapshot=structuredClone(csvSnapshot);yahooSnapshot.marketDataSource={...csvSnapshot.marketDataSource,type:'yahoo-chart-confirmed',fileName:'Yahoo Finance Chart · 1155.KL',providerEvents:{dividends:[{exDate:'2021-05-28',perShare:.385,paymentDate:'',dateType:'ex-date-only'}],splits:[]}};candidate=validateImportedConfig(yahooSnapshot,prices,inputs);assert.equal(candidate.marketDataSource.type,'yahoo-chart-confirmed');assert.equal(candidate.marketDataSource.providerEvents.dividends[0].paymentDate,'');
let wrong=structuredClone(data);wrong.inputs.startDate='2015-01-02';assert.throws(()=>validateImportedConfig(wrong,prices,inputs),/价格与收盘价/);
let legacy=structuredClone(data);for(const key of ['cashBudget','brokerageMinimum','stampDutyRate','clearingFeeRate','sstRate'])delete legacy.inputs[key];legacy.inputs.ownShares=1000;legacy.inputs.financedShares=1000;legacy.inputs.feeRate=1;
candidate=validateImportedConfig(legacy,prices,inputs);assert.equal(candidate.inputs.financedShares,1000);assert.equal(candidate.feeModel,'legacy-flat');assert.equal(candidate.chargeInitialFees,false);
const again=validateImportedConfig({...legacy,inputs:candidate.inputs,allocationMode:candidate.allocationMode,feeModel:candidate.feeModel,chargeInitialFees:candidate.chargeInitialFees},prices,inputs);assert.deepEqual(again.inputs,candidate.inputs);
let incomplete=structuredClone(data);delete incomplete.inputs.sstRate;assert.throws(()=>validateImportedConfig(incomplete,prices,inputs),/字段不完整/);
let enormous=structuredClone(data);enormous.inputs.cashBudget=1e308;assert.throws(()=>validateImportedConfig(enormous,prices,inputs),/安全计算范围/);
console.log('PASS P0 fee, safe range, zero-debt refinance, negative sale, cash surplus, call-day guard, JSON legacy and price-consistency regressions');
// Independent fee calculation and exhaustive lot enumeration, no product solver/fee helper.
const fee=n=>n<=0?0:Math.max(n*.001,8)+Math.min(n*.0003,1000)+Math.min(Math.ceil(n/1000),1000);
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,`${label}: ${a} vs ${b}`);let checks=0,conservation=0;
for(const costs of [false,true])for(const callStrategy of ['cash','sell']){
 const config={...base,ownShares:11400,financedShares:17100,startPrice:9.17,annualRate:.05,forceSellLsr:.8,callStrategy,...(costs?{...fees,chargeInitialFees:true}:{})};
 const market=prices.map(x=>({date:x.date,price:x.close,dividendPerShare:events.filter(e=>e.date===x.date).reduce((s,e)=>s+e.perShare,0),tradeAllowed:![0,6].includes(new Date(x.date).getUTCDay())}));const result=runBacktest(config,market);assert.equal(result.rows.length,4314);assert.equal(result.blocked,null);
 let loan=156807,shares=28500,cash=11400,financed=17100,pending=0,surplus=0;const initialCost=costs?fee(261345):0;const budget=104538+initialCost;let wealthBefore=budget,oldPrice=9.17;
 for(let i=0;i<market.length;i++){
  const day=market[i],r=result.rows[i],openingShares=shares,interest=loan*.05/365;pending+=interest;let cap=0;if(new Date(Date.parse(day.date)+86400000).getUTCDate()===1){cap=pending;loan+=cap;pending=0}
  const dividend=shares*day.dividendPerShare,paid=Math.min(loan,dividend);loan-=paid;surplus+=dividend-paid;let buy=0,sell=0,ref=0,topUp=0,feeToday=i===0?initialCost:0,value=shares*day.price;
  if(day.tradeAllowed&&loan/value>=.7){if(callStrategy==='cash'){buy=Math.ceil((loan/.699-value)/day.price/100)*100;topUp=buy*day.price+(costs?fee(buy*day.price):0);cash+=buy;shares+=buy;feeToday+=costs?fee(buy*day.price):0;}else{let q;for(q=0;q<=financed;q+=100){const n=q*day.price;if(value-n>0&&Math.max(0,loan-n+(costs?fee(n):0))/(value-n)<=.699)break;}sell=Math.min(q,financed);loan-=sell*day.price-(costs?fee(sell*day.price):0);shares-=sell;financed-=sell;feeToday+=costs?fee(sell*day.price):0;}value=shares*day.price;}
  if(day.tradeAllowed&&!buy&&!sell&&loan/value<=.58){while((loan+(ref+100)*day.price+(costs?fee((ref+100)*day.price):0))/(value+(ref+100)*day.price)<=.6+1e-12)ref+=100;loan+=ref*day.price+(costs?fee(ref*day.price):0);financed+=ref;shares+=ref;feeToday+=costs?fee(ref*day.price):0;}
  for(const [a,b] of [[r.dailyInterest,interest],[r.capitalizedInterest,cap],[r.accruedInterest,pending],[r.dividend,dividend],[r.debtPayment,paid],[r.loan,loan],[r.shares,shares],[r.cashShares,cash],[r.financedShares,financed],[r.marketValue,shares*day.price],[r.netWorth,shares*day.price-loan],[r.fees,feeToday],[r.cashBuyShares,buy],[r.soldShares,sell],[r.refinanceShares,ref],[r.lsr,loan/(shares*day.price)]]){near(a,b,day.date);checks++;}
  const wealth=r.netWorth+surplus+r.saleCashBalance;near(wealth,wealthBefore+openingShares*(day.price-oldPrice)+dividend-cap-feeToday+topUp,day.date+' conservation');conservation++;wealthBefore=wealth;oldPrice=day.price;
 }
 console.log(`PASS independent historical oracle: fees=${costs} ${callStrategy}, 4314 days`);
}
console.log(`PASS ${checks} independent numerical checks and ${conservation} wealth-conservation checks`);


