import assert from 'node:assert/strict';
import {validateImportedConfig} from '../dist/config.mjs';

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

console.log('PASS verified closed-day gaps are carried forward with provenance; unconfirmed weekday gaps remain rejected.');
