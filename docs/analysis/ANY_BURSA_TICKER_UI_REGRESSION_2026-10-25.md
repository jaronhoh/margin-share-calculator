# Bursa ticker selection and regression follow-up

Date: 2026-10-25 (Asia/Kuala_Lumpur)

## Behavior

- MAYBANK (`1155.KL`) remains the default Excel price snapshot.
- Other Bursa Yahoo Finance `.KL` tickers, including `1066.KL`, use the existing safe update flow: fetch Close-only prices, validate currency/time zone/dates, review differences, build a candidate backtest, compare results, and explicitly confirm snapshot save. Manual price conflicts remain opt-in and failed writes roll back.
- Yahoo history is expanded over the complete returned date interval. Weekends and date-specific confirmed Bursa closures carry the prior close with `carryForward`, `carryForwardFrom`, `reason`, and the closure announcement source. A missing unconfirmed weekday stops the import with its date.
- MAYBANK's 24 Excel dividends are not automatically applied to other tickers. Yahoo Ex-Date events do not become payment dates.
- The header displays selected ticker versus the loaded snapshot ticker. A mismatch is now explained in the results area.

## Tests run

- Node automated suite: **13/13 test files passed**.
- P0 independent oracle: **276,096 numerical assertions** and **17,256 wealth-conservation assertions** passed.
- Historical comparison: **4,314 calendar days**, both strategies, all compared P0 fields unchanged; original **24 dividends** unchanged.
- Yahoo import tests: consecutive weekend carry-forward, confirmed consecutive Bursa closures with provenance, unconfirmed weekday rejection, duplicates, invalid prices, expanded 5,000-row cap, manual price protection, and rollback.
- `1066.KL`: parser/request and Worker forwarding tests use a fixture/mock response. A live full-history import/backtest was not performed.
- Chromium UI: **PASS**, 2152/1440/1075/390 px × light/dark (8 runs). Verified trading-day-only ledger and CSV, month-end filter, date location, chart/tooltips, 24-dividend regression, and visible mismatch explanation. Browser errors: **0**.

## Remaining data boundary

Only five historical Bursa closure dates are confirmed in this calendar. Coverage remains 2015–2021 `BLOCKED` and 2022–2026 `PARTIAL`. A full-history Yahoo import containing an unconfirmed missing weekday is rejected until that date is verified; this prevents the program from treating an unknown trading halt as a weekend or exchange holiday.

## Sites deployment

- Existing owner-only Site: Version 40, succeeded.
- Source commit: `728b695de3a29f104a3404679605f181d4645268`.
- Deployment: `appgdep_6add5bab99548191ae4e4ca153371a14`.
- Existing URL retained: https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/
- Access policy revision 1 retained; no browser-local market or dividend data was changed.
- GitHub Actions run 61 (ID `40151136852`): **SUCCESS** for PR head `5046a1d964da0ced4be565bec3fa677ad30296d3`.
