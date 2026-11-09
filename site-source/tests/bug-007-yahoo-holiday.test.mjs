import assert from 'node:assert/strict';
import {classifyMarketDate,setYahooMarketCalendar} from '../dist/market-calendar.mjs';
import {createYahooMarketCalendar,expandYahooCalendarRows} from '../dist/yahoo-calendar.mjs';

const observations=[{date:'2015-01-30',close:10},{date:'2015-02-04',close:10.5}];
const calendar=createYahooMarketCalendar([{date:'2015-01-30',close:1800},{date:'2015-02-04',close:1803}],{startDate:'2015-01-30',endDate:'2015-02-04'});
assert.equal(calendar.closedDates.includes('2015-02-03'),true);
setYahooMarketCalendar(calendar);
assert.equal(classifyMarketDate('2015-02-03',{marketCalendar:calendar}).status,'yahoo-market-holiday');
const rows=expandYahooCalendarRows(observations,{startDate:'2015-02-03',endDate:'2015-02-04',classifyMarketDate,marketCalendar:calendar});
assert.equal(rows[0].date,'2015-02-03');assert.equal(rows[0].close,10);assert.equal(rows[0].carryForwardFrom,'2015-01-30');assert.equal(rows[0].reason,'yahoo-market-holiday');assert.equal(rows[0].source,'Yahoo Finance ^KLSE');

const confirmed=classifyMarketDate('2025-02-11');assert.equal(confirmed.status,'confirmed-market-holiday');
assert.equal(confirmed.source,'bursa-thaipusam-2025');

const multiCalendar={sourceTicker:'^KLSE',source:'yahoo-chart-market-calendar',startDate:'2025-02-28',endDate:'2025-03-07',observedTradingDates:['2025-02-28','2025-03-07'],closedDates:['2025-03-03','2025-03-04','2025-03-05','2025-03-06'],supplementalObservedDates:[]};
setYahooMarketCalendar(multiCalendar);
const extended=expandYahooCalendarRows([{date:'2025-02-28',close:9.5},{date:'2025-03-07',close:10.2}],{startDate:'2025-02-28',endDate:'2025-03-07',classifyMarketDate,marketCalendar:multiCalendar});
for(const row of extended.filter(x=>x.date>='2025-03-03'&&x.date<='2025-03-06')){assert.equal(row.close,9.5);assert.equal(row.carryForwardFrom,'2025-02-28');assert.equal(row.reason,'yahoo-market-holiday');}
assert.equal(extended.length,8);
setYahooMarketCalendar(null);
console.log('PASS BUG-007 confirmed dates, Yahoo calendar carry-forward provenance, and multi-day closure carry-forward source.');
