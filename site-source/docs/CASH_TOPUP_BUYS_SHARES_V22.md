# UI v22 — Cash margin-call top-up buys shares

## Updated rule

When the cash strategy reaches Margin Call on a trading day, the engine computes the market-value gap to the release LSR, then buys the smallest whole number of 100-share lots that covers that gap at the day's close price. The purchase is classified as cash shares. The external top-up amount is purchase notional plus configured transaction fees. The loan is not reduced, cash collateral is not retained, and daily LSR is recalculated after the shares are added. Fees are included in cumulative transaction fees and do not increase the loan.

The amount previously displayed as RM1,051.37 was calculated under the old collateral-cash rule. With this change, the backtest reruns and may show a different date and top-up amount because shares must be purchased in 100-share lots. Under the current default data and parameters, the 2018-06-21 cash call buys 400 shares at RM9.17 for RM3,668.00; the resulting LSR is 69.821% and the loan remains RM288,115.51.

## Verification

- Engine suite: 27 passed, including minimum whole-lot purchases, cash share ownership, fee accounting, unchanged loan, and LSR release checks.
- Board-lot suite: both strategies process 4,314 days; cash top-up purchases are in 100-share lots and share-class totals reconcile.
- Dividend and daily-regression suites pass; the independent daily-interest oracle reports 48,216 numeric checks.
- Chromium UI suite verifies the 2018-06-21 row shows 400 cash shares bought, RM3,668 top-up, and the cash-purchase event. Responsive checks pass at 2152, 1440, 1075, and 390 pixels in light and dark themes.

## Deployment

Published to the existing Owner-only Site at https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site. Owner-only access remains unchanged.
