# Chart width correction — 2026-10-23

Cause: SVG viewBox width was capped at 900 while the SVG element expanded beyond 1600px. Default preserveAspectRatio centered the drawing with substantial side letterboxing.

Fix: viewBox uses the actual SVG client width and height, including narrow widths below 320px. ResizeObserver redraws after the chart's own dimensions change; it ignores hidden/zero-sized charts. Axis gutters remain 90px per side on desktop and 70/58px on narrow screens to accommodate labels. No changes to data or calculation engine.

PASS actual local IAB 2152/1440/390 CSS pixels, light/dark: SVG widths 1657/945/295 respectively, exactly matching each viewBox; height 702 matches viewBox. No page overflow, chart End key shows 2026-10-23, zero browser errors. Added dimension equality regression to the existing browser test and widened its matrix. Native deployment and online evidence recorded separately in GitHub after publication.
