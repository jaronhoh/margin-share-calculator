import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchVerifiedPaymentDates,resolvePaymentDates} from '../dist/payment-date-provider.mjs';
const event={ticker:'1066.KL',exDate:'2026-04-01',perShare:0.25};
const announcement={...event,paymentDate:'2026-04-20',sourceUrl:'https://www.bursamalaysia.com/example'};
test('without a verified endpoint automatic retrieval is disabled and does not invent payment dates',async()=>{
 const result=await resolvePaymentDates([event],{ticker:'1066.KL'});
 assert.equal(result.status,'source-not-configured');assert.equal(result.events[0].paymentDate,'');
});
test('rejects external endpoints before sending any network request',async()=>{
 let calls=0;
 await assert.rejects(fetchVerifiedPaymentDates('1066.KL',{endpoint:'https://example.com/api',fetchImpl:async()=>{calls++;}}));
 assert.equal(calls,0);
});
test('verified-source adapter validates schema and matches independently sourced date',async()=>{
 const fetchImpl=async()=>({ok:true,json:async()=>({announcements:[announcement]})});
 const result=await resolvePaymentDates([event],{ticker:'1066.KL',endpoint:'https://www.bursamalaysia.com/verified-json-endpoint-fixture',fetchImpl});
 assert.equal(result.status,'source-verified');
 assert.equal(result.events[0].paymentDate,'2026-04-20');
 assert.equal(result.events[0].paymentDateStatus,'official-source-matched-pending-approval');
});
test('bad response fails rather than inventing a date',async()=>{
 await assert.rejects(fetchVerifiedPaymentDates('1066.KL',{endpoint:'https://www.bursamalaysia.com/example',fetchImpl:async()=>({ok:true,json:async()=>({announcements:null})})}));
});
