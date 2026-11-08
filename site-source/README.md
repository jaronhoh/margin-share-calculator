Current rule: [month-end capitalization](docs/MONTH_END_CAPITALIZATION.md), as confirmed on 2026-10-22. Earlier first-day references below are historical.

# Margin Share Calculator — Owner-only Site PoC

Owner-only isolated ChatGPT Site PoC for daily margin-financing backtests of Bursa Malaysia stocks. MAYBANK 1155.KL is the default dataset from the user-provided Excel Table2; other Yahoo Finance Bursa tickers ending in `.KL` can be selected, fetched, reviewed, and saved as browser-local price snapshots. The 24 original editable dividend events are MAYBANK-specific and are not applied to another ticker. It does not connect to Bursa data services, brokerage accounts, or production Sites. Excel dividend dates have not been independently verified as payment dates.

## Run checks

```sh
node tests/engine.test.mjs
```

The static application is in `dist/`. It has separate backtest and dividend-event screens; dividend entries are editable and apply to the active simulation. The calculation engine is source-controlled in `src/` and copied to `dist/engine.mjs` for the static deployment. JSON exports include configuration, editable dividend events, and the exact built-in price dataset identity; imports validate the complete configuration and events before applying them.

Share classification: initial own shares are tracked as cash holdings; initial financed shares and automatic refinance purchases are tracked as financed holdings. The sell-to-repay strategy sells financed holdings first and applies proceeds to the loan. On a cash margin call, the top-up funds the minimum whole-lot cash-share purchase needed to get below the release LSR, including configured fees; it does not remain as collateral cash or reduce the loan. Discretionary cash trading is not supported.

## Model limits

The deterministic daily sequence and several operational details remain PoC assumptions, as listed in the GitHub PRD. The engine stops at the unresolved force-sell line. The Excel panel checks the confirmed seed row and reported test values; it is not a 4,018-row workbook recalculation.


Current correction: [First-day capitalization and executed checks](docs/FIRST_DAY_CAPITALIZATION.md). Default start is 2015-01-01. Original Excel dividend list is still required; the page explicitly marks it pending.


Excel follow-up: all 24 Table1 MAYBANK events are prefilled with source-row provenance and unverified payment-date labels. See [import/regression report](docs/EXCEL_IMPORT_REGRESSION.md). Previous missing-file notices above are historical. Prices use the workbook close-price cache; independent provider and cached-formula parity verification remains incomplete.

Current UI and engine release: [share classification and sell-to-repay report](docs/TRANSACTION_SHARE_CLASSIFICATION_V20.md).

Daily ledger CSV export: [UI v21 report](docs/DAILY_LEDGER_CSV_V21.md). It exports every generated simulation row, including close prices and separate cash/financed share transaction columns, regardless of the current ledger page or display filter.

Cash margin-call adjustment: [UI v22 report](docs/CASH_TOPUP_BUYS_SHARES_V22.md).

Current source changes: [UI v23 initial cash allocation and Bursa transaction-cost estimate](docs/INITIAL_CASH_AND_BURSA_FEES_V23.md). Deployment state is recorded in that report after the matching source commit is published to the existing Site.
