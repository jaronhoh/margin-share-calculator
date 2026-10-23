# Neutral theme validation — 2026-10-23 (Asia/Kuala_Lumpur)

Target: existing appgprj_6ad816b7dd508191a8632550d36f375f only. UI v10 is the implementation label; hosted version is confirmed separately by Sites.

- PASS: shadcn/ui default Neutral OKLCH semantic tokens for light/dark background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring and radius. Source: https://ui.shadcn.com/docs/theming . Existing buildless semantic HTML retained; this is a real token/component-style implementation, not an installation of React/Radix components.
- Charts intentionally override chart-1/chart-2 with neutral greys and solid/dashed strokes, avoiding the default chart palette's teal. Both axes, labels, pointer/keyboard hints and formulas share theme tokens.
- PASS: engine 25 checks; cash/sell independent 4,018-day regressions, 48,216 numeric checks; all 24 dividend source events and RM6.99 total.
- PASS: real local headless Chromium at 1440x1000 and 390x1000, light/dark. Both screens, no page horizontal overflow, 17 formula buttons with focus/Escape and tooltip viewport bounds, chart Home/ArrowRight date hints, 100-row pagination, month-end filter, Jan 31 Saturday, RM665.89 capitalization and RM0 pending.
- PASS: 4,314-day Excel close-price range; first two closes RM9.17/RM9.12, large chart >=420px. Editable Table1 events are the sole dividend input; duplicate addition of Table2 dividend cache found in the previously blocked implementation and fixed. Browser regression verifies May 26 dividend equals opening shares x RM0.33, not twice this amount.
- PASS: sampled text contrast minimum light 4.742:1, dark 6.821:1; chart curves minimum light 4.742:1, dark 6.939:1. Default muted token retained; grey-surface helper text uses a derived accessible foreground. Focus has neutral ring plus foreground outline. Visual inspection caught axis labels using a surface token; corrected to muted-foreground.
- PASS: zero page JavaScript errors. Screenshot and JSON evidence retained under local artifacts/; repeatable tests/ui-neutral.cjs supports local and authenticated live targets via stdin.
- Fix: formula tips stay visible when keyboard focus scrolls the table.
- Network diagnosis: sandbox resolves neither github.com nor git.chatgpt-team.site; approved network execution cloned GitHub and successfully opened the official Sites source workflow. Previous DNS blockage is not reproduced outside the sandbox.
- Deployment and live tests: recorded in GitHub final report after publishing; local PASS is not a deployment claim.
- Existing limitations: historical Excel formula-cache equivalence FAIL remains; no Excel application recalculation or external dividend payment-date verification. No real-device touch, full screen-reader audit, or second non-owner account test.

## Actual release and online acceptance
- PASS deployment: Version 10, succeeded at 2026-10-23 22:15:51 MYT.
- URL: https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/
- Site source commit: `1456d82377237f2e1b0b0ce138d8b761d886d009`.
- Saved version ID: `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_26c9d77dbe848191b1df598af226a8a0`.
- Deployment ID: `appgdep_6adb6c030ad481919bce58a42c17dcd2`.
- Archive SHA256: `6ebc226d15d4748ecbb03877bb550ef5834fdac95fc0eabf59f8c42ef44b6f68`; native saved version confirms the exact source commit and seven packaged static files.
- PASS online: unauthenticated IAB displayed login gate; normal sign-in using the existing Owner account reached UI v10. No access bypass was used. An independent headless test token injection was rejected by automatic approval review; that route was abandoned, and the already signed-in IAB was used instead.
- PASS online IAB: actual CSS widths 1440 and 389 (browser zoom 67%; requested viewport was calibrated and actual innerWidth recorded), both light/dark. No horizontal page overflow; 17 formula controls retained; daily-interest formula opens and Escape closes; chart keyboard date hint, first two closes, 24 events, Jan 31 Saturday/month-end RM665.89, and zero browser errors. Local matrix remains exact 1440/390.
- PASS permission comparison: access_mode custom, revision 1 unchanged; same unique Owner account; external visitors 0, groups 0, editors 0. No permission write or other Site/system changes.
- Final disposition: theme PASS; close-price/large-chart deployment PASS; automated business regression PASS; online browser acceptance PASS; current deployment BLOCKED none. Historical Excel-cache numerical equivalence FAIL retained, not rerun.
- GitHub documentation publication is a separate operation from native Sites deployment; no GitHub CI run is claimed.
