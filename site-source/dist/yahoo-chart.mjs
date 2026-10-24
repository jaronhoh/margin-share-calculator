const KL_DATE=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'});

function asKlDate(timestamp){
  if(!Number.isFinite(timestamp))throw new Error('Yahoo 返回了无效的日期时间。');
  return KL_DATE.format(new Date(timestamp*1000));
}

export function parseYahooChart(payload,{ticker='1155.KL'}={}){
  const chart=payload?.chart;
  if(chart?.error)throw new Error(`Yahoo 返回错误：${chart.error.description||chart.error.code||'未知错误'}`);
  const result=chart?.result?.[0];
  if(!result)throw new Error('Yahoo 没有返回行情数据；可能为空、代码无效或请求受限。');
  if(result.meta?.symbol&&result.meta.symbol.toUpperCase()!==ticker.toUpperCase())throw new Error(`Yahoo 返回代码不匹配：${result.meta.symbol}。`);
  const timestamps=result.timestamp||[],closes=result.indicators?.quote?.[0]?.close||[];
  if(!timestamps.length||timestamps.length!==closes.length)throw new Error('Yahoo 行情日期与收盘价数据不完整。');
  const rows=[],seen=new Set();
  for(let i=0;i<timestamps.length;i++){
    const close=closes[i];if(close==null)continue;
    const date=asKlDate(timestamps[i]);
    if(seen.has(date))throw new Error(`Yahoo 返回重复日期：${date}。`);seen.add(date);
    if(!Number.isFinite(close)||close<=0||close>1_000_000)throw new Error(`Yahoo 收盘价异常：${date}。`);
    rows.push({date,close});
  }
  if(!rows.length)throw new Error('Yahoo 返回了空收盘价序列。');
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  const dividends=Object.entries(result.events?.dividends||{}).map(([timestamp,event])=>({
    exDate:asKlDate(Number(event.date??timestamp)),perShare:Number(event.amount),recordDate:'',paymentDate:'',
    dateType:'ex-date-only',source:'yahoo-chart',ticker,
  })).sort((a,b)=>a.exDate.localeCompare(b.exDate));
  const splits=Object.entries(result.events?.splits||{}).map(([timestamp,event])=>({
    date:asKlDate(Number(event.date??timestamp)),numerator:Number(event.numerator),denominator:Number(event.denominator),source:'yahoo-chart',ticker,
  })).sort((a,b)=>a.date.localeCompare(b.date));
  return{ticker,currency:result.meta?.currency||null,timeZone:result.meta?.exchangeTimezoneName||null,rows,dividends,splits};
}

export function buildYahooChartUrl(ticker,{period1,period2}={}){
  const symbol=String(ticker||'').trim().toUpperCase();
  if(!/^[0-9]{4}\.KL$/.test(symbol))throw new Error('Yahoo 更新只支持马来西亚股票代码，例如 1155.KL。');
  if(!Number.isInteger(period1)||!Number.isInteger(period2)||period1<0||period2<=period1)throw new Error('Yahoo 查询日期范围无效。');
  const url=new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.search=new URLSearchParams({period1:String(period1),period2:String(period2),interval:'1d',events:'div,splits'}).toString();
  return url.toString();
}

export async function fetchYahooChart(ticker,{startDate,endDate,fetchImpl=globalThis.fetch,now=new Date()}={}){
  const day=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(`${s}T00:00:00Z`)))throw new Error('Yahoo 查询日期无效。');return s;};
  const start=day(startDate),end=day(endDate);
  const period1=Math.floor(Date.parse(`${start}T00:00:00Z`)/1000);
  const period2=Math.floor(Date.parse(`${end}T00:00:00Z`)/1000)+86400;
  if(!fetchImpl)throw new Error('当前浏览器不支持网络请求。');
  const response=await fetchImpl(buildYahooChartUrl(ticker,{period1,period2}),{headers:{Accept:'application/json'}});
  if(!response?.ok){const status=response?.status||0;throw new Error(status===429?'Yahoo 暂时限制请求（HTTP 429），请稍后再试。':`Yahoo 请求失败（HTTP ${status||'网络错误'}）。`);}
  let payload;try{payload=await response.json();}catch{throw new Error('Yahoo 返回的内容不是有效 JSON。');}
  const parsed=parseYahooChart(payload,{ticker});
  const rows=parsed.rows.filter(x=>x.date>=start&&x.date<=end);
  if(!rows.length)throw new Error('Yahoo 在所选日期范围内没有收盘价。');
  const today=KL_DATE.format(now);
  return{...parsed,rows:rows.filter(x=>x.date<today)};
}
