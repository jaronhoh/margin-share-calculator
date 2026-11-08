> Historical Version 4 report. Its month-end rule and test results are superseded by [FIRST_DAY_CAPITALIZATION.md](FIRST_DAY_CAPITALIZATION.md). Excel comparisons below were not rerun for the new rule.

# Margin Share Calculator Synthetic PoC — Test Report

Date: 2026-10-21 (Asia/Kuala_Lumpur)

## UI corrections (Site v4)

- The daily ledger now labels the generated per-day price as “开盘价”; the engine uses the neutral `price` property throughout instead of `close`. The first synthetic date equals the entered start-date opening price, with deterministic price movement beginning on the next day. This is a display/model-field correction and does not add a live or historical price feed.
- Added a dedicated “股息事件” screen, separate from backtest settings, with editable payment dates and per-share MYR amounts, add/remove controls, and a save-and-return action. The backtest applies matching-date events (and sums multiple entries on the same date); invalid dates or negative/non-numeric amounts are rejected.
- Added a stock-code field (default `1155.KL`) for scenario identification; it does not trigger symbol lookup or market-data access.
- JSON config import/export now carries the stock code and dividend event list.


- The top navigation switches between the backtest screen and dividend-event screen without discarding the current inputs.

## Scope

- The Owner-only Site contains generated synthetic prices and dividends only. It does not connect to Bursa data services, brokerage accounts, or other Sites.
- A separate local-only comparison used the source workbook's cached daily price, dividend, and trade-day columns. The workbook itself and extracted row data are not in the Site source.
- Daily interest is calculated on a 365-day basis and capitalized at calendar month end. Payment-date dividends first reduce the loan.
- Refinance uses a solved target-LSR purchase amount. Margin-call branches are cash-funded whole-lot stock purchases and sell-to-repay.
- Model comparison assumptions: 60% target LSR, 58% refinance trigger, 70% margin call, 80% force-sell stop, 100-share lot, 0% fee, and a 0.1 percentage-point safety gap. The safety gap and force-sell behavior remain unconfirmed; the engine stops at the force-sell line.
- The workbook's trade-day flag controls trade actions; interest still accrues every calendar day.

## Automated test result

`node tests/engine.test.mjs`: **16 passed, 0 failed** (including the generic daily-price ledger field).

Coverage: Excel initial-share/loan example, daily interest, January/February month-end capitalization, dividend repayment and surplus, refinance target solving, both margin-call branches, proportional fees, price-rise refinance trigger, unresolved force-sell stop, invalid inputs, nonnegative trade shares, and trading-day gating.

## Full daily Excel cache comparison

Reproducible local workflow:

1. `python tools/extract_excel_cache.py <Leverage-Calculator.xlsx> <daily-cache.json>` (requires `openpyxl`).
2. `node tests/excel-diff.mjs <daily-cache.json>`.

The workbook contains **4,018 calendar dates from 2015-01-01 through 2025-12-31**. Both strategies processed all 4,018 rows without hitting the 80% stop. The five confirmed seed checks also pass: 28,500 shares, RM156,807 initial loan, RM261,345 initial market value, 60% starting LSR, and RM21.48041096 first-day interest at 5%.

| Check | Excel cached output | Corrected PoC engine |
|---|---:|---:|
| Month-end capitalization | 0 of 132 month ends nonzero | Month-end accrual capitalized in the engine |
| Negative trade-share outputs | R: 40; T: 43 | 0 in both strategy runs |
| Loan / shares / LSR / daily-interest rows differing from Excel cache | — | 4,016 of 4,018 rows in each strategy branch (tolerances documented in `tests/excel-diff.mjs`) |

This is a **full-row comparison against saved Excel cached values**, not a recalculation of every workbook formula by Excel. The difference is expected and substantial because the cache has no monthly capitalization and contains negative trade quantities, while the PoC applies the PRD's monthly-capitalization rule and nonnegative conditional trades. The Excel cache is not accepted as the corrected engine's expected output. The two strategy branches are scenarios, not a user-confirmed choice.

## Remaining limits

Historical provider validation, dividend payment-date truth, Bursa holiday calendar, company actions, actual trading fees, minimum-lot confirmation, forced-sale behavior, insufficient-collateral handling, and cash/return accounting are still open. No production Site or existing Site was changed. This PoC is not for real investment decisions.
