> Superseded for capitalization timing by [MONTH_END_CAPITALIZATION.md](MONTH_END_CAPITALIZATION.md). Latest user confirmation requires posting on the final calendar day, including that day. Results below describe the previous rule.

# Excel Table1 import and first-day capitalization regression

Date: 2026-10-22 (Asia/Kuala_Lumpur)

## Source snapshot

- Original workbook was read-only and unchanged. SHA-256: `4420e1219ab05d6b62e04c31bcafa01e7c92d2bb89457e9764f7b0b14f96e771`.
- Table1 A3:B26: all 24 records, 2015-05-26 to 2026-10-22, total MYR6.99 per share. Headers are Payment Date / Dividend; actual payment-date authenticity has not been independently verified. Source rows, dates, amounts and uncertainty labels are retained in the Site.
- Source row order retained (newest first); no truncation at row 24. Rows 25–26 contain both 2015 events.
- Table2 has 4,383 consecutive daily rows (2015-01-01–2026-12-31), including 70 dates after the 2026-10-22 as-of. Future cached values are only an arithmetic-comparison scenario, not observed historical prices. The Site still generates synthetic prices.
- This is a different snapshot from the prior report: current Table2 has no negative R/T trades; prior snapshot findings must not be applied to this file. All current P capitalization caches are zero.
- Table1 and Table2 per-share dividend inputs match on every date (0 mismatches).

## Executed checks

- 24 engine tests PASS, 0 FAIL. Existing 4,018-day independent synthetic oracle PASS: 48,216 numeric checks.
- Table1 import tests PASS: all 24 exact rows/values/metadata, sum, distinct dates, reset cloning, manual-edit provenance, JSON roundtrip, and each source dividend applied on its exact date.
- Browser PASS: 24 source entries and uncertainty labels, original amounts/dates, edit/save provenance, restore defaults, no displayed error. Exported JSON was actually downloaded and compared against all 24 extracted source events and metadata: exact match.
- Engine/input/UI syntax and diff checks PASS.
- Excel-app full formula recalculation was not performed. Cached-output equality FAIL, with differences explicitly counted below.

| Scope | Days per strategy | Strategy | Loan differences | Share differences | LSR differences | Daily-interest differences | Monthly postings | Reconciliation checks |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| original2015to2025 | 4018 | cash | 3987 | 3873 | 3987 | 3987 | 131 | 32144 PASS |
| original2015to2025 | 4018 | sell | 3987 | 3707 | 3987 | 3987 | 131 | 32144 PASS |
| throughAsOf | 4313 | cash | 4282 | 4168 | 4282 | 4282 | 141 | 34504 PASS |
| throughAsOf | 4313 | sell | 4282 | 4002 | 4282 | 4282 | 141 | 34504 PASS |
| fullCacheIncludingFuture | 4383 | cash | 4352 | 4238 | 4352 | 4352 | 143 | 35064 PASS |
| fullCacheIncludingFuture | 4383 | sell | 4352 | 4072 | 4352 | 4352 | 143 | 35064 PASS |

Tolerances: MYR0.01 loan/daily interest; 0.01 share; 1e-6 LSR. Reconciliation tolerance: 1e-6; discrete dates/counts exact. Each row reconciles opening loan + capitalized interest, post-capitalization daily interest, debt repayment/trade flows, share flows, accrued = total interest minus total capitalized, first-of-month posting and opening-share dividend eligibility. Both strategy configurations complete all requested scopes without force-sell blocking or negative engine trades.

First cache difference: 2015-02-01, in both strategies. The engine capitalizes previous January interest on February 1, while this workbook cache contains no capitalization. Trade-path differences then accumulate; cash-collateral and sell-to-repay are separate strategy scenarios, not assertions that the Excel chose either one.

## Reproduce without changing the workbook

1. `python tools/extract_dividends.py <workbook> dist/maybank-dividends.mjs <table1-audit.json>`
2. `python tools/extract_excel_cache.py <workbook> <daily-cache.json>`
3. `node tests/dividends.test.mjs <table1-audit.json>`
4. `node tests/engine.test.mjs` and `node tests/daily-regression.test.mjs`
5. `node tests/excel-regression.mjs <daily-cache.json> 2026-10-22`

Only the requested isolated Owner-only Site is in deployment scope. The workbook and full daily data are not included in its deployment or GitHub docs.
