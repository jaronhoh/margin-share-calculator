// CR-005: no bundled spreadsheet dividends or stock-specific payment-date defaults.
// Historical dividends are supplied only by user import/edit or on-demand providers.
export const defaultDividends = () => [];
export const defaultPaymentDateApprovals = () => [];
export const mergeDefaultPaymentDateApprovals = (_events,approvals) => approvals;
export function normalizeDividend(x) {
  return {...x,date:String(x.date??''),perShare:Number(x.perShare),source:x.source??'manual',dateType:x.dateType??'unverified-payment-date'};
}
export function validateDividends(events){
  if(events.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Date.parse(x.date+'T00:00:00Z'))||new Date(x.date+'T00:00:00Z').toISOString().slice(0,10)!==x.date||!Number.isFinite(x.perShare)||x.perShare<0))throw new Error('请检查股息来源日期与非负每股金额。');
}
