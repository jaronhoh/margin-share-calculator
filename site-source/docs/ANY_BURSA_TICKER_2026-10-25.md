# Bursa ticker selection and Yahoo historical calendar expansion — 2026-10-25

## Behavior

- MAYBANK (`1155.KL`) is the default Excel-backed price snapshot. The app accepts Bursa Malaysia Yahoo Finance symbols ending in `.KL`; an alternate symbol is never simulated against the MAYBANK snapshot.
- For another ticker, Yahoo Close rows are expanded across the whole returned history to the current Malaysia date. Weekend and confirmed Bursa closure rows carry the prior close with `carryForward`, `carryForwardFrom`, and a reason/source. A missing weekday without confirmed closure evidence stops the import with the exact date; it is not inferred from public-holiday calendars.
- The user reviews the price diff, candidate backtest and before/after metrics, then confirms saving. Price conflicts and user manual values retain the existing explicit-selection and rollback protections.
- The 24 Excel dividends are MAYBANK-specific. They are not applied to other tickers; Yahoo Ex-Date events remain separate and do not become payment dates automatically.
- The header distinguishes the selected ticker from the ticker of the currently loaded snapshot, and a run-time ticker mismatch is shown beside the results instead of only in the settings drawer.

## Verification

- `tests/yahoo-calendar.test.mjs`: full-range weekend carry-forward, consecutive confirmed closure carry-forward and evidence, unconfirmed weekday rejection, duplicate dates and invalid prices.
- `tests/yahoo-chart.test.mjs`: Yahoo parser and request tests include `1066.KL` as well as the default ticker.
- `tests/site-worker.test.mjs`: Worker route forwards `1066.KL` to Yahoo.
- `tests/ui-neutral.cjs`: 2152, 1440, 1075 and 390 px × light/dark; trading-day-only CSV ledger, month-end filter, date location, chart and tooltips, dividend regression, and visible explanation when `1066.KL` is selected while the `1155.KL` snapshot is loaded.
- Historical closure data is still partial: 2015–2021 `BLOCKED`; 2022–2026 `PARTIAL`. A Yahoo history import that crosses an unconfirmed missing weekday correctly stops at that date until authoritative closure evidence or manually verified prices are supplied.
- Existing Site URL, owner-only access, runtime configuration and browser-local data are preserved by source deployment.

## Release

- Source commit and Sites version are recorded in `docs/PROJECT_STATUS.md` after publication succeeds.
