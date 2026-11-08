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
