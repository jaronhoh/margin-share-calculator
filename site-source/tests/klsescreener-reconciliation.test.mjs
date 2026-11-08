import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileKlsescreenerDividends,approveKlsescreenerPaymentDate} from '../dist/klsescreener-reconciliation.mjs';
const yahoo={ticker:'1155.KL',exDate:'2026-03-12',perShare:0.33,paymentDate:''};
const klse={...yahoo,paymentDate:'2026-03-26',source:'klsescreener-dividend-history',sourceUrl:'https://www.klsescreener.com/v2/stocks/view/1155/malayan-banking-berhad'};
test('matched third-party payment date stays candidate until approval',()=>{
 const [x]=reconcileKlsescreenerDividends([yahoo],[klse],{ticker:'1155.KL'});
 assert.equal(x.paymentDate,'');assert.equal(x.paymentDateCandidate,'2026-03-26');assert.equal(x.paymentDateApproved,false);
 assert.throws(()=>approveKlsescreenerPaymentDate(x));
 const approved=approveKlsescreenerPaymentDate(x,{confirm:true});
 assert.equal(approved.paymentDate,'2026-03-26');assert.equal(approved.date,'2026-03-26');
});
test('unique same-day amount mismatch exposes the date but preserves the Yahoo amount',()=>{
 const [x]=reconcileKlsescreenerDividends([yahoo],[{...klse,perShare:0.34}],{ticker:'1155.KL'});
 assert.equal(x.paymentDateCandidate,'2026-03-26');assert.equal(x.paymentDateCandidateStatus,'amount-mismatch-pending-review');assert.equal(x.paymentDateCandidateSourceAmount,0.34);
 assert.equal(approveKlsescreenerPaymentDate(x,{confirm:true}).perShare,yahoo.perShare);
});
test('different amounts with multiple same-day dates remain blocked',()=>{
 const [x]=reconcileKlsescreenerDividends([yahoo],[{...klse,perShare:0.34},{...klse,paymentDate:'2026-03-27',perShare:0.35}],{ticker:'1155.KL'});
 assert.equal(x.paymentDateCandidate,null);assert.equal(x.paymentDateCandidateStatus,'conflicting-payment-dates');
 assert.throws(()=>approveKlsescreenerPaymentDate(x,{confirm:true}));
});
test('conflicting payment dates are blocked',()=>{
 const [x]=reconcileKlsescreenerDividends([yahoo],[klse,{...klse,paymentDate:'2026-03-27'}],{ticker:'1155.KL'});
 assert.equal(x.paymentDateCandidateStatus,'conflicting-payment-dates');
 assert.throws(()=>approveKlsescreenerPaymentDate(x,{confirm:true}));
});
test('cross ticker records cannot match',()=>{
 const [x]=reconcileKlsescreenerDividends([yahoo],[{...klse,ticker:'1066.KL'}],{ticker:'1155.KL'});
 assert.equal(x.paymentDateCandidate,null);
});
test('existing conflicting payment date cannot be overwritten',()=>{
 const [x]=reconcileKlsescreenerDividends([{...yahoo,paymentDate:'2026-03-25'}],[klse],{ticker:'1155.KL'});
 assert.throws(()=>approveKlsescreenerPaymentDate(x,{confirm:true}));
});

test('PBB 2017 first interim uses the candidate payment date without changing the Yahoo share basis', () => {
 const ticker = '1295.KL', exDate = '2017-08-07', perShare = 0.05400000140070915;
 const [candidate] = reconcileKlsescreenerDividends([{ ticker, exDate, perShare }], [{
  ...klse, ticker, exDate, paymentDate: '2017-08-17', perShare: 0.27,
  sourceAmount: 0.27, sourceIndicator: 'Currency', sourceUrl: 'https://www.klsescreener.com/v2/stocks/view/1295',
 }], { ticker });
 assert.equal(candidate.paymentDateCandidateStatus, 'amount-mismatch-pending-review');
 assert.equal(candidate.paymentDateCandidateSourceAmount, 0.27);
 const approved = approveKlsescreenerPaymentDate(candidate, { confirm: true });
 assert.equal(approved.paymentDate, '2017-08-17');
 assert.equal(approved.perShare, perShare);
});
