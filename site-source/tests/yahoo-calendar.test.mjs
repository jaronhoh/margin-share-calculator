import assert from 'node:assert/strict';
import {expandYahooCalendarRows} from '../dist/yahoo-calendar.mjs';
import {classifyMarketDate} from '../dist/market-calendar.mjs';

const weekend=expandYahooCalendarRows([
  {date:'2025-01-24',close:6.1},
  {date:'2025-01-27',close:6.2},
],{endDate:'2025-01-27',classifyMarketDate});
assert.deepEqual(weekend.slice(0,4),[
  {date:'2025-01-24',close:6.1},
  {date:'2025-01-25',close:6.1,carryForward:true,carryForwardFrom:'2025-01-24',reason:'weekend'},
  {date:'2025-01-26',close:6.1,carryForward:true,carryForwardFrom:'2025-01-24',reason:'weekend'},
  {date:'2025-01-27',close:6.2},
]);

const confirmedHoliday=expandYahooCalendarRows([
  {date:'2025-01-28',close:6.3},
  {date:'2025-01-31',close:6.4},
],{endDate:'2025-01-31',classifyMarketDate});
assert.deepEqual(confirmedHoliday.slice(1,3),[
  {date:'2025-01-29',close:6.3,carryForward:true,carryForwardFrom:'2025-01-28',reason:'confirmed-market-holiday',source:'bursa-chinese-new-year-2025',sourceUrl:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-chinese-new-year-public-holiday'},
  {date:'2025-01-30',close:6.3,carryForward:true,carryForwardFrom:'2025-01-28',reason:'confirmed-market-holiday',source:'bursa-chinese-new-year-2025',sourceUrl:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-chinese-new-year-public-holiday'},
]);
assert.throws(()=>expandYahooCalendarRows([
  {date:'2025-01-03',close:6.1},
  {date:'2025-01-07',close:6.2},
],{endDate:'2025-01-07',classifyMarketDate}),/2025-01-06/);
assert.throws(()=>expandYahooCalendarRows([
  {date:'2025-01-03',close:6.1},
  {date:'2025-01-03',close:6.2},
],{endDate:'2025-01-03',classifyMarketDate}),/重复价格日期/);
assert.throws(()=>expandYahooCalendarRows([{date:'2025-01-03',close:0}],{endDate:'2025-01-03',classifyMarketDate}),/无效/);

console.log('PASS Yahoo full-history calendar expansion: weekends, confirmed Bursa closures, carry-forward provenance, unconfirmed weekday rejection, duplicate and invalid prices');
