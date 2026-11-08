# UI v21 — Daily ledger CSV export

## Behavior

- Adds **导出逐日流水 CSV** beside the existing JSON configuration export in the backtest settings drawer.
- Exports every row from the current completed simulation, regardless of the visible ledger page or whether the on-screen filter is set to all dates or month end.
- Includes the same 21 fields and ordering as the daily ledger, including daily close price, total/cash/financed shares, loan and interest details, dividend, top-up, share sales and buys by classification, LSR, net worth, and event text.
- Numeric values remain numeric decimal strings without display-only currency formatting; unavailable LSR values are blank. The file uses UTF-8 with BOM and CRLF records for spreadsheet compatibility. Filename includes the actual generated date range.
- Cash-purchase quantities remain zero under the current engine; this export reflects the existing calculation model and does not introduce a cash trading action.

## Checks

- Engine suite: 26 passed.
- Dividend suite: all 24 source rows and existing validation passed.
- Board-lot suite: both strategies, 4,314 rows, share classification invariants passed.
- Daily regression suite: both strategies and 48,216 independent numeric checks passed.
- Browser UI suite: CSV download parsed as 4,314 rows plus header, all 21 columns present, UTF-8 BOM present, first and last dates and close prices verified. Existing responsive checks passed at 2152, 1440, 1075, and 390 CSS pixels in light and dark themes; no page errors.

## Deployment

## Deployment result

- Existing Site version 26 published successfully from source commit `d803934e4158f31fa853af0795e7a2c41e18300f`.
- Production URL: https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site
- Owner-only access remained enabled with one owner and no external visitors or groups.
