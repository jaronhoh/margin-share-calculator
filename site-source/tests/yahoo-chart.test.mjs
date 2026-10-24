import assert from 'node:assert/strict';
import {buildYahooChartUrl,fetchYahooChart,parseYahooChart} from '../dist/yahoo-chart.mjs';

const sample={chart:{result:[{meta:{symbol:'1155.KL',currency:'MYR',exchangeTimezoneName:'Asia/Kuala_Lumpur'},timestamp:[1761264000,1761350400],indicators:{quote:[{close:[9.12,9.11]}],adjclose:[{adjclose:[8.7,8.69]}]},events:{dividends:{1761264000:{date:1761264000,amount:.39}},splits:{1761350400:{date:1761350400,numerator:2,denominator:1}}}}],error:null}};
const parsed=parseYahooChart(sample);
assert.equal(parsed.currency,'MYR');assert.equal(parsed.timeZone,'Asia/Kuala_Lumpur');
assert.deepEqual(parsed.rows,[{date:'2025-10-24',close:9.12},{date:'2025-10-25',close:9.11}]);
assert.equal(parsed.dividends[0].exDate,'2025-10-24');assert.equal(parsed.dividends[0].paymentDate,'');assert.equal(parsed.dividends[0].dateType,'ex-date-only');
assert.deepEqual(parsed.splits,[{date:'2025-10-25',numerator:2,denominator:1,source:'yahoo-chart',ticker:'1155.KL'}]);
assert.match(buildYahooChartUrl('1155.KL',{period1:1,period2:2}),/interval=1d/);assert.match(buildYahooChartUrl('1155.KL',{period1:1,period2:2}),/events=div%2Csplits/);
assert.throws(()=>buildYahooChartUrl('AAPL',{period1:1,period2:2}),/只支持马来西亚/);
assert.throws(()=>parseYahooChart({chart:{error:{code:'Too Many Requests',description:'Rate limited'}}}),/Yahoo 返回错误/);
assert.throws(()=>parseYahooChart({chart:{result:[],error:null}}),/没有返回行情/);
assert.throws(()=>parseYahooChart({chart:{result:[{meta:{symbol:'1155.KL'},timestamp:[1,2],indicators:{quote:[{close:[null,null]}]}}],error:null}}),/空收盘价/);
assert.throws(()=>parseYahooChart({chart:{result:[{meta:{symbol:'1155.KL'},timestamp:[1,1],indicators:{quote:[{close:[9,9.1]}]}}],error:null}}),/重复日期/);

const requestUrls=[];
const fetchImpl=async url=>{requestUrls.push(String(url));return{ok:true,json:async()=>sample,url};};
const recent=await fetchYahooChart('1155.KL',{startDate:'2025-10-24',endDate:'2025-10-25',fetchImpl,now:new Date('2025-10-26T00:00:00Z')});
assert.equal(recent.rows.length,2);
assert.match(requestUrls[0],/^\/api\/yahoo-chart\?/);assert.equal(new URL(requestUrls[0],'https://site.example').searchParams.get('ticker'),'1155.KL');
await assert.rejects(()=>fetchYahooChart('1155.KL',{startDate:'2025-10-24',endDate:'2025-10-25',fetchImpl:async()=>({ok:false,status:429}),now:new Date('2025-10-26')}),/限制请求/);
await assert.rejects(()=>fetchYahooChart('1155.KL',{startDate:'2025-10-24',endDate:'2025-10-25',fetchImpl:async()=>({ok:true,json:async()=>({})}),now:new Date('2025-10-26')}),/没有返回行情/);
console.log('PASS Yahoo Chart close-only parsing, Kuala Lumpur dates, dividend Ex-Date separation, split events, empty/error/rate-limit responses and request URL');
