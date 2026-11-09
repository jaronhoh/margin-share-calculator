# P1–P3 Recovery Checkpoint — 2026-11-09

## Scope and safeguards

- Continue from the current GitHub `main` state and connected GitHub/Sites evidence.
- Cross-device synchronization is out of scope. Keep the existing browser-local `localStorage` persistence.
- Do not reopen PR #3. It is closed and unmerged.
- Preserve the existing production URL, production data, and Owner-only access.
- No production data was changed in this checkpoint.

## P1 — Historical dividend audit and Excel equivalence

**Status: BLOCKED — source workbook and reproducible workbook comparison input are unavailable in the repository.**

Evidence from the checked-in `site-source/dist/maybank-dividends.mjs`:

- It declares 24 rows from workbook `Leverage Calculator.xlsx`, sheet `Margin Risk Calculator - Table1`, range `A3:B26`.
- The source metadata explicitly says the dates have not been verified as actual payment dates.
- The declared workbook SHA-256 is `4420e1219ab05d6b62e04c31bcafa01e7c92d2bb89457e9764f7b0b14f96e771`; this is metadata in the source, not a hash independently recomputed from an available workbook.
- Prior audit records describe two unresolved amount differences (2021-06-28: RM0.39 vs RM0.385; 2021-01-15: RM0.14 vs RM0.135) and five rows with incomplete date evidence. Those findings are not a completed 24-row source audit.
- The workbook regression harness is not present in the current `main` tree at `site-source/tests/excel-regression.mjs`; previous project notes say the comparison also requires the original workbook and an as-of date.

**No Excel-equivalence claim is made.** No dividend row was changed. To complete this item, the original workbook with the exact hash and its comparison as-of date must be available to the execution environment.

## P2 — 11 Yahoo price conflicts, Bursa calendar, provider rights

**Status: PARTIAL / BLOCKED.**

- Historical PR #1 records a Yahoo preview of 2 new rows, 0 unchanged rows, and 11 conflicting rows; the conflicting candidate values were explicitly not saved. This checkpoint did not receive a verified 11-row source listing or the original workbook needed to reconcile every conflict.
- Existing project notes say Yahoo Chart returned trading days only, while the engine requires continuous calendar-day input. The checked-in engine rejects date gaps. No missing prices were invented or forward-filled.
- The prior audit reports that a complete Bursa holiday/trading calendar was unavailable. This run did not obtain and reconcile an authoritative complete calendar against all workbook dates.
- The current repo records Yahoo's Chart interface as undocumented and automated collection/retention as lacking established permission. No evidence of a license or written permission was found in the connected repository records. Therefore this checkpoint does not authorize additional automated retrieval, caching, or redistribution of Yahoo data.

**No conflicting price was applied and no Bursa closed-day flag was added without verified calendar evidence.**

## P3 — Market refresh and regression

**Status: EXISTING REVIEWED IMPORT FLOW VERIFIED IN SOURCE; AUTOMATED PROVIDER REFRESH BLOCKED.**

- `main` contains the existing reviewed market-data workflow and Site Worker Yahoo Chart route, as well as CSV fallback and local snapshot persistence.
- Current implementation separates preview/review from applying data and retains localStorage. Cross-device sync remains canceled.
- The existing test command is `npm test` in `site-source`; the workflow only runs on pull requests affecting `site-source/**` or the workflow file, plus manual dispatch.
- Latest connected release record for the current target says the existing Site is Version 2, using Site source commit `8c1d5ed7d04dcda0e97ba435b554d9e13b517dee`, Deployment ID `appgdep_6af0da067d908191b3b42f37866bead8`. Current access remains Owner-only (single owner, no groups or external visitors).
- The latest repository PR #3 body reports Node 43/43, Worker build, Chromium dividend-table E2E, and Actions run 224 (`42464380110`) passed for its source snapshot. PR #3 is closed/unmerged; this does not prove those checks cover all P1–P3 work or the current production artifact.
- This checkpoint did not alter application code, so no new CI run was triggered and no Site deployment was performed. The production dataset and current deployment remain untouched.

### Remaining blockers

1. Original workbook unavailable for the complete 24-row audit and Excel calculation-equivalence run.
2. Verified source listing for all 11 price conflicts unavailable for row-by-row adjudication.
3. Complete authoritative Bursa calendar reconciliation not evidenced.
4. Written provider permission or licensed automated market-data source not evidenced; automated upstream collection must remain disabled until resolved.

## Completion rule

Do not mark P1 or P2 complete based on the existing summary alone. Do not mark automated P3 complete until the provider is authorized, the market calendar/gap policy is validated, relevant tests pass on the exact commit, and actual production runtime behavior is verified.
