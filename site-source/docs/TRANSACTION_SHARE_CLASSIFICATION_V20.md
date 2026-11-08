# UI v20 — Cash and financed share classification

## Behavior

- Initial own shares are tracked as cash holdings; initial financed shares are tracked as financed holdings.
- Refinance-trigger purchases are recorded as financed purchases because the engine increases the loan by the purchase value and fees.
- The sell-to-repay strategy sells financed holdings first and applies the proceeds, net of configured fees, to the loan. Cash holdings are preserved. If available financed board lots are insufficient, the existing shortfall event remains visible.
- Daily ledger now shows total, cash, and financed holdings; cash/financed sale and purchase quantities are separate columns. Cash purchases and cash-share sales are zero under the current model; no discretionary cash-purchase action exists.
- Summary retains total ending shares and adds ending cash and financed holdings. The total equals the sum of the two categories.

## Regression checks

- Engine and dividend suites: 26 engine checks passed; all 24 Excel dividend rows passed.
- Board-lot suite: both 4,314-day strategies passed; every day satisfies total shares = cash shares + financed shares; all refinance buys classify as financed and all automatic sales classify as financed sales.
- Independent daily-interest oracle: 48,216 numeric checks passed across both strategies.
- Chromium UI suite: 2152, 1440, 1075, and 390 CSS pixel widths in light and dark themes passed. All 21 ledger headers and 16 summary tooltips were checked; no page errors.
- Focused 2015-05-26 regression: total 30,200 shares = 11,400 cash + 18,800 financed; 1,700 financed shares purchased; 0 cash shares bought; dividend remains RM9,405.

## Deployment

Deployment result is recorded after the matching source commit is pushed and the existing Owner-only Site version is published.
