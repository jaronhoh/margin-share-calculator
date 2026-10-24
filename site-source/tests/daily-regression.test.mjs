import assert from 'node:assert/strict';
import {runBacktest} from '../dist/engine.mjs';
const market=[];
for(let d=new Date('2015-01-01T00:00:00Z');d<=new Date('2025-12-31T00:00:00Z');d.setUTCDate(d.getUTCDate()+1))market.push({date:d.toISOString().slice(0,10),price:10,dividendPerShare:d.getUTCDate()===1&&d.getUTCMonth()===5?.01:0,tradeAllowed:d.getUTCDay()!==0&&d.getUTCDay()!==6});
let checks=0;
for(const callStrategy of ['cash','sell']){
 const c={ownShares:4000,financedShares:6000,startPrice:10,annualRate:.02,targetLsr:.6,refinanceTrigger:0,marginCallLsr:.99,forceSellLsr:null,callStrategy,safeGap:.001,feeRate:0,lotSize:100};
 const result=runBacktest(c,market);assert.equal(result.rows.length,4018);assert.equal(result.blocked,null);
 // Independent monthly oracle: opening principal, include today's accrual in the closing month's posting.
 let principal=60000,pending=0,total=0,posted=0;
 for(let i=0;i<market.length;i++){
  const day=market[i],row=result.rows[i];
  const interest=principal*.02/365;pending+=interest;total+=interest;
  const cap=new Date(Date.parse(day.date+'T00:00:00Z')+86400000).getUTCDate()===1?pending:0;
  if(cap){principal+=cap;posted+=cap;pending=0;}
  const after=principal;principal-=10000*day.dividendPerShare;
  for(const [actual,expected] of [[row.capitalizedInterest,cap],[row.loanAfterCapitalization,after],[row.dailyInterest,interest],[row.accruedInterest,pending],[row.loan,principal]]){assert.ok(Math.abs(actual-expected)<1e-6,`${callStrategy} ${day.date}: ${actual} vs ${expected}`);checks++;}
  assert.ok(Math.abs(total-posted-pending)<1e-6);checks++;
 }
 assert.equal(result.rows.filter(r=>r.capitalizedInterest>0).length,132);
 console.log(`PASS ${callStrategy}: 4,018 daily rows, 132 month-end postings; independent monthly oracle`);
}
console.log(`PASS ${checks} numeric checks; synthetic fixture, not Excel-cache parity`);
