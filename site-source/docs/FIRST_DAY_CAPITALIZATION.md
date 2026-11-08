> Superseded for capitalization timing by [MONTH_END_CAPITALIZATION.md](MONTH_END_CAPITALIZATION.md). Latest user confirmation requires posting on the final calendar day, including that day. Results below describe the previous rule.

> Follow-up 2026-10-22: original workbook is now available. Dividend import and cache regression blockers below are resolved; see [EXCEL_IMPORT_REGRESSION.md](EXCEL_IMPORT_REGRESSION.md). Previous results below remain historical.

# First-day capitalization correction — 2026-10-21

This specification supersedes the previous calendar-month-end capitalization rule.

- Default backtest start: 2015-01-01. End: today's date in Asia/Kuala_Lumpur.
- At the beginning of each calendar month's first day, add all previously simulated days' pending interest to principal once, and reset that pending balance.
- Compute today's interest on the post-capitalization principal: principal × annual rate / 365, including weekends and leap days. Then apply dividends based on opening shares, margin-call handling and refinancing, in that order. Existing dividend/trade ordering is retained as the PoC convention, not independent confirmation of actual entitlement or broker practice.
- No accrual before the start date is assumed. A partial first month includes only simulated days. Unposted interest at the simulation end remains pending; no end-date posting is invented.
- Require consecutive valid calendar dates to prevent omitted accrual/postings.
- Ledger shows daily interest, end-of-day pending interest, today's capitalized amount, principal immediately after capitalization before dividends/trades, and end-of-day principal. A first-of-month filter makes postings easy to inspect.

## Executed validation

- Engine suite: 24 PASS, 0 FAIL. Includes Jan/Feb, leap February, year boundary, 30-day month, partial month, initial day, zero rate, nontrading first day and same-day capitalization/interest/dividend/refinance ordering.
- Independent monthly numeric oracle: both strategy configurations, each 4,018 synthetic daily rows (2015-01-01–2025-12-31), 131 postings; 48,216 numeric checks PASS. This fixture uses 2% interest and no risk triggers so the oracle isolates interest accounting; risk strategies are exercised separately by the engine suite. An initial 5% fixture triggered legitimate sell-to-repay actions, invalidating the no-trade oracle assumption; corrected the fixture and reran successfully.
- Browser local check: 4,312 rows, default 2015-01-01 through 2026-10-21, no displayed error. First-of-month filter: 142 rows. 2015-02-01 posting RM665.89 and same-day interest RM21.57. Added a synthetic RM0.10 dividend on first day; save returned to backtest without error and reduced loan by RM2,850. The temporary UI event is not shipped.
- Repaired the existing missing dividend-validation function and date corruption during JSON export.

## Blocked data work

The original Leverage Calculator.xlsx and prior extracted 4,018-row cache are absent from this local checkout and accessible conversation attachments. Table1's full MAYBANK list has NOT been re-read, imported or verified. Default dividend events are empty and the UI explicitly displays the missing-file condition. No dates or amounts have been reconstructed from web data or invented. Excel full-row parity was NOT rerun for this change. Previous cache-difference results in POC_TEST_REPORT.md describe the old model only.

Only appgprj_6ad816b7dd508191a8632550d36f375f is in deployment scope. Audience must remain owner-only.
