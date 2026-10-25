// Parse the dividend history table exposed on a public KLSE Screener stock page.
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function date(value){
 const m=/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(String(value).trim());
 if(!m||!MONTHS[m[2].toLowerCase()])return '';
 const iso=`${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 return Number.isFinite(Date.parse(iso+'T00:00:00Z'))&&new Date(iso+'T00:00:00Z').toISOString().slice(0,10)===iso?iso:'';
}
export function parseKlsescreenerDividendTable(text,{ticker,sourceUrl}={}){
 const symbol=String(ticker||'').toUpperCase().trim();
 if(!/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(symbol))throw Error('KLSE Screener 股票代码无效。');
 let url;try{url=new URL(sourceUrl);}catch{throw Error('KLSE Screener 来源 URL 无效。');}
 if(url.protocol!=='https:'||url.hostname!=='www.klsescreener.com'||!new RegExp(`^/v2/stocks/view/${symbol.slice(0,-3)}(?:/|$)`).test(url.pathname))throw Error('KLSE Screener 股票页面与代码不匹配。');
 if(typeof text!=='string'||text.length>2_000_000)throw Error('KLSE Screener 页面内容无效。');
 const lines=text.split(/\r?\n/);
 const header=lines.findIndex(x=>/Announced\s*\|\s*Financial Year\s*\|\s*Subject\s*\|\s*EX Date\s*\|\s*Payment Date\s*\|\s*Amount/i.test(x));
 if(header<0)throw Error('没有找到 KLSE Screener 股息历史表。');
 const rows=[];
 for(let i=header+1;i<lines.length;i++){
  const line=lines[i].replace(/^L\d+:\s*/,'').trim();
  if(!line||/^[-|\s]+$/.test(line)||/^\d{1,2}\s+[A-Za-z]{3},?\s+\d{4}$/.test(line)||/^\d{4}-\d{2}-\d{2}$/.test(line))continue;
  const cols=line.split('|').map(x=>x.trim());
  if(cols.length<7){if(rows.length&&line.startsWith('Announced'))break;continue;}
  const announced=date(cols[0]),exDate=date(cols[3]),paymentDate=date(cols[4]),perShare=Number(cols[5]);
  if(!announced||!exDate||!paymentDate||!Number.isFinite(perShare)||perShare<=0||perShare>1000||!/^(currency|rm|myr)$/i.test(cols[6]||''))continue;
  const link=/\[?\d+\]?[^\n]*?View/.test(cols[7]||'')?cols[7]:null;
  rows.push({ticker:symbol,announcedDate:announced,exDate,paymentDate,perShare,subject:cols[2],source:'klsescreener-dividend-history',sourceUrl:url.toString(),sourceRow:i+1,sourceLinkText:link,reviewStatus:'third-party-unverified'});
 }
 if(!rows.length)throw Error('KLSE Screener 股息历史表没有可用的完整记录。');
 return rows;
}
