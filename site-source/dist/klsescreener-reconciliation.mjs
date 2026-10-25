// Reconcile Yahoo ex-date dividend events with KLSE Screener payment dates.
// Third-party data is a review candidate, not an official or approved payment.
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const ticker=s=>String(s||'').trim().toUpperCase();
const amount=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
export function reconcileKlsescreenerDividends(yahooEvents,klseEvents,{ticker:stock,amountTolerance=0.000001}={}){
 const symbol=ticker(stock);
 if(!/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(symbol))throw Error('股票代码无效。');
 if(!Array.isArray(yahooEvents)||!Array.isArray(klseEvents)||!Number.isFinite(amountTolerance)||amountTolerance<0||amountTolerance>0.001)throw Error('股息数据或金额容差无效。');
 const records=klseEvents.filter(x=>ticker(x.ticker)===symbol&&iso(x.exDate)&&iso(x.paymentDate)&&x.paymentDate>=x.exDate&&amount(x.perShare)&&x.source==='klsescreener-dividend-history');
 return yahooEvents.map(y=>{
  if(ticker(y.ticker||symbol)!==symbol||!iso(y.exDate)||!amount(y.perShare))throw Error('Yahoo 股息记录无效。');
  const sameDay=records.filter(x=>x.exDate===y.exDate);
  const exact=sameDay.filter(x=>Math.abs(x.perShare-y.perShare)<=amountTolerance);
  const dates=[...new Set(exact.map(x=>x.paymentDate))];
  const status=dates.length>1?'conflicting-payment-dates':dates.length===1?'third-party-match-pending-review':sameDay.length?'amount-mismatch':'no-matching-payment-date';
  return {...y,paymentDate:y.paymentDate||'',paymentDateCandidate:dates.length===1?dates[0]:null,paymentDateCandidateSource:dates.length===1?exact[0].sourceUrl:null,paymentDateCandidateStatus:status,paymentDateCandidates:exact.map(x=>({paymentDate:x.paymentDate,sourceUrl:x.sourceUrl,perShare:x.perShare})),paymentDateApproved:false};
 });
}
export function approveKlsescreenerPaymentDate(event,{confirm=false}={}){
 if(!confirm||event.paymentDateCandidateStatus!=='third-party-match-pending-review'||!iso(event.paymentDateCandidate))throw Error('Payment Date 必须经过人工确认且没有匹配冲突。');
 if(event.paymentDate&&event.paymentDate!==event.paymentDateCandidate)throw Error('已有付款日期不同，拒绝静默覆盖。');
 return {...event,date:event.paymentDateCandidate,paymentDate:event.paymentDateCandidate,paymentDateApproved:true,dateType:'third-party-payment-date-user-approved',source:'klsescreener-user-approved'};
}
