# Margin Share Calculator — Project Status

> Updated: 2026-10-21 09:44 (Asia/Kuala_Lumpur)

## Identity
- Repository: jaronhoh/margin-share-calculator
- Branch: main
- Product: 马来西亚股票融资计算器（Margin Share Calculator）
- Source reference: user-provided Leverage Calculator.xlsx; formula equivalence pending verification.
- Isolated test Site: [Margin Share Calculator Synthetic PoC](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site) (Owner-only; no production Site modified).

## Status
| Area | Status |
|---|---|
| Requirements / PRD | Baseline v1.2 and PRD v0.5 on main; core rules confirmed, technical decisions remain open |
| Development | Isolated synthetic daily-engine PoC implemented; Site source commit a612e8c0ab65168e06461b3fb79408dbdef6724a |
| Automated tests | 14 PASS, 0 FAIL |
| Excel comparison | 5 seed-value checks PASS; full 4,018-row workbook recalculation not run |
| Live Malaysian market-data API validation | Not started |
| Isolated Site deployment | Site version 1 deployed successfully; Owner-only access verified |
| Product production release | Not deployed; no existing or production Site modified |

## Decisions
- Only Bursa Malaysia equities; single-layer broker margin financing, no personal-loan layer.
- Primary goal: dividend-funded financing, with historical backtesting from user start date through today by default.
- Daily interest accrual, fixed annual interest rate, accumulated interest capitalized into margin loan monthly.
- Dividends reduce loan; when actual LSR falls to a user-configurable lower trigger (e.g. 55%), simulate borrowing and share purchases toward target LSR (e.g. 60%).
- Margin-call response strategy selected once per simulation: cash top-up OR sell shares to repay debt. Apply consistently throughout backtest. Only address the shortfall to just below margin-call threshold (e.g. 70%); avoid excess top-ups or sales.
- Automatic historical prices and dividend data, with user corrections overriding provider data.
- Single-page application with separate advanced-settings panel. Optional brokerage, clearing, stamp-duty costs; disabled by default for Excel comparison.
- Opening the page restores defaults. Export/import full JSON simulation configuration, including main inputs, advanced settings and manual data overrides. End date defaults to today.

## Confirmed Excel clarification
- H3=11,400 own-funded shares; I3=17,100 margin-funded shares.
- K4=28,500 total shares; I4=I3×F4 converts shares to loan amount (RM156,807 at RM9.17).
- User confirmed RM9.17 is that day's MAYBANK price; independent historical market-data verification remains open.

## Price clarification (2026-10-21)
- User confirmed F4=RM9.17 is MAYBANK's share price on the relevant day; initial financed share quantity is converted at this price.
- Historical source/date verification has not been completed.

## Latest confirmed decision
- 2026-10-21: Initial financing loan value uses margin-funded share count multiplied by the selected stock's price on the backtest start date; Excel MAYBANK example F4=RM9.17.

## Open questions / implementation risks
- Confirm insufficient-funds/insufficient-shares behavior, sell-to-repay algebra, Bursa minimum lot and rounding; the PoC uses explicit assumptions.
- Confirm forced-sale handling at force-sell threshold; the PoC stops when the threshold is reached.
- Verify actual Bursa Malaysia historical data coverage, corporate actions, dividend ex-date versus payment date, and data provider licensing/rate limits.
- Recalculate and compare all 4,018 workbook rows when the original xlsx is available; cached arithmetic checks are not business parity.
- Confirm same-day event order; the PoC's deterministic order is documented but is not a frozen product decision.

## Change log
| Date | Action | Evidence |
|---|---|---|
| 2026-10-21 | User confirmed RM9.17 is that day's MAYBANK share price; synchronized requirements and PRD. | User clarification |
| 2026-10-21 | User confirmed F4=RM9.17 is the MAYBANK start-date price; synchronized requirements, PRD and audit. | User confirmation |
| 2026-10-21 | Confirmed H3/I3 are shares and corrected audit/PRD interpretation. | User choice B |
| 2026-10-21 | Created requirements baseline docs/REQUIREMENTS.md and linked PRD v0.2; documentation only. | GitHub commits 70fbbb3, 53f7fbb |
| 2026-10-21 | Initialized project status with user-confirmed discussion decisions; no implementation or deployment claimed. | User discussion |
| 2026-10-21 09:44 MYT | Deployed isolated Owner-only synthetic PoC Site version 1; 14 engine tests and five Excel seed-value comparisons passed; full workbook parity remains unverified. | Sites deployment appgdep_6ad818dce2d48191a18e54a7e92121ff; source a612e8c0ab65168e06461b3fb79408dbdef6724a |
| 2026-10-21 | Added synthetic PoC test/deployment report; original xlsx was unavailable for 4,018-row recalculation. | docs/analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md
| 2026-10-21 09:44 MYT | Deployed isolated Owner-only synthetic PoC Site version 1; verified 14 engine tests and five Excel seed-value comparisons; full workbook parity remains unverified. | Sites deployment appgdep_6ad818dce2d48191a18e54a7e92121ff; source a612e8c0ab65168e06461b3fb79408dbdef6724a |
| 2026-10-21 | Added synthetic PoC test/deployment report; original xlsx was not available for a 4,018-row recalculation. | docs/analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md

## Document links
- [Requirements baseline](REQUIREMENTS.md)
- [PRD v0.5](../prd/PRD文档.md)
- [Synthetic Site PoC test and deployment report](analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md)

## Next action
Obtain the original Leverage Calculator.xlsx for full row-by-row comparison; resolve the remaining business rules and Bursa data-provider feasibility before treating this PoC as product-ready.
