# Margin Share Calculator Site source

This directory checks in the current static Site application snapshot so its source and regression suite are reviewable in the project repository. It uses native browser APIs and ES modules; the automated suite needs Node.js only.

Run `npm test` from this directory. The workbook comparison harness is intentionally excluded because it requires an external workbook path and as-of date. Site publishing is a separate release action and is not performed by this test workflow.
