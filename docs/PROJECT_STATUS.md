# Margin Share Calculator — Project Status

> Updated: 2026-10-21 (Asia/Kuala_Lumpur)

## Identity
- Repository: jaronhoh/margin-share-calculator
- Branch: main
- Product: 马来西亚股票融资计算器（Margin Share Calculator）
- Source reference: user-provided Leverage Calculator.xlsx; formula equivalence pending verification.

## Status
| Area | Status |
|---|---|
| Requirements discussion | Confirmed core rules; PRD draft pending |
| Development | Not started |
| Formula parity testing | Not started |
| Live Malaysian market-data API validation | Not started |
| Deployment | Not started |

## Decisions
- Only Bursa Malaysia equities; single-layer broker margin financing, no personal-loan layer.
- Primary goal: dividend-funded financing, with historical backtesting from user start date through today by default.
- Daily interest accrual, fixed annual interest rate, accumulated interest capitalized into margin loan monthly.
- Dividends reduce loan; when actual LSR falls to a user-configurable lower trigger (e.g. 55%), simulate borrowing and share purchases toward target LSR (e.g. 60%).
- Margin-call response strategy selected once per simulation: cash top-up OR sell shares to repay debt. Apply consistently throughout backtest. Only address the shortfall to just below margin-call threshold (e.g. 70%); avoid excess top-ups or sales.
- Automatic historical prices and dividend data, with user corrections overriding provider data.
- Single-page application with separate advanced-settings panel. Optional brokerage, clearing, stamp-duty costs; disabled by default for Excel comparison.
- Opening the page restores defaults. Export/import full JSON simulation configuration, including main inputs, advanced settings and manual data overrides. End date defaults to today.

## Open questions / implementation risks
- Confirm exact top-up accounting (collateral cash versus loan repayment) and sell-to-repay algebra, minimum trade lot and rounding.
- Confirm forced-sale handling at force-sell threshold, and what happens when top-up funds or sellable shares are insufficient.
- Verify actual Bursa Malaysia historical data coverage, corporate actions, dividend ex-date versus payment date, and data provider licensing/rate limits.
- Audit spreadsheet formula anomalies and determine intended parity rules before implementation.
- Define execution order for interest capitalization, dividend crediting, threshold checks and trading on same day.

## Change log
| Date | Action | Evidence |
|---|---|---|
| 2026-10-21 | Initialized project status with user-confirmed discussion decisions; no implementation or deployment claimed. | User discussion |

## Next action
Draft PRD and acceptance tests; verify formula and data-source feasibility before coding.
