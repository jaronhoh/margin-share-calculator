import assert from 'node:assert/strict';
import {clearSnapshot,loadSnapshot,saveSnapshot} from '../dist/persistence.mjs';

const entries=new Map(),storage={
  getItem:key=>entries.get(key)??null,
  setItem:(key,value)=>entries.set(key,String(value)),
  removeItem:key=>entries.delete(key),
};
const key='margin-share-market-snapshot/v1';
const complete={
  schema:'margin-share-config/v1',
  inputs:{startDate:'2026-01-01',endDate:'2026-01-31',cashBudget:50000,annualRate:5,callStrategy:'cash'},
  marketData:{type:'daily-close',unit:'MYR/share',rows:[{date:'2026-01-01',close:9.17}]},
  marketDataSource:{type:'user-csv-confirmed',fileName:'prices.csv',manualDates:['2026-01-01']},
  marketOverrides:{dividendEvents:[{date:'2026-01-01',perShare:.1,source:'user-dividend-csv-confirmed',sourceFile:'dividends.csv'}],manualPriceDates:['2026-01-01']},
  uiPreferences:{theme:'dark',priceVisible:false,ledgerFilter:'monthEnd'},
};
const valid=snapshot=>assert.equal(snapshot.schema,'margin-share-config/v1');

saveSnapshot(storage,key,complete,valid);
// A new page load uses the same browser storage and restores every saved field.
assert.deepEqual(loadSnapshot(storage,key,valid),complete);

const before=storage.getItem(key);
assert.throws(()=>saveSnapshot(storage,key,{...complete,schema:'bad'},valid));
assert.equal(storage.getItem(key),before,'invalid settings leave the previous good snapshot intact');
const quotaStorage={...storage,setItem(){throw new Error('quota exceeded');}};
assert.throws(()=>saveSnapshot(quotaStorage,key,{...complete,inputs:{...complete.inputs,annualRate:6}},valid),/quota exceeded/);
assert.equal(storage.getItem(key),before,'failed writes do not change the stored state');

clearSnapshot(storage,key);
assert.equal(loadSnapshot(storage,key,valid),null,'restore defaults clears the saved state');
assert.throws(()=>{
  storage.setItem(key,'{bad json');
  loadSnapshot(storage,key,valid);
},/JSON/);

console.log('PASS complete parameter, market, dividend provenance and UI preference snapshot survives reload; invalid data, quota failure, corruption and clear behavior are handled');
