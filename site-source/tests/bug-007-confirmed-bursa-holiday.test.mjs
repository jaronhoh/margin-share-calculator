import assert from 'node:assert/strict';
import {validateImportedConfig} from '../dist/config.mjs';
import {setYahooMarketCalendar} from '../dist/market-calendar.mjs';

const inputs={startDate:'2025-02-14',endDate:'2025-02-14',cashBudget:1000,ownShares:100,financedShares:100,startPrice:10,annualRate:5,targetLsr:60,refinanceTrigger:58,marginCallLsr:70,forceSellLsr:80,callStrategy:'cash',safeGap:0.1,feeRate:0.1,brokerageMinimum:8,stampDutyRate:0.1,clearingFeeRate:0.03,sstRate:0,lotSize:100};
const holiday={date:'2025-02-11',status:'confirmed-market-holiday',source:'bursa-thaipusam-2025',url:'https://www.bursamalaysia.com/sites/5d809dcf39fba22790cad230/assets/67b52f98e6414ab7cd5317d2/POA-BMD_Palm_Market_Weekly_Summary_3-7_February_2025.pdf'};
const data={schema:'margin-share-config/v1',inputs,stockCode:'1155.KL',selectedStockCode:'1155.KL',allocationMode:'legacy-shares',feeModel:'schedule',chargeInitialFees:false,marketData:{type:'daily-close',unit:'MYR/share',rows:[{date:'2025-02-14',close:10},{date:'2025-02-14',close:10.5}]},marketDataSource:{type:'user-csv-confirmed',ticker:'1155.KL',fileName:'prices.csv',importedAt:'2026-11-09T00:00:00.000Z',startDate:'2025-02-14',endDate:'2025-02-14',rowCount:2,manualDates:[]},marketOverrides:{dividendEvents:[],manualPriceDates:[],paymentDateApprovals:[]}};
const {MARKET_HOLIDAYS}=await import('../dist/market-calendar.mjs');
assert.equal(MARKET_HOLIDAYS.some(x=>x.date===holiday.date),true,'official holiday evidence is kept in the market calendar');
const result=validateImportedConfig(data,[],{});const filled=result.prices.find(x=>x.date==='2025-02-11');
assert.deepEqual({close:filled.close,carryForward:filled.carryForward,carryForwardFrom:filled.carryForwardFrom,reason:filled.reason,source:filled.source,sourceUrl:filled.sourceUrl},{close:10,carryForward:true,carryForwardFrom:'2025-02-14',reason:'confirmed-market-holiday',source:holiday.source,sourceUrl:holiday.url});
assert.equal(result.prices.length,3);assert.equal(result.marketDataSource.rowCount,3);
const forged=structuredClone(data);forged.marketDataSource.type='yahoo-chart-confirmed';forged.marketDataSource.marketCalendar={sourceTicker:'^KLSE',source:'yahoo-chart-market-calendar',startDate:'2025-02-14',endDate:'2025-02-14',observedTradingDates:['2025-02-14','2025-02-14'],closedDates:['2025-02-13'],supplementalObservedDates:[]};setYahooMarketCalendar(null);assert.throws(()=>validateImportedConfig(forged,[],{}),/日期缺少交易日或未核实的休市日 2025-02-13/);
console.log('PASS 2025-02-13 carries forward with Bursa source, while a fabricated Yahoo closure remains untrusted.');
