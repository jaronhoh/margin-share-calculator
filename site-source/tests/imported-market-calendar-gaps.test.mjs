import assert from 'node:assert/strict';
import {validateImportedConfig} from '../dist/config.mjs';
import {setYahooMarketCalendar} from '../dist/market-calendar.mjs';

const baseInputs={
  startDate:'2022-12-30',
  endDate:'2023-01-03',
  cashBudget:1000,
  ownShares:100,
  financedShares:100,
  startPrice:10,
  annualRate:5,
  targetLsr:60,
  refinanceTrigger:58,
  marginCallLsr:70,
  forceSellLsr:80,
  callStrategy:'cash',
  safeGap:0.1,
  feeRate:0.1,
  brokerageMinimum:8,
  stampDutyRate:0.1,
  clearingFeeRate:0.03,
  sstRate:0,
  lotSize:100,
};

function configWithPrices(rows){
  return{
    schema:'margin-share-config/v1',
    inputs:{...baseInputs},
    stockCode:'1155.KL',
    selectedStockCode:'1155.KL',
    allocationMode:'legacy-shares',
    feeModel:'schedule',
    chargeInitialFees:false,
    marketData:{
      type:'daily-close',
      unit:'MYR/share',
      rows,
    },
    marketDataSource:{
      type:'user-csv-confirmed',
      ticker:'1155.KL',
      fileName:'prices.csv',
      importedAt:'2026-11-09T00:00:00.000Z',
      startDate:rows[0].date,
      endDate:rows.at(-1).date,
      rowCount:rows.length,
      manualDates:[],
    },
    marketOverrides:{
      dividendEvents:[],
      manualPriceDates:[],
      paymentDateApprovals:[],
    },
  };
}

const calendarGap=configWithPrices([
  {date:'2022-12-30',close:10},
  {date:'2023-01-03',close:10.5},
]);
const imported=validateImportedConfig(calendarGap,[],{});
assert.deepEqual(imported.prices.map(row=>row.date),[
  '2022-12-30',
  '2022-12-31',
  '2023-01-01',
  '2023-01-02',
  '2023-01-03',
]);
assert.deepEqual(imported.prices.slice(1,4).map(({date,close,carryForward,carryForwardFrom,reason})=>({
  date,close,carryForward,carryForwardFrom,reason,
})),[
  {date:'2022-12-31',close:10,carryForward:true,carryForwardFrom:'2022-12-30',reason:'weekend'},
  {date:'2023-01-01',close:10,carryForward:true,carryForwardFrom:'2022-12-31',reason:'weekend'},
  {date:'2023-01-02',close:10,carryForward:true,carryForwardFrom:'2023-01-01',reason:'confirmed-market-holiday'},
]);
assert.equal(imported.marketDataSource.rowCount,5,'normalized metadata must match the expanded snapshot');

const unconfirmedWeekdayGap=configWithPrices([
  {date:'2023-01-03',close:10},
  {date:'2023-01-05',close:10.5},
]);
unconfirmedWeekdayGap.inputs.startDate='2023-01-03';
unconfirmedWeekdayGap.inputs.endDate='2023-01-05';
unconfirmedWeekdayGap.marketDataSource.startDate='2023-01-03';
unconfirmedWeekdayGap.marketDataSource.endDate='2023-01-05';
assert.throws(
  ()=>validateImportedConfig(unconfirmedWeekdayGap,[],{}),
  /日期缺少交易日或未核实的休市日 2023-01-04/,
);


const trustedYahooCalendar={
  sourceTicker:'^KLSE',
  source:'yahoo-chart-market-calendar',
  startDate:'2023-02-03',
  endDate:'2023-02-07',
  observedTradingDates:['2023-02-03','2023-02-07'],
  closedDates:['2023-02-06'],
  supplementalObservedDates:[],
};
const yahooHolidayGap=configWithPrices([
  {date:'2023-02-03',close:10},
  {date:'2023-02-07',close:10.5},
]);
yahooHolidayGap.inputs.startDate='2023-02-03';
yahooHolidayGap.inputs.endDate='2023-02-07';
yahooHolidayGap.marketDataSource={
  ...yahooHolidayGap.marketDataSource,
  type:'yahoo-chart-confirmed',
  marketCalendar:trustedYahooCalendar,
};
setYahooMarketCalendar(trustedYahooCalendar);
const yahooHolidayImported=validateImportedConfig(yahooHolidayGap,[],{});
const yahooCarry=yahooHolidayImported.prices.find(row=>row.date==='2023-02-06');
assert.deepEqual(
  {date:yahooCarry.date,close:yahooCarry.close,carryForward:yahooCarry.carryForward,carryForwardFrom:yahooCarry.carryForwardFrom,reason:yahooCarry.reason,source:yahooCarry.source,sourceUrl:yahooCarry.sourceUrl},
  {date:'2023-02-06',close:10,carryForward:true,carryForwardFrom:'2023-02-03',reason:'yahoo-market-holiday',source:'Yahoo Finance ^KLSE',sourceUrl:'https://finance.yahoo.com/quote/%5EKLSE/history/'},
);
assert.equal(yahooHolidayImported.marketDataSource.rowCount,5,'Yahoo holiday fill must update rowCount');
assert.equal(yahooHolidayImported.marketDataSource.marketCalendar.closedDates[0],'2023-02-06','verified calendar metadata must remain attached');

setYahooMarketCalendar(null);
const fabricatedYahooGap=structuredClone(yahooHolidayGap);
fabricatedYahooGap.marketDataSource.marketCalendar={...trustedYahooCalendar,observedTradingDates:['2023-02-03','2023-02-07'],closedDates:['2023-02-06']};
assert.throws(
  ()=>validateImportedConfig(fabricatedYahooGap,[],{}),
  /日期缺少交易日或未核实的休市日 2023-02-06/,
  'an imported Yahoo closure declaration must not establish runtime trust',
);
assert.equal(
  fabricatedYahooGap.marketDataSource.marketCalendar.closedDates[0],
  '2023-02-06',
  'the attacker-supplied closure is present but must remain untrusted',
);

const unsortedPrices=configWithPrices([
  {date:'2023-01-05',close:10},
  {date:'2023-01-03',close:10.5},
]);
unsortedPrices.inputs.startDate='2023-01-05';
unsortedPrices.inputs.endDate='2023-01-03';
unsortedPrices.marketDataSource.startDate='2023-01-05';
unsortedPrices.marketDataSource.endDate='2023-01-03';
assert.throws(()=>validateImportedConfig(unsortedPrices,[],{}),/JSON 收盘价日期范围无效/);

const duplicateDates=configWithPrices([
  {date:'2023-01-03',close:10},
  {date:'2023-01-03',close:10.5},
]);
duplicateDates.inputs.startDate='2023-01-03';
duplicateDates.inputs.endDate='2023-01-03';
duplicateDates.marketDataSource.startDate='2023-01-03';
duplicateDates.marketDataSource.endDate='2023-01-03';
assert.throws(()=>validateImportedConfig(duplicateDates,[],{}),/日期必须严格递增且不得重复/);

const outOfOrderDates=configWithPrices([
  {date:'2023-01-05',close:10},
  {date:'2023-01-03',close:10.5},
]);
outOfOrderDates.inputs.startDate='2023-01-05';
outOfOrderDates.inputs.endDate='2023-01-03';
outOfOrderDates.marketDataSource.startDate='2023-01-05';
outOfOrderDates.marketDataSource.endDate='2023-01-03';
assert.throws(()=>validateImportedConfig(outOfOrderDates,[],{}),/日期必须严格递增且不得重复/);

setYahooMarketCalendar(null);
console.log('PASS weekend, Bursa and independently verified Yahoo fills retain provenance and rowCount; fabricated and unconfirmed weekday gaps plus duplicate/out-of-order rows are rejected.');

