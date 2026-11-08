# Month-end capitalization — latest confirmed rule

2026-10-22: the user explicitly confirmed month-end posting. This supersedes all previous first-of-next-month specifications and reports.

- Calculate daily interest on opening principal using annual rate / 365.
- On the actual last calendar day, capitalize all pending accrual INCLUDING that day, then reset pending to zero. On the next day, interest uses updated principal; no duplicate posting.
- Retain existing same-day order after posting: opening-share dividends, margin call, refinancing.
- A first simulated date that is month-end posts only that simulated day. A partial month includes only simulated days. A midmonth end date leaves interest pending.
- Ledger retains daily interest, pending at day end, posting amount, post-capitalization principal before dividends/trades and final principal. Filter now shows month ends.
- Source Excel events and full-width layout retained.

## Executed checks

- 25 engine tests PASS, 0 FAIL, including December–January carry, leap February, month-end/nontrading/partial-month and same-day events.
- Independent synthetic oracle: 4,018 days for each of two configurations, 132 month-end postings each; 48,216 numeric checks PASS.
- All 24 source-dividend import tests PASS.
- Excel-cache equality remains FAIL; first difference now 2015-01-31. Original workbook not recalculated in Excel.

| Scope | Days/strategy | Strategy | Loan differences | Share differences | LSR differences | Daily-interest differences | Postings | Accounting checks |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| original2015to2025 | 4018 | cash | 3988 | 3873 | 3988 | 3987 | 132 | 32144 PASS |
| original2015to2025 | 4018 | sell | 3988 | 3873 | 3988 | 3987 | 132 | 32144 PASS |
| throughAsOf | 4313 | cash | 4283 | 4168 | 4283 | 4282 | 141 | 34504 PASS |
| throughAsOf | 4313 | sell | 4283 | 4168 | 4283 | 4282 | 141 | 34504 PASS |
| fullCacheIncludingFuture | 4383 | cash | 4353 | 4238 | 4353 | 4352 | 144 | 35064 PASS |
| fullCacheIncludingFuture | 4383 | sell | 4353 | 4238 | 4353 | 4352 | 144 | 35064 PASS |

The full cache includes 70 future dates after 2026-10-22, treated solely as a cache scenario. Current cache posting values are all zero; revised engine posts at month end. Snapshot and tolerances are documented in EXCEL_IMPORT_REGRESSION.md.
