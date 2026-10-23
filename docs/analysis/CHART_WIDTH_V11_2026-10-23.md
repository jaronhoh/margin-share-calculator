# Chart width correction — 2026-10-23

Cause: SVG viewBox width was capped at 900 while the SVG element expanded beyond 1600px. Default preserveAspectRatio centered the drawing with substantial side letterboxing.

Fix: viewBox uses the actual SVG client width and height, including narrow widths below 320px. ResizeObserver redraws after the chart's own dimensions change; it ignores hidden/zero-sized charts. Axis gutters remain 90px per side on desktop and 70/58px on narrow screens to accommodate labels. No changes to data or calculation engine.

PASS actual local IAB 2152/1440/390 CSS pixels, light/dark: SVG widths 1657/945/295 respectively, exactly matching each viewBox; height 702 matches viewBox. No page overflow, chart End key shows 2026-10-23, zero browser errors. Added dimension equality regression to the existing browser test and widened its matrix. Native deployment and online evidence recorded separately in GitHub after publication.


## Published and verified
Version 11 succeeded, 2026-10-23 22:23:51 MYT. URL https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/ . Source 5c32075223beec791bcb17b6fd64f4ad325ceab6. Deployment appgdep_6adb6de75ba881919fb1dfc7cfbd5c97. Saved version appgprj_6ad816b7dd508191a8632550d36f375f~appgver_aa3c0eca7b80819195b9cd16b2835c43.

PASS full existing local browser regression expanded to 2152/1440/390, light/dark; formulas, monthly rows, dividend single-source regression, zero page errors. PASS online normally authenticated IAB: actual CSS 2152/1440/389, light/dark; SVG/viewBox width 1648/936/285 and height701 exactly match, no horizontal overflow, End-key date2026-10-23. Online 2152-width screenshot reviewed: curve spans chart except axis gutters. Normal ownership unchanged: custom, sole same Owner, revision1, no external visitors/groups/editors. No other Site touched. Existing Excel cache equivalence FAIL not rerun. No CI claimed.
