const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(`${date}T00:00:00Z`))&&new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)===date;

export function createYahooMarketCalendar(rows,{startDate=rows?.[0]?.date,endDate=rows?.at(-1)?.date,additionalObservedRows=[],additionalSourceTicker=null}={}){
  if(!Array.isArray(rows)||!rows.length||!validDate(startDate)||!validDate(endDate)||endDate<startDate)throw new Error('Yahoo 市场基准日历数据无效。');
  const dates=new Set();
  for(const row of rows){if(!row||!validDate(row.date)||!Number.isFinite(row.close)||row.close<=0)throw new Error('Yahoo 市场基准价格无效。');if(dates.has(row.date))throw new Error(`Yahoo 市场基准返回重复日期：${row.date}。`);dates.add(row.date);}
  const supplementalObservedDates=[];
  if(!Array.isArray(additionalObservedRows)||additionalObservedRows.length&&(!/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(String(additionalSourceTicker||''))))throw new Error('Yahoo 补充市场日期来源无效。');
  for(const row of additionalObservedRows){if(!row||!validDate(row.date)||!Number.isFinite(row.close)||row.close<=0)throw new Error('Yahoo 补充市场日期价格无效。');if(row.date>=startDate&&row.date<=endDate){dates.add(row.date);supplementalObservedDates.push({date:row.date,ticker:additionalSourceTicker});}}
  const sorted=[...dates].sort();
  if(sorted[0]>startDate||sorted.at(-1)<endDate)throw new Error('Yahoo 市场基准未覆盖完整导入范围，不能更新市场日历。');
  if((Date.parse(`${endDate}T00:00:00Z`)-Date.parse(`${startDate}T00:00:00Z`))/86400000>4999)throw new Error('Yahoo 市场日历范围超过 5,000 个日历日。');
  const observedTradingDates=sorted.filter(d=>d>=startDate&&d<=endDate),closedDates=[];
  for(let ms=Date.parse(`${startDate}T00:00:00Z`);ms<=Date.parse(`${endDate}T00:00:00Z`);ms+=86400000){const d=new Date(ms).toISOString().slice(0,10),weekday=new Date(ms).getUTCDay();if(weekday!==0&&weekday!==6&&!dates.has(d))closedDates.push(d);}
  return{source:'yahoo-chart-market-calendar',sourceTicker:'^KLSE',sourceUrl:'https://finance.yahoo.com/quote/%5EKLSE/history/',startDate,endDate,observedTradingDates,closedDates,supplementalObservedDates};
}

export function mergeYahooMarketCalendars(previous,next){
  if(!previous)return next;
  if(previous.sourceTicker!=='^KLSE'||next.sourceTicker!=='^KLSE'||previous.endDate<next.startDate||next.endDate<previous.startDate)return next;
  const observedTradingDates=[...new Set([...previous.observedTradingDates,...next.observedTradingDates])].sort(),closedDates=[...new Set([...previous.closedDates,...next.closedDates])].filter(d=>!observedTradingDates.includes(d)).sort();
  const supplementalObservedDates=[...new Map([...(previous.supplementalObservedDates||[]),...(next.supplementalObservedDates||[])].map(item=>[`${item.date}:${item.ticker}`,item])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.ticker.localeCompare(b.ticker));
  return{...next,startDate:previous.startDate<next.startDate?previous.startDate:next.startDate,endDate:previous.endDate>next.endDate?previous.endDate:next.endDate,observedTradingDates,closedDates,supplementalObservedDates};
}

export function expandYahooCalendarRows(rows,{startDate=rows?.[0]?.date,endDate,classifyMarketDate,marketCalendar}={}){
  if(!Array.isArray(rows)||rows.length===0)throw new Error('Yahoo 没有返回有效价格。');
  if(typeof endDate!=='string'||typeof classifyMarketDate!=='function')throw new Error('Yahoo 日历补齐参数无效。');
  const byDate=new Map();
  for(const row of rows){
    if(!row||typeof row.date!=='string'||!Number.isFinite(row.close)||row.close<=0)throw new Error('Yahoo 收盘价记录无效。');
    if(byDate.has(row.date))throw new Error(`Yahoo 返回重复价格日期：${row.date}。`);
    byDate.set(row.date,{...row});
  }
  const observed=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
  let priorClose=null,priorDate=null;
  if(!validDate(startDate)||observed.at(-1).date<startDate)throw new Error('Yahoo 日历补齐日期范围无效。');
  for(const row of observed){if(row.date>=startDate)break;priorClose=row.close;priorDate=row.date;}
  const start=Date.parse(`${startDate}T00:00:00Z`),end=Date.parse(`${endDate}T00:00:00Z`);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)throw new Error('Yahoo 日历补齐日期范围无效。');
  if((end-start)/86400000+1>5000)throw new Error('Yahoo 补齐后的行情最多 5,000 个日历日。');
  for(let ms=start;ms<=end;ms+=86400000){
    const date=new Date(ms).toISOString().slice(0,10),row=byDate.get(date);
    if(row){priorClose=row.close;priorDate=date;continue;}
    const marketDay=classifyMarketDate(date,{marketCalendar});
    if(marketDay.status!=='weekend'&&marketDay.status!=='confirmed-market-holiday'&&marketDay.status!=='yahoo-market-holiday')throw new Error(marketCalendar?.observedTradingDates?.includes(date)?`Yahoo 市场基准显示 ${date} 是交易日，但 ${marketCalendar.sourceTicker} 没有返回该股票价格；拒绝补价。`:`Yahoo 没有返回 ${date} 的收盘价；该工作日休市状态未确认，拒绝自动补价。请检查 Yahoo ^KLSE 行情或导入人工确认的 CSV。`);
    if(priorClose==null)throw new Error(`Yahoo 缺少 ${date} 价格，且没有可沿用的前一有效价格。`);
    const reason=marketDay.status==='weekend'?'weekend':marketDay.status==='confirmed-market-holiday'?'confirmed-market-holiday':'yahoo-market-holiday';
    byDate.set(date,{date,close:priorClose,carryForward:true,carryForwardFrom:priorDate,reason,...(marketDay.source?{source:marketDay.source,sourceUrl:marketDay.url}:{})});
  }
  return [...byDate.values()].filter(row=>row.date>=startDate&&row.date<=endDate).sort((a,b)=>a.date.localeCompare(b.date));
}
