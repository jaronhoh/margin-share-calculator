import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKlsescreenerDividendHtml, fetchKlsescreenerPaymentDates, approveKlsescreenerPaymentDate } from '../dist/klsescreener-payment-date.mjs';

const sourceUrl = 'https://www.klsescreener.com/v2/stocks/view/1066';
const html = '<title>RHBBANK: RHB BANK BERHAD (1066)</title><table><thead><tr><th>Announced</th><th>Financial Year</th><th>Subject</th><th>EX Date</th><th>Payment Date</th><th>Amount</th><th>Indicator</th><th>Event</th></tr></thead><tbody><tr><td>27 Feb 2025</td><td>31 Dec 2024</td><td>Second Interim Dividend</td><td>21 Mar 2025</td><td>09 Apr 2025</td><td>0.2800</td><td>Currency</td><td>View</td></tr><tr><td>28 Aug 2024</td><td>31 Dec 2023</td><td>First Interim Dividend</td><td>17 Sep 2024</td><td>30 Sep 2024</td><td>0.1500</td><td>Currency</td><td>View</td></tr></tbody></table>';

test('parses public HTML history including stock identity, all relevant dates, amounts and source', () => {
  const rows = parseKlsescreenerDividendHtml(html, { ticker: '1066.KL', sourceUrl });
  assert.deepEqual(rows.map(x => [x.ticker, x.exDate, x.paymentDate, x.perShare]), [['1066.KL', '2025-03-21', '2025-04-09', 0.28], ['1066.KL', '2024-09-17', '2024-09-30', 0.15]]);
  assert.equal(rows[0].sourceUrl, sourceUrl);
  assert.throws(() => parseKlsescreenerDividendHtml(html.replace('(1066)', '(1155)'), { ticker: '1066.KL', sourceUrl }), /股票代码与请求不匹配/);
  assert.throws(() => parseKlsescreenerDividendHtml('<title>page without a stock code</title><main>no table</main>', { ticker: '1066.KL', sourceUrl }), /股票代码与请求不匹配/);
  const fiveDigitHtml = html.replaceAll('1066', '03050');
  const fiveDigit = parseKlsescreenerDividendHtml(fiveDigitHtml, { ticker: '03050.KL', sourceUrl: 'https://www.klsescreener.com/v2/stocks/view/03050' });
  assert.equal(fiveDigit[0].ticker, '03050.KL');
  const percentageHtml = html.replace('<td>0.1500</td><td>Currency</td>', '<td>0.1500</td><td>Percentage</td>');
  assert.deepEqual(parseKlsescreenerDividendHtml(percentageHtml, { ticker: '1066.KL', sourceUrl }).map(x => x.exDate), ['2025-03-21'], 'percentage-denominated history cannot be mistaken for MYR per share');
});

test('matches by same ticker and Ex-Date, and requires explicit approval', async () => {
  const yahoo = [{ ticker: '1066.KL', exDate: '2025-03-21', perShare: 0.28 }];
  const klse = parseKlsescreenerDividendHtml(html, { ticker: '1066.KL', sourceUrl });
  const [candidate] = (await fetchKlsescreenerPaymentDates(yahoo, { ticker: '1066.KL', cached: { ticker: '1066.KL', expiresAt: Date.now() + 10000, events: klse } })).events;
  assert.equal(candidate.paymentDate, '');
  assert.equal(candidate.paymentDateCandidate, '2025-04-09');
  assert.equal(candidate.paymentDateCandidateStatus, 'third-party-match-pending-review');
  assert.throws(() => approveKlsescreenerPaymentDate(candidate), /人工确认/);
  assert.equal(approveKlsescreenerPaymentDate(candidate, { confirm: true }).paymentDate, '2025-04-09');
  const mismatch = (await fetchKlsescreenerPaymentDates([{ ...yahoo[0], perShare: 0.29 }], { ticker: '1066.KL', cached: { ticker: '1066.KL', expiresAt: Date.now() + 10000, events: klse } })).events[0];
  assert.equal(mismatch.paymentDateCandidate, '2025-04-09');
  assert.equal(mismatch.paymentDateCandidateStatus, 'amount-mismatch-pending-review');
  assert.equal(mismatch.paymentDateCandidateSourceAmount, 0.28);
  assert.equal(approveKlsescreenerPaymentDate(mismatch, { confirm: true }).perShare, 0.29, 'approving the date does not replace the Yahoo amount');
  const ambiguousHtml = html.replace('09 Apr 2025', '10 Apr 2025');
  const ambiguousRows = parseKlsescreenerDividendHtml(ambiguousHtml, { ticker: '1066.KL', sourceUrl });
  const ambiguous = (await fetchKlsescreenerPaymentDates([{ ...yahoo[0], perShare: 0.29 }], { ticker: '1066.KL', cached: { ticker: '1066.KL', expiresAt: Date.now() + 10000, events: [...klse, ...ambiguousRows] } })).events[0];
  assert.equal(ambiguous.paymentDateCandidate, null);
  assert.equal(ambiguous.paymentDateCandidateStatus, 'conflicting-payment-dates');
});

test('fetches only same-origin Worker route, validates ticker isolation, and supports six-hour cached history', async () => {
  let calls = 0;
  const cached = { ticker: '1066.KL', expiresAt: Date.now() + 10000, sourceUrl, events: parseKlsescreenerDividendHtml(html, { ticker: '1066.KL', sourceUrl }) };
  const fetched = await fetchKlsescreenerPaymentDates([{ ticker: '1066.KL', exDate: '2025-03-21', perShare: 0.28 }], { ticker: '1066.KL', cached, fetchImpl: async () => { calls++; throw Error('cached route should not be called'); } });
  assert.equal(fetched.events[0].paymentDateCandidate, '2025-04-09');
  assert.equal(calls, 0);
  await assert.rejects(fetchKlsescreenerPaymentDates([], { ticker: '1155.KL', fetchImpl: async url => { calls++; assert.match(url, /ticker=1155\.KL/); return { ok: true, json: async () => ({ ticker: '1066.KL', events: cached.events }) }; } }), /与股票代码不匹配/);
  assert.equal(calls, 1);
  await assert.rejects(fetchKlsescreenerPaymentDates([], { ticker: 'AAPL', fetchImpl: async () => { calls++; } }), /支持四位或五位/);
});
