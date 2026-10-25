import {DEFAULT_DIVIDENDS} from './maybank-dividends.mjs';
export const defaultDividends = () => DEFAULT_DIVIDENDS.map(x=>({...x}));
export function normalizeDividend(x) {
  const date=String(x.date??''), perShare=Number(x.perShare);
  const original=DEFAULT_DIVIDENDS.find(e=>e.sourceRow===x.sourceRow && e.originalDate===x.originalDate && e.originalPerShare===Number(x.originalPerShare));
  return original ? {...original,...x,date,perShare,source:date===original.date&&perShare===original.perShare?'excel-table1':'excel-edited'} : {...x,date,perShare,source:x.source??'manual',dateType:x.dateType??'unverified-payment-date'};
}
export function validateDividends(events){
  if(events.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Date.parse(x.date+'T00:00:00Z'))||new Date(x.date+'T00:00:00Z').toISOString().slice(0,10)!==x.date||!Number.isFinite(x.perShare)||x.perShare<0))throw new Error('请检查股息来源日期与非负每股金额。');
}
