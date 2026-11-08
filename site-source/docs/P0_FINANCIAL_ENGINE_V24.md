# UI v24 — P0 financial engine corrections

Approved scope: repair and validate the audited defects, then publish the existing owner-only Site. Baseline Site Version 29, source 1d97ccd8aa27a9a6e05f6e7d784bb5ecd47bf876. The final deployment identifiers are recorded in the Work conversation; publication is not implied by this source document.

## Corrections

- Legacy v1 JSON retains its own/financed share quantities, flat fee model and prior initial-fee behavior. Explicit allocationMode, feeModel and chargeInitialFees fields preserve migration semantics through later exports. Editing cash, target or fees deliberately switches to current automatic allocation, with a visible legacy-mode explanation beforehand.
- The initial price is read-only and follows the selected historical start date. JSON with a different initial price is rejected before application. Partial fee schedules are rejected atomically.
- Refinancing is permitted after dividends repay the principal to zero. To avoid undoing risk remediation, no refinance is executed on a day with a margin-call purchase or sale.
- Minimum brokerage is applied independently of the percentage. Configurable stamp duty uses the UI's per-RM1,000-or-fraction interpretation. Default 0.1% fees and the ordinary historical results remain unchanged. Component monetary rounding to broker contract notes is still not certified.
- A sale producing nonpositive net proceeds stops before execution, preserves holdings and loan, and reports the block. Sale proceeds are split between actual debt repayment and excess cash; the latter is tracked separately and excluded from the defined stock-equity net worth.
- Safety gap must be positive, at most 10 percentage points, and smaller than the gap between margin call and refinance trigger. Forced-sale rules remain unresolved and retain the stop behavior.
- Unsafe monetary amounts/lot counts are rejected before binary searches; allocation has an iteration ceiling. The numeric envelope is an implementation precision bound, not a broker facility limit.
- Initial load and Reset both select the earlier of today (Asia/Kuala_Lumpur) and the bundled price cutoff. Out-of-range manual dates remain errors; no prices are fabricated.

## Actual validation

- Existing 27 engine checks, 24 dividend source checks, board-lot/classification suite, 48,216 synthetic monthly checks, and initial-cash/fee suite pass.
- New tests/p0-audit.test.mjs exercises the audited failures and new/legacy JSON roundtrips, malformed schedules, price mismatch and extreme values.
- Four independent exhaustive-lot historical oracle runs: cash/sell with costs off/on, 4,314 days each. 276,096 numerical assertions and 17,256 wealth-conservation assertions pass. The oracle does not use the product's fee function or trading solver.
- The dividend source test now keeps principal outstanding throughout its fixed-share fixture. This isolates source amounts from the corrected zero-loan refinancing behavior; it still verifies all 24 dated cash amounts.
- Actual local browser: 1280×720, light and dark, no horizontal page overflow; results, Reset, start-price read-only state, tooltip, legacy 1% JSON import and actual new JSON download checked. Downloaded parameters, 4,314 prices, all 24 dividends and provenance validate on roundtrip.
- Full viewport matrix was not rerun through the browser available in this task. Native Excel recalculation, external dividend eligibility/payment dates, public-holiday/stop-trading calendars, historical broker charges and non-owner login testing were not performed. Existing Excel-cache parity FAIL remains; this release does not certify market-business equivalence.

## Publication boundaries

Only the existing Site identity and its source are used. The original owner-only audience must be retained. No original Excel, historical prices or dividend source records are edited. The independent GitHub documentation repository is not the Site source repository; a native Sites success is required to call this release deployed.
