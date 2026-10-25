const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;

function parseCsvLine(line){
  const fields=[];let value='',quoted=false,closedQuote=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(quoted){if(c==='"'&&line[i+1]==='"'){value+='"';i++;}else if(c==='"'){quoted=false;closedQuote=true;}else value+=c;}
    else if(closedQuote){if(c===','){fields.push(value.trim());value='';closedQuote=false;}else if(!/\s/.test(c))throw new Error('CSV 闭合引号后存在无效内容。');}
    else if(c==='"'){if(value)throw new Error('CSV 引号位置无效。');quoted=true;}
    else if(c===','){fields.push(value.trim());value='';}
    else value+=c;
  }
  if(quoted)throw new Error('CSV 引号未闭合。');fields.push(value.trim());return fields;
}

function validDate(value){
  return DATE_RE.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}

export function parsePriceCsv(text){
  if(typeof text!=='string'||!text.trim())throw new Error('CSV 文件为空。');
  if(new TextEncoder().encode(text).byteLength>5_000_000)throw new Error('CSV 超过 5 MB，拒绝导入。');
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());
  if(lines.length<2||lines.length>5001)throw new Error('CSV 必须包含表头和 1 至 5,000 条记录。');
  const header=parseCsvLine(lines[0]).map(x=>x.toLowerCase().replace(/[ _-]/g,''));
  const dateIndex=header.findIndex(x=>['date','tradingdate','日期'].includes(x));
  const closeIndex=header.findIndex(x=>['close','closeprice','收盘价'].includes(x));
  if(dateIndex<0||closeIndex<0||dateIndex===closeIndex)throw new Error('CSV 表头必须包含 Date 和 Close（也支持 日期、收盘价）。');
  const seen=new Set(),rows=[];
  for(let i=1;i<lines.length;i++){
    const cells=parseCsvLine(lines[i]);if(cells.every(x=>!x))continue;
    const date=cells[dateIndex],raw=cells[closeIndex],close=Number(raw.replace(/,/g,''));
    if(!validDate(date))throw new Error(`第 ${i+1} 行日期无效：${date||'空值'}。日期必须为 YYYY-MM-DD。`);
    if(seen.has(date))throw new Error(`CSV 日期重复：${date}。`);seen.add(date);
    if(!raw||!Number.isFinite(close)||close<=0||close>1_000_000)throw new Error(`第 ${i+1} 行收盘价无效：${raw||'空值'}。`);
    rows.push({date,close});
  }
  if(!rows.length)throw new Error('CSV 没有有效价格记录。');
  rows.sort((a,b)=>a.date.localeCompare(b.date));return rows;
}

export function comparePriceRows(current,incoming){
  const existing=new Map(current.map(x=>[x.date,x.close]));
  return incoming.map(row=>({ ...row, kind:!existing.has(row.date)?'new':Math.abs(existing.get(row.date)-row.close)<1e-10?'same':'conflict', currentClose:existing.get(row.date)??null }));
}

export function buildPriceSnapshot(current,incoming,selectedDates,manualPriceDates=[]){
  const selected=new Set(selectedDates),incomingByDate=new Map(incoming.map(row=>[row.date,row]));
  for(const date of selected)if(!incomingByDate.has(date))throw new Error(`所选日期不在导入数据中：${date}。`);
  const merged=new Map(current.map(row=>[row.date,{...row}])),manual=new Set(manualPriceDates);
  for(const date of selected){const row=incomingByDate.get(date),old=merged.get(date);if(old&&Math.abs(old.close-row.close)>=1e-10)manual.add(date);merged.set(date,{...old,date,close:row.close});}
  const rows=[...merged.values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(rows.length>5000)throw new Error('完整行情快照最多 5,000 条日历日记录。');
  // Backtest accrues interest on calendar days. Carry prices over weekends only;
  // weekday exchange closures require an independently verified holiday calendar.
  for(let i=1;i<rows.length;i++){
    const previous=rows[i-1],next=rows[i];let cursor=Date.parse(previous.date+'T00:00:00Z')+86400000;
    const end=Date.parse(next.date+'T00:00:00Z');
    while(cursor<end){
      const date=new Date(cursor).toISOString().slice(0,10),day=new Date(cursor).getUTCDay();
      if(day!==0&&day!==6)throw new Error(`完整行情快照缺少交易日或未核实的休市日 ${date}；不能擅自填补。`);
      rows.splice(i,0,{date,close:previous.close,carryForwardFrom:previous.date});i++;cursor+=86400000;
    }
  }
  return{rows,manualPriceDates:[...manual].sort()};
}

export function commitSnapshot(storage,key,snapshot,commit,rollback=()=>{}){
  const previous=storage.getItem(key),serialized=JSON.stringify(snapshot);
  try{storage.setItem(key,serialized);commit();return previous;}
  catch(error){let rollbackError;try{rollback(error);}catch(e){rollbackError=e;}try{if(previous===null)storage.removeItem(key);else storage.setItem(key,previous);}catch(e){rollbackError??=e;}const detail=error?.message||String(error);throw new Error(`保存失败，${rollbackError?'回滚期间也发生错误：'+(rollbackError.message||rollbackError):'原有数据已恢复'}。${detail}`);}
}

export function restoreSnapshot(storage,key,previous){
  if(previous===null)storage.removeItem(key);else storage.setItem(key,previous);
}
