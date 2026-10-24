# P3 + F05 implementation and verification — 2026-10-25

## Release summary

- F05 chart changes and a reviewed CSV price-update workflow are implemented on local branch `feat/f05-stock-price-p3`.
- Follow-up F05 hardening: an empty valid-price series now omits the RM/share tick labels and title instead of rendering invalid numeric ticks. The F05 static regression and the full eight-file Node suite pass after this change.
- **F05 visual acceptance remains BLOCKED**: local preview HTTP serving is denied by the workspace, the installed headless Chromium process is denied by macOS process policy, and the in-app browser rejects `file:` URLs. No security workaround was attempted. Therefore desktop/mobile, light/dark, and live chart-interaction acceptance are still not certified.
- The Yahoo Chart URL returned live Maybank history in a read-only browser request. Automatic Yahoo integration is not enabled: the endpoint is undocumented, CORS was blocked from this environment, its automated-use permission is not established, and its trading-day-only data cannot be safely treated as continuous daily inputs.
- This is **not a complete P3 release**. The dividend review pipeline, real-browser acceptance, and several failure-path tests remain open. The existing Site was not deployed.

## P3 API evidence and decisions

The request used `period1=1420070400`, `period2=1792886400`, `interval=1d`, and `events=div,splits` for `1155.KL`.

- **PASS — live response:** 2,907 daily records from 2015-01-02 through 2026-10-23, in MYR, with `Asia/Kuala_Lumpur` timezone metadata. The response contains separate raw `close` and `adjclose`; backtests must use raw `close` when dividend events are modeled separately.
- **PASS — dividend field distinction:** 24 dividend events were present (RM6.88 total). The event dated 2021-05-28 is RM0.385, matching the audited ex-date/announcement amount. This event date is not the workbook's 2021-06-28 payment date. API dividend events are not imported or counted as paid cash.
- **NOT VERIFIED — split completeness:** the response did not include a splits key. That does not establish a complete corporate-action history.
- **BLOCKED — CORS:** a cross-origin test could not run because the browser security policy blocked local test origins. No proxy or policy workaround was used.
- **NOT RUN — provider failure/rate limit/empty response:** no controlled Yahoo outage, 429, or empty response was induced.
- **NOT RUN — Sites network compatibility:** the production Site was not changed, and API access from the Site runtime was not tested.
- **BLOCKED — production authorization:** Yahoo's current Terms of Service restrict automated collection without express prior permission. The undocumented Chart endpoint has no evidence of permission for this use or retention. No automatic Yahoo fetch or persistent Yahoo cache was added.
- **Data coverage constraint:** Yahoo returned trading days, not the continuous calendar-day rows consumed by the current engine. The complete Bursa holiday calendar is still unavailable, so gaps were not forward-filled or classified as closed-market dates.

## P3 reviewed CSV fallback

- **PASS — automated tests:** CSV parsing, KL ISO dates, malformed and duplicate dates, invalid/nonpositive/outlier prices, same/new/conflict classification, immutable candidate snapshots, manual-price provenance retention, and missing-day rejection.
- **IMPLEMENTED — UI flow (static review):** load state, row-by-row review, conflicts unselected by default, candidate backtest, nine-metric comparison, apply and cancel controls, and stale-candidate guard. The CSV path does not modify dividends.
- **NOT RUN — interactive cancel/apply/save-failure rollback:** no real-browser run or injected storage failure was available. Unit coverage proves candidate construction does not mutate the active input snapshot; it does not prove the complete UI transaction rollback.
- **NOT RUN — dividend duplicate confirmation:** Yahoo dividends are not connected to the CSV update UI, so duplicate-event preview, source selection, and human confirmation are not implemented in this branch.
- **PASS — JSON regression coverage:** existing tests cover legacy configuration compatibility, source metadata and manual price provenance. Full end-to-end export/import through the browser remains unverified.

## F05 chart

- **PASS — automated regression:** the chart reads the exact backtest row price, uses a separate outer right price axis while retaining the LSR right axis, includes a price legend toggle and Tooltip row, and leaves missing-price gaps unconnected. Empty price data omits price ticks instead of producing non-finite labels.
- **PASS — GitHub CI:** follow-up `Site source tests` run 10 (`40115049863`) succeeded for test commit `4f8c816e849c31e0024a34ab2c846a958d36888a`; the later report-only commits do not change the tested source.
- **PASS — date-filter implementation review:** the chart redraw is driven by the filtered backtest result.
- **BLOCKED — rendered desktop/mobile and light/dark matrix:** browser-based visual and interaction acceptance could not run under this environment's URL/process security controls. AC-F05-PRICE-05 is not certified.

## P0 regression and test matrix

`node --test tests/*.test.mjs`: **8 test files passed, 0 failed**. Included output:

- 27 engine cases;
- 48,216 daily regression numeric checks across the synthetic fixtures;
- 276,096 independent P0 numerical assertions and 17,256 wealth-conservation checks;
- 24 dividend source rows and JSON provenance checks;
- Bursa fee/rounding/lot and P3 CSV market-data tests;
- F05 chart static regression.

The named P0 business rules remain covered by those engine and oracle tests: daily interest, month-end capitalization, dividend debt payment, refinancing, margin-call cash and sell strategies, transaction fees, 100-share lots, and own/financed share accounting. The full workbook comparison harness `tests/excel-regression.mjs` is **NOT RUN** because the workbook path and as-of argument were not supplied. These automated checks are not Excel parity certification.

## Required statuses

| Check | Status | Evidence / limitation |
|---|---|---|
| Yahoo API normal response | PASS | Browser direct request returned 2,907 dates and 24 dividend events |
| Yahoo unavailable/error | NOT RUN | No outage induced |
| Yahoo CORS | BLOCKED | Browser refused local cross-origin test origin |
| API empty response / rate limit | NOT RUN | Not induced |
| Price duplicate/invalid data | PASS | CSV parser automated test |
| Manual price protection | PASS | Merge/provenance unit test; human review required to select conflicts |
| Dividend duplicate detection/approval | NOT RUN | Dividend API pipeline not implemented |
| Ex-Date vs Payment Date | PASS | Live event compared with issuer audit; API event not treated as paid date |
| Cancel/apply rollback UI | NOT RUN | No real-browser/failure injection |
| JSON metadata compatibility | PASS | Existing automated tests; browser flow not exercised |
| Rebacktest result comparison | NOT RUN | Implemented in UI path, not exercised in browser |
| F05 price/axis/toggle/Tooltip/gaps | PASS | Static regression only |
| F05 desktop/mobile, light/dark UI | BLOCKED | Local server denied; Chromium launch denied; in-app browser rejects local file URL |
| P0 automated regression | PASS | 8 test files; counts above |
| Excel cache equivalence | BLOCKED | Existing audited mismatch remains; no workbook path provided |

## GitHub and Sites

- GitHub PR: [#1 — P3 + F05](https://github.com/jaronhoh/margin-share-calculator/pull/1), **Draft / open / not merged**. The application source snapshot, regression tests, report and workflow are on the feature branch. The branch is based on `4b7d4b5db11df1b047a6cf7072595171c4f7e3e6`, ahead 27 commits and behind 0; latest head `ff1d9c50f4ac58e77c4168c61b319a9bacadc8fd`.
- GitHub Actions: **PASS**, latest `Site source tests` run 6 (`40114613077`): 8/8 test files passed. Run 1 failed because the large JSON fixture was truncated during transfer; the complete file was restored and subsequent runs passed.
- Local Site-source checkout commit: `2e5e8521e7e17394eb82f2295c468d94f1f35cd5`.
- Sites: **not deployed**. Existing Version 30 / UI v24, URL, owner-only policy, settings and production data remain untouched.
- The two audited dividend amount discrepancies (2021-06-28 RM0.39 vs RM0.385; 2021-01-15 RM0.14 vs RM0.135) and the existing 24 manual rows are unchanged.
