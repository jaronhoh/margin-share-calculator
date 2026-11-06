import {matchDividendPaymentDates,validateDividendAnnouncement} from './payment-date.mjs';

// No undocumented Bursa endpoint is assumed. A verified, permitted source
// endpoint must be configured before network retrieval can be enabled.
export async function fetchVerifiedPaymentDates(ticker,{endpoint,fetchImpl=globalThis.fetch,signal}={}){
  if(!endpoint) return {status:'source-not-configured',announcements:[]};
  let url;
  try{url=new URL(endpoint);}catch{throw Error('Payment Date 数据源 URL 无效。');}
  if(url.protocol!=='https:'||!['www.bursamalaysia.com','bursamalaysia.com'].includes(url.hostname))
    throw Error('Payment Date 自动查询仅允许经过确认的 Bursa 官方 HTTPS 端点。');
  if(typeof fetchImpl!=='function')throw Error('当前环境不支持数据源请求。');
  const response=await fetchImpl(url.toString(),{headers:{Accept:'application/json'},signal});
  if(!response?.ok)throw Error(`Payment Date 官方数据源请求失败（HTTP ${response?.status||'网络错误'}）。`);
  const data=await response.json();
  if(!Array.isArray(data?.announcements)||data.announcements.length>5000)throw Error('Payment Date 数据源结构不符合要求。');
  const announcements=data.announcements.map(validateDividendAnnouncement).filter(a=>a.ticker===String(ticker).toUpperCase());
  return{status:'source-verified',announcements};
}
export async function resolvePaymentDates(yahooEvents,{ticker,endpoint,fetchImpl,signal}={}){
  const source=await fetchVerifiedPaymentDates(ticker,{endpoint,fetchImpl,signal});
  return{status:source.status,events:matchDividendPaymentDates(yahooEvents,source.announcements,{ticker})};
}
