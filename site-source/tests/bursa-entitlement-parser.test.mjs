import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBursaEntitlementNotice} from '../dist/bursa-entitlement-parser.mjs';
const notice=`Entitlement Subject  Interim Dividend
Ex-Date  23 Sep 2026
Entitlement Date  24 Sep 2026
Payment Date  22 Oct 2026
Entitlement in Currency  Malaysian Ringgit (MYR) 0.3100
Reference Number  ENT-FIXTURE-00001`;
test('extracts payment and ex dates from public notice-style text without auto-approval',()=>{
 const x=parseBursaEntitlementNotice(notice,{ticker:'1155.KL',sourceUrl:'https://maybank.listedcompany.com/news.html/id/example'});
 assert.equal(x.exDate,'2026-09-23');assert.equal(x.paymentDate,'2026-10-22');
 assert.equal(x.recordDate,'2026-09-24');assert.equal(x.perShare,0.31);
 assert.equal(x.parseStatus,'unverified-extracted-fields');
});
test('missing payment date fails closed',()=>assert.throws(()=>parseBursaEntitlementNotice(notice.replace('Payment Date  22 Oct 2026',''))));
test('malformed date fails closed',()=>assert.throws(()=>parseBursaEntitlementNotice(notice.replace('22 Oct 2026','31 Feb 2026'))));
test('no MYR amount fails closed',()=>assert.throws(()=>parseBursaEntitlementNotice(notice.replace('(MYR) 0.3100',''))));
