# P3 + F05 implementation and verification — 2026-10-25

## Release summary

- F05 chart changes and a reviewed CSV price-update workflow are implemented on local branch `feat/f05-stock-price-p3`.
- Follow-up F05 hardening: an empty valid-price series now omits the RM/share tick labels and title instead of rendering invalid numeric ticks. The F05 static regression and the full eight-file Node suite pass after this change.
- **F05 visual acceptance: PASS**: after requesting the supported local-preview network permission, Chromium verified 1440×900 and 390×844 in light and dark themes. The first mobile pass found a legend overflow; the responsive legend was fixed and the entire four-case matrix then passed without horizontal overflow.
- The Yahoo Chart URL returned live Maybank history in a read-only browser request. Automatic Yahoo integration is not enabled: the endpoint is undocumented, CORS was blocked from this environment, its automated-use permission is not established, and its trading-day-only data cannot be safely treated as continuous daily inputs.
- This is **not a complete automatic-API P3 release**. The reviewed dividend-import pipeline and local snapshot persistence have since been implemented and tested as recorded in the continuation section below; provider authorization, runtime/API error tests and some failure-injection gates remain open. F05 was separately verified and deployed to the existing Site as Version 32.

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

- **PASS — automated regression:** the chart reads the exact backtest row price, uses a separate outer right price axis while retaining the LSR right axis, includes a price legend toggle and Tooltip row, leaves missing-price gaps unconnected, and omits price ticks when no valid price exists.
- **PASS — real-browser matrix:** Chromium tested 1440×900 and 390×844 in both themes. Price-axis tick bounds remained inside the chart; hiding/restoring the legend removed/restored exactly one price path; keyboard Tooltip showed 2015-01-02 RM9.12 plus the existing financial series; Escape hid it; no page errors or horizontal page overflow.
- **PASS — date filtering and actual input prices:** setting 2015-01-01 through 2015-01-03 produced matching x-axis dates and three price points, matching the ledger's RM9.17/RM9.12/RM9.12.
- **PASS — non-trading carry-forward label:** Jan 3 and Jan 4 tooltips explicitly identify the reused 2015-01-02 close RM9.12.
- **PASS — GitHub CI:** follow-up `Site source tests` run 19 (`40115682576`) passed on the responsive F05 test commit. The later weekend-label change was locally tested and is included in the Site release commit; it is not yet on the GitHub PR branch.

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
| Dividend duplicate detection/approval | PASS | New CSV review unit tests and local browser review; explicit approval is required |
| Ex-Date vs Payment Date | PASS | Missing Payment Date is rejected; Ex-Date is never substituted |
| Cancel update | PASS | Local browser confirms original 24 dividends / price range remain unchanged |
| Snapshot rollback | PASS | Unit injected storage and post-commit failures; browser quota injection NOT RUN |
| JSON metadata compatibility | PASS | Automated import/export shape and dividend provenance tests; local browser download/re-import preserved 4,314 rows and 24 dividend events |
| Rebacktest result comparison | PASS | Local browser generated the required 9 comparison metrics for price and dividend candidates |
| F05 price/axis/toggle/Tooltip/gaps | PASS | Automated and real-browser assertions |
| F05 desktop/mobile, light/dark UI | PASS | Chromium 1440×900 and 390×844, both themes; no horizontal overflow |
| P0 automated regression | PASS | 8 test files; counts above |
| Excel cache equivalence | BLOCKED | Existing audited mismatch remains; no workbook path provided |

## GitHub and Sites

- GitHub PR: [#1 — P3 + F05](https://github.com/jaronhoh/margin-share-calculator/pull/1), **Draft / open / not merged**. Automatic provider authorization and Sites runtime verification remain unresolved.
- GitHub Actions: **PASS**, `Site source tests` run 37 (`40117557075`): 8/8 test files passed on P3 source/test commit `9202648699493ffe1c9493468c0997eab91c5c79`. Later GitHub commits update documentation only. Run 1 failed because the large JSON fixture was truncated during transfer; the complete file was restored and subsequent runs passed.
- Local Site-source checkout commit: `2e5e8521e7e17394eb82f2295c468d94f1f35cd5`.
- Sites: **PASS — deployed** F05-only source commit `a086b353b6c1627c79d3851d7c1957b10fb0c26a` as Version 32; deployment `appgdep_6adcea6455bc8191a110c499ae457bf2` succeeded. Existing URL and custom Owner-only access policy remain unchanged; P3 is not included in this deployment.
- The two audited dividend amount discrepancies (2021-06-28 RM0.39 vs RM0.385; 2021-01-15 RM0.14 vs RM0.135) and the existing 24 manual rows are unchanged.

## P3 implementation continuation — 2026-10-25

- **Implemented:** `dist/dividend-data.mjs` parses CSV with separate ex, record, and payment dates; validates dates/amounts/duplicates; annotates candidate provenance; identifies suspicious same-amount/near-date duplicates. Approval rejects missing manually confirmed payment dates and requires a separate confirmation for suspected duplicates.
- **Implemented:** Dividend review UI lets users select candidates, enter/confirm a payment date, see existing source conflicts, run a candidate backtest, compare all nine required metrics, cancel, or confirm and save. The original 24 Excel events remain intact; imported confirmed events preserve source file/row/date metadata through JSON normalization.
- **Implemented:** Price update and dividend approval now save full compatible JSON snapshots in browser localStorage only after final confirmation. Startup validates and restores the saved snapshot; stale candidate signatures are rejected; failed storage writes or apply callbacks trigger in-memory and stored-snapshot rollback. Reset restores defaults and clears the saved local snapshot.
- **PASS — local browser:** Price CSV synthetic row appeared as one new record; generated 9-metric comparison; cancel left end date unchanged. A separate synthetic run confirmed save and apply, then reload restored the 4,315-row snapshot through 2026-10-24. The local snapshot was cleared with Restore Defaults after the test.
- **PASS — local browser:** Dividend candidate with missing payment date was rejected; after entering a payment date and explicitly approving a suspected duplicate, candidate backtest showed 9 metrics. Cancel left all 24 original Excel events active.
- **PASS — local browser:** Exported the full JSON configuration and re-imported the downloaded file; the app retained 4,314 daily prices and all 24 dividend events without validation errors.
- **PASS — automated:** Expanded `market-data.test.mjs` now covers parse/approval date semantics, duplicate detection/approval, original-24 immutability, atomic snapshot write, quota failure rollback, post-commit failure rollback and restore. Dividend provenance JSON normalization has an explicit roundtrip assertion.
- **PASS — complete local regression:** `node --test tests/*.test.mjs`: 8/8 files, 0 failures; 27 engine cases, 48,216 daily numeric checks, 276,096 P0 oracle checks, 17,256 wealth conservation checks, source-dividend assertions, P3 market/dividend checks and F05 static checks.
- **BLOCKED — automatic provider:** no Yahoo Chart integration was added. The live endpoint remains undocumented, official terms restrict automated data collection absent explicit permission, current terminal DNS lookup failed, and Site CORS/runtime support plus provider error/rate-limit behavior remain unverified. No public proxy or paid service was added. Existing CSV/manual workflows remain the data-update route.
- **Sites:** unchanged at Version 32. No P3 changes were deployed.

## Yahoo personal-use integration continuation — 2026-10-25

- **Implemented locally:** Added `dist/yahoo-chart.mjs` for Chart URL construction, raw `close` parsing, Malaysia-local date conversion, dividend Ex-Date and split extraction, HTTP/429/empty/error response handling, and incremental date filtering. The existing UI now has a Yahoo update action feeding its existing review, candidate backtest, nine-metric comparison, explicit apply/cancel, and JSON persistence path.
- **Dividend handling:** Yahoo events can be opened in the existing dividend review UI. They arrive with Ex-Date only and blank Payment Date; no event can enter the backtest until the user enters a confirmed payment date and approves duplicate warnings. Provider event and split metadata are retained in the source record for JSON export. The original 24 dividend records are unchanged.
- **Price handling:** Only raw `close` is used. The request begins two weeks before the last stored date to detect overlaps/revisions. Weekend carry-forward dates are visibly labeled. A missing weekday blocks the candidate instead of fabricating a holiday price because this project has no verified Bursa holiday calendar.
- **PASS — direct API reachability:** Opened the live Yahoo Chart endpoint in the browser and received a `1155.KL` JSON response with MYR, `Asia/Kuala_Lumpur`, timestamps, and daily close values.
- **PASS — automated tests:** Added `tests/yahoo-chart.test.mjs` for request parameters, raw close (not adjusted close), KL date conversion, Ex-Date separation, split events, malformed/empty/error/429/duplicate responses. Full suite: 9/9 files, 0 failures; all existing P0 financial regressions pass.
- **BLOCKED — browser CORS verification:** Browser security policy rejected a cross-origin test page and forbids protocol workarounds. No workaround was attempted. The actual Site-origin request therefore remains unverified; UI catches network/CORS failures and leaves CSV import available.
- **NOT YET COMMITTED/PUBLISHED:** This implementation and documentation are local changes only at the time of this report update. Existing Site remains Version 32. Publish only after GitHub CI and an exact-source Sites package/deployment can be completed.
