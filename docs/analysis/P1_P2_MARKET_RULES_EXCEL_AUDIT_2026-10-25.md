# P1 + P2 audit — 2026-10-25 (Asia/Kuala_Lumpur)

## Release decision

* **P1: BLOCKED (partial evidence).** Dated statutory stamp-duty regimes and the 2019 settlement-cycle change are evidenced. The complete Bursa closure calendar for 2015–2026, historical Maybank margin-account tariffs, exact account tax base, and customer contract interest terms remain unverified. Fourteen of 24 dividend events have an issuer event notice matching workbook amount/date; two notices show amount discrepancies; three older annual-report rows verify only payout history; five events remain without event-level evidence. No P1 business rule was silently backfilled.
* **P2: BLOCKED for Excel equivalence; PASS for calculation checks.** Six automated Node test files pass. The corrected full-cache regression harness passes 69,024 row-level invariant checks for both strategies combined. The 4,314-day full workbook comparison still materially differs. Microsoft Excel 16.114.1 on macOS was used, but Excel showed a workbook-repair warning when opening the copy; native full-workbook equivalence is therefore not certified. The original workbook and its source copy have the same SHA-256 `3637f45cea0dd6b41b66bab69a370a57da3d02b3d23bc5080abad6535eb100d2`.
* **No app logic changed and no Site deployment was made.** The existing Site remains Version 30 / UI v24 at the original URL. Current Sites API read (2026-10-25) confirms custom access with one owner, zero external visitors, zero groups and zero editors; access revision remains 1. Preserve Version 30 while P1/P2 gates are unresolved.

## Scope and source identity

Reviewed the GitHub [project status](https://github.com/jaronhoh/margin-share-calculator/blob/main/docs/PROJECT_STATUS.md), [P0 audit](https://github.com/jaronhoh/margin-share-calculator/blob/main/docs/analysis/P0_FINANCIAL_ENGINE_AUDIT_V24_2026-10-24.md), and [PRD](https://github.com/jaronhoh/margin-share-calculator/blob/main/prd/PRD%E6%96%87%E6%A1%A3.md). The latest GitHub `main` docs commit at audit time is `7539a1e902307531998bde8549f5357a03d8bb6c`; its status page records the last verified Site source commit as `34e19990cd6f6101ec43fffacf2f862d62759119`. Sites API confirms Version 30 uses that source SHA and deployment `appgdep_6adc7a5903208191bf7d38681099114a`. GitHub docs and the Sites source/deployment are separate release tracks.

Workbook is `/Users/jaron/Desktop/Leverage Calculator.xlsx`; it was not modified. The 4,314 Table2 rows are consecutive calendar dates from 2015-01-01 through 2026-10-23. Table2 carries a close on weekends and uses a weekday-style issue flag; that alone does not establish exchange open/closed status or quote timestamp semantics. The Site derives `tradeAllowed` from Monday–Friday and has no complete historical Bursa holiday calendar. A weekday proxy may permit trading on Bursa closures.

## Dividend event ledger

Workbook Table1 labels these 24 dates “Payment Date”. Issuer notices below establish ex-date, entitlement/record date and payment date where listed. “Verified” means the issuer event page matches the workbook payment date and per-share amount; it does not establish how the simulator should resolve same-day holdings or dividend cash application. Partial annual-report references are not event-level ex/record-date proof.

| Workbook payment date | Workbook RM/share | Finding and evidence |
|---|---:|---|
| 2026-10-22 | 0.31 | Verified: [Maybank notice 2626995](https://maybank.listedcompany.com/news.html/id/2626995), ex 2026-09-23, entitlement 2026-09-24, payment 2026-10-22. |
| 2026-03-26 | 0.33 | Verified: [Maybank notice 2601075](https://maybank.listedcompany.com/news.html/id/2601075), ex 2026-03-12, entitlement 2026-03-13, payment 2026-03-26. |
| 2025-09-26 | 0.30 | Verified: [Maybank notice 2577543](https://maybank.listedcompany.com/news.html/id/2577543), ex 2025-09-11, entitlement 2025-09-12, payment 2025-09-26. |
| 2025-03-26 | 0.32 | Verified: [Maybank notice 2539268](https://maybank.listedcompany.com/news.html/id/2539268), ex 2025-03-12, entitlement 2025-03-13, payment 2025-03-26. |
| 2024-09-26 | 0.29 | Verified: [Maybank notice 2508849](https://maybank.listedcompany.com/news.html/id/2508849), ex 2024-09-11, entitlement 2024-09-12, payment 2024-09-26. |
| 2024-03-26 | 0.31 | Verified: [Maybank notice 2481540](https://maybank.listedcompany.com/news.html/id/2481540), ex 2024-03-13, entitlement 2024-03-14, payment 2024-03-26. |
| 2023-09-27 | 0.29 | Verified: [Maybank notice 2457262](https://maybank.listedcompany.com/news.html/id/2457262), ex 2023-09-14, entitlement 2023-09-15, payment 2023-09-27. |
| 2023-03-24 | 0.30 | Verified: [Maybank notice 2429463](https://maybank.listedcompany.com/news.html/id/2429463), ex 2023-03-13, entitlement 2023-03-14, payment 2023-03-24. |
| 2022-10-19 | 0.28 | Verified: [Maybank notice 2404911](https://maybank.listedcompany.com/news.html/id/2404911), ex 2022-09-19, entitlement 2022-09-20, payment 2022-10-19. |
| 2022-04-14 | 0.30 | Verified: [Maybank notice 2377167](https://maybank.listedcompany.com/news.html/id/2377167), ex 2022-03-16, entitlement 2022-03-17, payment 2022-04-14. |
| 2021-10-21 | 0.28 | Verified: [Maybank notice 2352047](https://maybank.listedcompany.com/news.html/id/2352047), ex 2021-09-22, entitlement 2021-09-23, payment 2021-10-21. |
| 2021-06-28 | 0.39 | **Amount discrepancy:** [Maybank notice 2336059](https://maybank.listedcompany.com/news.html/id/2336059) says RM0.385, ex 2021-05-28, entitlement 2021-05-31, payment 2021-06-28. Workbook RM0.39 differs by RM0.005/share. |
| 2021-01-15 | 0.14 | **Amount discrepancy:** [Maybank notice 811284](https://maybank.listedcompany.com/news.html/id/811284) says RM0.135, ex 2020-12-17, entitlement 2020-12-18, payment 2021-01-15. Workbook RM0.14 differs by RM0.005/share. |
| 2020-05-06 | 0.39 | Pending: no matching issuer event page establishing this exact payment/entitlement date was captured. |
| 2019-10-02 | 0.25 | Pending: no matching issuer event page establishing this exact payment/entitlement date was captured. |
| 2019-06-07 | 0.32 | Pending: Maybank [DRP announcement 713439](https://maybank.listedcompany.com/news.html/id/713439) discusses the FY2018 final dividend and book closure but the captured source does not establish the workbook payment date and full event fields. |
| 2018-10-30 | 0.25 | Verified: [Maybank notice 679673](https://maybank.listedcompany.com/news.html/id/679673), ex 2018-09-28, entitlement 2018-10-02, payment 2018-10-30. |
| 2018-07-06 | 0.32 | Pending: no matching issuer event page establishing this exact payment/entitlement date was captured. |
| 2017-11-01 | 0.23 | Verified: [Maybank notice 604488](https://maybank.listedcompany.com/news.html/id/604488), ex 2017-09-29, last lodgment 2017-10-03, payment 2017-11-01. |
| 2017-06-06 | 0.32 | Verified: [Maybank notice 580087](https://maybank.listedcompany.com/news.html/id/580087), ex 2017-05-04, last lodgment 2017-05-08, payment 2017-06-06. |
| 2016-10-25 | 0.20 | Pending: no matching issuer event page establishing this exact payment/entitlement date was captured. |
| 2016-06-03 | 0.30 | Partial: Maybank [2016 Annual Report, Part 2](https://maybank.listedcompany.com/newsroom/Maybank_AR2016_Corporate_-_Part_2.pdf) supports the older dividend history/payout; event-level ex-date and entitlement date remain unverified here. |
| 2015-11-11 | 0.24 | Partial: Maybank [2015 Annual Report, Part 1](https://maybank.listedcompany.com/newsroom/Maybank_AR15CorpPart_1.pdf) supports dividend history; event-level ex-date and entitlement date remain unverified here. |
| 2015-05-26 | 0.33 | Partial: Maybank [2015 Annual Report, Part 1](https://maybank.listedcompany.com/newsroom/Maybank_AR15CorpPart_1.pdf) supports dividend history; event-level ex-date and entitlement date remain unverified here. |

The simulator currently applies each event on its stored date using that date’s opening share count, pays down debt before risk actions, and stores the editable date as an unverified payment date. If a date is a payment date, entitlement generally derives from the earlier entitlement/record date; the simulation’s same-day holdings rule therefore needs a confirmed product decision and should not be changed by inference.

## Dated market and fee evidence

* **Stamp duty:** use dated law, not the current fee table as a historical series. MOF [Budget 2022 appendix](https://www.mof.gov.my/portal/arkib/budget/2022/bs22.pdf) documents the pre-2022 0.10% / RM200 cap context and the listed-share brokerage service-tax exemption effective 2022-01-01; this source does not independently certify every year back to 2015. Bursa’s 2021-12-30 notice, reproduced by [Bernama](https://www.bernama.com/en/news.php?id=2039018), states 0.15%, RM1.50 per RM1,000 or fraction, RM1,000 cap from 2022-01-01. Gazette [P.U.(A)208/2023](https://www.bursamalaysia.com/sites/5d809dcf39fba22790cad230/assets/64afd1955b711a2b9fe10555/PUA_208_2023.pdf), made 2023-07-12, remits the rate above 0.10% and cap above RM1,000 from 2023-07-13 through 2028-07-12. Rounding is by RM1,000 block, not raw percentage.
* **Clearing/brokerage/SST:** Maybank’s current [non-margin share page](https://www.maybank2u.com.my/Investment-bank/en/retail-investors/products/stocks-trading/cash/non-margin.page) gives undated non-margin rates and still lists the superseded RM200 stamp cap. The current [SMF1 PDS dated 2025-12-23](https://www.maybank2u.com.my/iwov-resources/pdf/personal/loans/investment/share-margin-pds.pdf) refers generally to charges and daily accrual but supplies no historical margin brokerage tariff, minimum, day-count denominator, holiday convention, capitalization timing or dividend sequence. The products differ, so the webpage/PDS figures cannot be combined or backdated. Historical margin brokerage and clearing-cap history remain unconfirmed. Bursa [GST zero-rate announcement effective 2018-06-01](https://mondovisione.com/media-and-resources/news/bursa-malaysia-gst-at-zero-rate-effective-1-june-2018-201861/) supports that dated fee tax transition; exact pre-2022 account tax base still needs contract/regulatory evidence.
* **Settlement:** Bursa consolidated rules marked as at 2019-04-29 specify T+2 for ready-basis contracts; [Clearstream’s 2019-03-25 notice](https://www.clearstream.com/clearstream-en/res-library/settlement/a19025-1493008) corroborates the transition. Pre-cutover T+3 vs post-cutover T+2 is established; applying either requires actual market business days.
* **Holiday calendars:** [Bursa’s 2022-11-18 closure notice](https://my.linkedin.com/posts/bursamalaysia_please-be-informed-that-bursa-malaysia-activity-6998282088604979200-EqyU) and [Maybank Securities notices archive](https://www.maybanktrade.com.sg/important-notices/index.html) confirm exceptional closures, including Nov 18/28 2022 and a special Raya closure notice in 2023. These examples do not constitute complete annual calendars. The complete 2015–2026 cash-equity holiday and special-closure set remains outstanding.

## P34 / Excel results

P34 is an array formula `IF(AND(B34=1,,P$3=1),O34,0)`; source XML caches P34=0 while B34=1, P3=1 and O34=RM665.892739726. In a native Excel 16.114.1 temporary workbook, `=AND(TRUE,,TRUE)` evaluated FALSE; the repaired-copy P34 cache remained 0 after Excel recalculation. Removing the empty argument changes the condition to true and produces the Jan 2015 capitalization value in the separate LibreOffice reproduction. This is a reproducible workbook-formula issue, but Excel’s repair warning prevents certifying a trustworthy whole-workbook native recalculation. Do not claim LibreOffice equals Excel or that native cache parity proves engine parity.

The Excel 16.114.1 recalculated copy’s cached values were unchanged from the source cache on all 4,314 dates for loan, daily interest, accrued interest, capitalized amount, shares, market value, LSR and dividend. The original file hash above remained unchanged. Comparison uses V30 logic, 5% annual rate, no fees, and the two configured margin-call strategies. Excel workbook “Own Capital” is compared with engine net worth (`market value − loan`); the workbook has no fee column, so comparison sets fees to zero.

| Metric | Cash: rows over tolerance / max absolute diff | Sell: rows over tolerance / max absolute diff | First difference |
|---|---:|---:|---|
| Loan (RM) | 4,284 / 551,177.63 | 4,284 / 260,854.64 | 2015-01-31: engine 157,472.89 vs Excel 156,807.00; +665.89 |
| Daily interest (RM) | 4,283 / 75.50 | 4,283 / 32.85 | 2015-02-01: 21.5716 vs 21.4804; +0.0912 |
| Accrued interest (RM) | 4,284 / 157,571.50 | 4,284 / 158,298.21 | 2015-01-31: 0 vs 665.8927; −665.8927 |
| Capitalized interest (RM) | 141 / 5,379.89 | 141 / 2,514.01 | 2015-01-31: 665.8927 vs 0 |
| Shares | 4,169 / 53,100 | 4,168 / 63,600 | 2015-05-26: 30,200 vs 28,500; +1,700 |
| Market value (RM) | 4,169 / 554,624 | 4,168 / 641,088 | 2015-05-26: 276,330 vs 260,775; +15,555 |
| Fees (RM) | 0 / 0 | 0 / 0 | Workbook fee schedule absent; both sides set to zero |
| Dividends (RM) | 23 / 16,089 | 23 / 19,716 | 2015-11-11: 7,248 vs 7,056; +192 |
| LSR | 4,284 / 0.197535 | 4,284 / 0.197557 | 2015-01-31: 0.633643 vs 0.630963; +0.002679 |
| Net assets / Own Capital (RM) | 4,284 / 96,257.52 | 4,284 / 443,847.57 | 2015-01-31: 91,047.11 vs 91,713.00; −665.89 |

First differences and propagation: P34 contributes the Jan 31 RM665.89 opening loan gap. The next day interest differs by RM0.0912 because the opening principal differs. From 2015-05-26 share and market-value differences appear as the model’s trading decision path diverges. Dividend totals then diverge as positions differ; two dividend source amounts also differ by RM0.005/share. By 2026-10-23, cash engine vs Excel: loan RM1,199,046.63 vs RM663,958, shares 183,400 vs 131,500, market value RM1,828,498 vs RM1,311,055, LSR 0.655755 vs 0.506430, net assets RM629,451.37 vs Own Capital RM647,097.00, total engine vs workbook dividends RM547,769 vs RM435,314. Sell strategy end: loan RM443,868.36, shares 67,900, market value RM676,963, LSR 0.655676, net assets RM233,094.64; the Excel cache is shared across the selected strategy comparisons and is not evidence those are equivalent strategies.

## Validation and changes

* Final automatic run: 6 Node test files passed, 0 failed: board lots, daily regression, dividends, engine, initial cash/costs, P0 audit. Checks include 27 engine cases, 24/24 dividend source rows, 48,216 daily regression numeric checks, 276,096 independent historical numeric checks, and 17,256 wealth-conservation checks.
* Full Excel comparison regression: after correcting its independent share-count invariant to include cash-purchased shares (cash margin top-ups), both strategies passed 34,512 invariant checks each across 4,314 rows (69,024 total). This fixes a test-oracle omission; it does not make the workbook cache match.
* One initial regression run failed on 2016-09-28 because that oracle omitted `cashBuyShares`; the harness was corrected and the complete regression then passed. The full suite was rerun after the correction.
* No PRD business rule was changed. No source-level finance rule was edited. No new Site was created, no access mode changed, no other project was touched and no production/sensitive financial data was used.

## Remaining gates

1. Obtain authoritative complete annual Bursa cash-equity holiday/special-closure calendars, vendor timestamp/date conventions, and verify the price/holiday flags.
2. Obtain dated margin-account contract notes/tariffs or Maybank SMF1 historical schedules for brokerage, minimums, clearing caps, fee rounding and applicable tax bases.
3. Resolve the five pending dividend events and exact ex/record/payment details for older annual-report-only rows; confirm corrections for the 2021 RM0.39/RM0.14 workbook amounts.
4. Recalculate a clean workbook copy in native Excel without repair warnings and capture the corrected-vs-original formula test; then complete itemized engine-vs-Excel comparisons. Until then P2 Excel parity remains blocked and the existing V30 Site should remain deployed.
