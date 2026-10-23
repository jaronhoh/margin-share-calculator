# Version 12 — Bursa board lots and ledger navigation

## Changes

- Added a numeric page field to the daily ledger. It accepts an integer in the current filter's valid page range; invalid values are announced inline.
- Added a date field that selects the matching calendar row, computes and opens its page, switches the monthly view to all dates when necessary, highlights the row, and scrolls it into view. Dates outside the current generated simulation range are reported inline.
- Fixed Bursa Malaysia board lots at 100 shares. Refinance purchases round down to whole lots; sell-to-repay rounds up to the minimum whole lots needed, capped by whole-lot holdings. A shortfall caused by unavailable whole lots is explicit in the event.
- Refinance trigger default is 58%. Imported configurations from earlier versions are normalized to 100 shares per lot.
- Existing neutral light/dark tokens, theme switch, historical price series, 24 dividend events, weekday column, chart, 17 formula tips, and month-end capitalization are retained.

## Automated validation

- Engine, dividend and board-lot suites: 25 checks passed; 24/24 dividend source rows passed.
- Independent daily oracle: 48,216 numeric checks passed across both strategies.
- Full MAYBANK calendar: 4,314 rows each for cash and sell strategies; every buy and sell quantity is divisible by 100. Cash strategy had 21 buy days; sell strategy had 27 buy days and 19 sell days.
- Chromium matrix passed at 2152, 1440 and 390 CSS pixels in both Neutral themes. Checks include page jump, date locate (including month-end filter switch), invalid page/date, chart dimensions, all 17 formula tips and positioning, dividend event flow, monthly capitalization, contrast samples, and no page overflow. Browser page errors: 0.

## Publication status

Sites synchronization and native publication are **BLOCKED**: the configured Site Git service hostname `git.chatgpt-team.site` again failed DNS resolution during the official push workflow. Current live publication remains Version 11. No V12 save/version, deployment ID, or online acceptance is claimed. Site access was re-read as `custom` Owner-only, with the sole owner allowed, zero external visitors/groups/editors, revision 1.

Local Site source commit: `cb49a26bfa3b394637df488f032a91c1efbba03f`. Excel cached-formula parity remains a known historical FAIL and is not changed by this release.
