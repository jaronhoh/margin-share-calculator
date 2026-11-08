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

test('PBB percentage records retain the raw rate and a post-bonus MYR record matches directly', () => {
 const ticker = '1295.KL';
 const yahoo = [
  { ticker, exDate: '2015-02-18', perShare: 0.062 },
  { ticker, exDate: '2021-03-11', perShare: 0.13 },
 ];
 const records = [
  { ...klse, ticker, exDate: '2015-02-18', paymentDate: '2015-03-05', perShare: null,
   sourceAmount: 31, sourceIndicator: 'Percentage' },
  { ...klse, ticker, exDate: '2021-03-11', paymentDate: '2021-03-22', perShare: 0.13,
   sourceAmount: 0.13, sourceIndicator: 'Currency' },
 ];
 const [before, after] = reconcileKlsescreenerDividends(yahoo, records, { ticker });
 assert.equal(before.paymentDateCandidateStatus, 'amount-mismatch-pending-review');
 assert.equal(before.paymentDateCandidateSourceAmount, 31);
 assert.equal(before.paymentDateCandidateSourceIndicator, 'Percentage');
 assert.equal(before.paymentDateCandidates[0].perShare, null);
 assert.equal(approveKlsescreenerPaymentDate(before, { confirm: true }).perShare, 0.062);
 assert.equal(after.paymentDateCandidateStatus, 'third-party-match-pending-review');
 assert.equal(approveKlsescreenerPaymentDate(after, { confirm: true }).paymentDate, '2021-03-22');
});
