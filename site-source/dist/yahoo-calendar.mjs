export function expandYahooCalendarRows(rows,{endDate,classifyMarketDate}={}){
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
  const start=Date.parse(`${observed[0].date}T00:00:00Z`),end=Date.parse(`${endDate}T00:00:00Z`);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)throw new Error('Yahoo 日历补齐日期范围无效。');
  for(let ms=start;ms<=end;ms+=86400000){
    const date=new Date(ms).toISOString().slice(0,10),row=byDate.get(date);
    if(row){priorClose=row.close;priorDate=date;continue;}
    const marketDay=classifyMarketDate(date);
    if(marketDay.status!=='weekend'&&marketDay.status!=='confirmed-market-holiday')throw new Error(`Yahoo 没有返回 ${date} 的收盘价；该工作日休市状态未确认，拒绝自动补价。请核对交易所资料或导入人工确认的 CSV。`);
    if(priorClose==null)throw new Error(`Yahoo 缺少 ${date} 价格，且没有可沿用的前一有效价格。`);
    byDate.set(date,{date,close:priorClose,carryForward:true,carryForwardFrom:priorDate,reason:marketDay.status==='weekend'?'weekend':'confirmed-market-holiday',...(marketDay.source?{source:marketDay.source,sourceUrl:marketDay.url}:{})});
  }
  return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
