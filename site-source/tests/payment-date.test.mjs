import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDividendAnnouncement,matchDividendPaymentDates} from '../dist/payment-date.mjs';
const official={ticker:'1066.KL',exDate:'2026-04-01',recordDate:'2026-04-02',paymentDate:'2026-04-20',perShare:0.25,sourceUrl:'https://www.bursamalaysia.com/example',announcementId:'fixture-only'};
const yahoo={ticker:'1066.KL',exDate:'2026-04-01',perShare:0.25,paymentDate:''};
test('official announcement can match ticker, ex-date and exact amount without auto-approval',()=>{
 const [row]=matchDividendPaymentDates([yahoo],[official],{ticker:'1066.KL'});
 assert.equal(row.paymentDate,'2026-04-20');assert.equal(row.paymentDateStatus,'official-source-matched-pending-approval');
 assert.equal(row.paymentDateSource,official.sourceUrl);
});
test('unverified or mismatched payment dates remain blank',()=>{
 for(const change of [{ticker:'1155.KL'},{perShare:0.3},{exDate:'2026-04-03',recordDate:'2026-04-04'}]){
  const [row]=matchDividendPaymentDates([yahoo],[{...official,...change}],{ticker:'1066.KL'});
  assert.equal(row.paymentDate,'');assert.equal(row.paymentDateStatus,'unverified');
 }
});
test('conflicting official dates are never silently chosen',()=>{
 const [row]=matchDividendPaymentDates([yahoo],[official,{...official,paymentDate:'2026-04-21'}],{ticker:'1066.KL'});
 assert.equal(row.paymentDate,'');assert.equal(row.paymentDateStatus,'conflicting-official-announcements');
});
test('invalid dates and non-official sources are rejected',()=>{
 assert.throws(()=>validateDividendAnnouncement({...official,paymentDate:'2026-02-30'}));
 assert.throws(()=>validateDividendAnnouncement({...official,paymentDate:'2026-03-01'}));
 assert.throws(()=>validateDividendAnnouncement({...official,sourceUrl:'https://example.com/dividends'}));
 assert.throws(()=>validateDividendAnnouncement({...official,sourceUrl:'http://www.bursamalaysia.com/example'}));
});
