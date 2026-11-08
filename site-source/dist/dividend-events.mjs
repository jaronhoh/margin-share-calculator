import {DEFAULT_DIVIDENDS} from './maybank-dividends.mjs';
export const defaultDividends = () => DEFAULT_DIVIDENDS.map(x=>({...x}));
const MAYBANK_PAYMENT_DATES = [
  ['2026-09-23','2026-10-22'],['2026-03-12','2026-03-26'],['2025-09-11','2025-09-26'],['2025-03-12','2025-03-26'],
  ['2024-09-11','2024-09-26'],['2024-03-13','2024-03-26'],['2023-09-14','2023-09-27'],['2023-03-13','2023-03-24'],
  ['2022-09-19','2022-10-19'],['2022-03-16','2022-04-14'],['2021-09-22','2021-10-21'],['2021-05-28','2021-06-28'],
  ['2020-12-17','2021-01-15'],['2020-04-10','2020-05-06'],['2019-09-18','2019-10-02'],['2019-05-07','2019-06-07'],
  ['2018-09-28','2018-10-30'],['2018-06-05','2018-07-06'],['2017-09-29','2017-11-01'],['2017-05-04','2017-06-06'],
  ['2016-09-23','2016-10-25'],['2016-05-04','2016-06-03'],['2015-10-08','2015-11-11'],['2015-04-23','2015-05-26']
];
export const MAYBANK_DIVIDEND_SOURCE_URL='https://www.klsescreener.com/v2/stocks/view/1155';
export function defaultPaymentDateApprovals(events=DEFAULT_DIVIDENDS){
  return events.flatMap(event=>{
    const dates=MAYBANK_PAYMENT_DATES[event.sourceRow-3];
    if(!dates||event.source!=='excel-table1'||event.date!==event.originalDate||event.perShare!==event.originalPerShare)return [];
    const [exDate,paymentDate]=dates;
    return [{ticker:'1155.KL',source:'klsescreener-user-approved',sourceUrl:MAYBANK_DIVIDEND_SOURCE_URL,paymentDateApproved:true,dateType:'third-party-payment-date-user-approved',approvalMode:'user-provided-table',date:paymentDate,paymentDate,exDate,perShare:event.perShare,targetSourceRow:event.sourceRow,targetDateAtApproval:event.date,targetAmountAtApproval:event.perShare}];
  });
}
export function mergeDefaultPaymentDateApprovals(events,approvals,ticker){
  if(ticker!=='1155.KL')return approvals;
  const defaults=defaultPaymentDateApprovals(events);
  return [...approvals,...defaults.filter(item=>!approvals.some(existing=>existing.ticker===ticker&&(existing.targetSourceRow===item.targetSourceRow||existing.exDate===item.exDate)))];
}
export function normalizeDividend(x) {
  const date=String(x.date??''), perShare=Number(x.perShare);
  const original=DEFAULT_DIVIDENDS.find(e=>e.sourceRow===x.sourceRow && e.originalDate===x.originalDate && e.originalPerShare===Number(x.originalPerShare));
  return original ? {...original,...x,date,perShare,source:date===original.date&&perShare===original.perShare?'excel-table1':'excel-edited'} : {...x,date,perShare,source:x.source??'manual',dateType:x.dateType??'unverified-payment-date'};
}
export function validateDividends(events){
  if(events.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Date.parse(x.date+'T00:00:00Z'))||new Date(x.date+'T00:00:00Z').toISOString().slice(0,10)!==x.date||!Number.isFinite(x.perShare)||x.perShare<0))throw new Error('请检查股息来源日期与非负每股金额。');
}
