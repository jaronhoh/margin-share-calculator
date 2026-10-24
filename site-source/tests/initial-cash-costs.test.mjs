import assert from 'node:assert/strict';
import {calculateInitialAllocation,transactionFees,runBacktest} from '../src/engine.mjs';

const feeConfig={feeRate:.001,brokerageMinimum:8,stampDutyRate:.001,stampDutyCap:1000,clearingFeeRate:.0003,clearingFeeCap:1000,sstRate:0};
const fees=transactionFees(feeConfig,10000);
assert.equal(fees.brokerage,10);
assert.ok(Math.abs(fees.clearing-3)<1e-12);
assert.equal(fees.stampDuty,10);
assert.equal(fees.sst,0);
assert.equal(fees.total,23);
assert.equal(transactionFees({...feeConfig,sstRate:.08},10000).total,23.8);
assert.equal(transactionFees(feeConfig,10000.01).stampDuty,11);
assert.equal(transactionFees(feeConfig,10000000).stampDuty,1000);
assert.equal(transactionFees(feeConfig,10000000).clearing,1000);

const allocation=calculateInitialAllocation({cashBudget:105139.75,startPrice:9.17,targetLsr:.6,lotSize:100,...feeConfig});
assert.equal(allocation.ownShares,11400);
assert.equal(allocation.financedShares,17100);
assert.equal(allocation.totalShares,28500);
assert.ok(allocation.usedCash<=105139.75);
assert.ok(allocation.remainingCash<.01);
assert.equal(calculateInitialAllocation({cashBudget:900,startPrice:9.17,targetLsr:.6,lotSize:100,...feeConfig}).totalShares,0);

const config={ownShares:allocation.ownShares,financedShares:allocation.financedShares,startPrice:9.17,annualRate:0,targetLsr:.6,refinanceTrigger:.58,marginCallLsr:.7,forceSellLsr:null,callStrategy:'cash',safeGap:.001,...feeConfig,lotSize:100,chargeInitialFees:true};
const result=runBacktest(config,[{date:'2026-01-01',price:9.17,dividendPerShare:0}]);
assert.equal(result.rows[0].fees,allocation.estimatedBuyFees);
assert.equal(result.summary.cumulativeFees,allocation.estimatedBuyFees);
assert.match(result.rows[0].events,/初始建仓交易费/);
console.log('PASS Bursa fee schedule, caps, optional SST, initial cash allocation, full-lot rounding, and opening-trade fee accounting');
