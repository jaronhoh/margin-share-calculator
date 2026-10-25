// Payment-date matching is deliberately provider-neutral. Only independently
// sourced and verifiable announcements may supply a payment date.
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const tickerOf=value=>String(value||'').trim().toUpperCase();
const validTicker=value=>/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(value);
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1000;
const isOfficialSource=value=>{try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='bursamalaysia.com'||u.hostname.endsWith('.bursamalaysia.com'));}catch{return false;}};
export function validateDividendAnnouncement(input){
  if(!input||!validTicker(tickerOf(input.ticker)))throw Error('股息公告股票代码无效。');
  if(!validDate(input.exDate)||!validDate(input.paymentDate)||input.paymentDate<input.exDate)throw Error('股息公告除息日或付款日无效。');
  if(input.recordDate&&(!validDate(input.recordDate)||input.recordDate<input.exDate||input.recordDate>input.paymentDate))throw Error('股息公告登记日无效。');
  if(!positive(input.perShare))throw Error('股息公告每股金额无效。');
  if(!isOfficialSource(input.sourceUrl))throw Error('Payment Date 必须附有 Bursa Malaysia 官方 HTTPS 公告链接。');
  return{ticker:tickerOf(input.ticker),exDate:input.exDate,recordDate:input.recordDate||'',paymentDate:input.paymentDate,perShare:input.perShare,source:'bursa-announcement',sourceUrl:input.sourceUrl,announcementId:String(input.announcementId||'')};
}
export function matchDividendPaymentDates(yahooEvents,announcements,{ticker}={}){
  const symbol=tickerOf(ticker);
  if(!validTicker(symbol))throw Error('请提供有效 Bursa 股票代码。');
  const verified=announcements.map(validateDividendAnnouncement).filter(x=>x.ticker===symbol);
  return yahooEvents.map(event=>{
    if(tickerOf(event.ticker||symbol)!==symbol||!validDate(event.exDate)||!positive(event.perShare))throw Error('Yahoo 股息事件无效或股票代码不一致。');
    const matches=verified.filter(x=>x.exDate===event.exDate&&Math.abs(x.perShare-event.perShare)<=0.000001);
    const uniqueDates=[...new Set(matches.map(x=>x.paymentDate))];
    if(uniqueDates.length!==1)return{...event,paymentDate:'',paymentDateStatus:matches.length?'conflicting-official-announcements':'unverified',paymentDateCandidates:matches};
    return{...event,paymentDate:uniqueDates[0],recordDate:matches[0].recordDate||event.recordDate||'',paymentDateStatus:'official-source-matched-pending-approval',paymentDateSource:matches[0].sourceUrl,paymentDateCandidates:matches};
  });
}
