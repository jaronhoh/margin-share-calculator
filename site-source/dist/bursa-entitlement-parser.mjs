// Parse human-readable Bursa entitlement notices. Parsing alone never
// proves issuer identity or makes an announcement safe for auto-approval.
const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function dateFromNotice(raw){
 const s=String(raw||'').replace(/\s+/g,' ').trim();
 const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
 if(iso)return Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s?s:'';
 const match=/^(\d{1,2})[\s/-]+([a-z]{3,9})[\s,/-]+(\d{4})$/i.exec(s);
 if(!match)return '';
 const m=months[match[2].slice(0,3).toLowerCase()];
 if(!m)return '';
 const date=match[3]+'-'+String(m).padStart(2,'0')+'-'+match[1].padStart(2,'0');
 return Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date?date:'';
}
function extractField(text,label){
 const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const m=new RegExp('(?:^|\\n)\\s*'+escaped+'\\s*[:\\t ]+([^\\n]+)','im').exec(text);
 return m?.[1]?.trim()||'';
}
export function parseBursaEntitlementNotice(text,{ticker,sourceUrl}={}){
 if(typeof text!=='string'||text.length>2_000_000)throw Error('股息公告内容无效或过大。');
 const exDate=dateFromNotice(extractField(text,'Ex-Date'));
 const paymentDate=dateFromNotice(extractField(text,'Payment Date'));
 const recordDate=dateFromNotice(extractField(text,'Entitlement Date'));
 const currency=extractField(text,'Entitlement in Currency');
 const amountMatch=/\b(?:MYR|RM)\)?\s*([0-9]+(?:\.[0-9]+)?)/i.exec(currency);
 if(!exDate||!paymentDate||!amountMatch)throw Error('公告缺少可确认的 Ex-Date、Payment Date 或 MYR 每股股息。');
 const amount=Number(amountMatch[1]);
 return{ticker,exDate,recordDate,paymentDate,perShare:amount,sourceUrl,announcementId:extractField(text,'Reference Number'),parseStatus:'unverified-extracted-fields'};
}
