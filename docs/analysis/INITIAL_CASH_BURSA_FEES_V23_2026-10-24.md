# UI v23 — Initial cash allocation and Bursa transaction costs

## Baseline and scope

- Started from the existing Site's confirmed Version 28, source commit `6b27e793d9e46cf48e8ec78a8c47e1e27db74a2b`.
- Added an available-cash input. Own and financed share quantities are calculated from cash, start-date price, target LSR, 100-share lots, and estimated initial-buy costs.
- Replaced the simplified flat fee behavior in the Site UI with a configurable Bursa fee estimate. The engine still accepts the legacy flat `feeRate` shape used by older direct callers and JSON imports.
- No market-data source, daily interest rule, dividend rule, risk threshold, or Site audience is changed by this feature.

## Initial allocation

The calculator chooses the greatest total number of 100-share lots whose cash-funded shares and one initial purchase's fees fit the available cash. It floors financed lots to the configured target LSR, then treats the remaining lots as cash-funded shares. Therefore, the resulting initial LSR may be slightly below the requested target because of lot rounding.

`cash required = cash-funded shares × start price + initial order fees`

For the preserved PoC example (RM9.17, target LSR 60%, Maybank fee estimate), RM105,139.75 yields 11,400 cash shares and 17,100 financed shares. Estimated initial costs are RM601.75; the financed share notional remains the initial loan. The UI shows both the estimated cash remainder and the fee estimate. A zero-lot result is rejected when running the backtest.

Older `margin-share-config/v1` JSON without a cash budget or fee components remains importable. The importer infers a cash budget from the prior share quantities and flat fee ratio; new exports include the cash budget, derived share counts, and the fee settings and validate that those values reconcile before applying the file.

## Fee model

Default values are an editable Maybank Cash Trade reference: 0.1% brokerage with RM8 minimum, 0.1% stamp duty rounded up per RM1,000 or fraction, capped at RM1,000 per contract; and 0.03% clearing, capped at RM1,000 per contract. The optional SST input applies to brokerage only and defaults to zero for ordinary Bursa-listed shares. A user's own contract note can be represented by changing the rates, minimum, or SST.

The current Maybank page lists brokerage RM8 or 0.1% (whichever is higher), clearing 0.03% with RM1,000 cap, and stamp duty RM1 per RM1,000 or fraction with RM1,000 cap: [Maybank Share Trading Cash Account fees](https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/services/digital_banking/share-trading-cash-account.page). Bursa's SST FAQ says securities trading fees for Bursa-listed shares are exempt from service tax effective 1 July 2025: [Bursa Malaysia SST FAQ](https://www.bursamalaysia.com/sites/5d809dcf39fba22790cad230/assets/68638114e6414abcf48ef314/SST_-_FAQs_updated_1_July_2025.pdf). For these assumptions, a RM10,000 one-way trade is RM23 before any account-opening cost; if a broker contract explicitly charges 8% SST on brokerage, it is RM23.80, or RM47.60 round trip (0.476%).

Costs are applied using one fixed schedule throughout the selected historical period; they are not reconstructed from historical schedules. Initial fees are paid from the entered cash budget and shown on the first row. Cash-call buy fees are externally funded and included in top-up cash; refinance fees are added to the loan; sale fees are deducted from proceeds applied to the loan. The daily ledger and CSV now include a transaction-fees column.

Financing rates remain editable and are not set to a generic market-wide range. Current product examples vary: Rakuten announced RakuMargin at 5.5% p.a. on 5 January 2026 ([Rakuten Trade](https://www.rakutentrade.my/b/press-office/rakuten-trade-lowers-rakumargin-interest-rate-to-5-5-p-a-reinforcing-commitment-to-cost-efficient-trading)); Berjaya Securities lists 10.5% p.a. for PacMargin ([Berjaya Securities](https://www.berjayasecurities.com.my/share-margin-financing/)). The existing 5% PoC default is retained for its documented comparison baseline; users should enter their actual facility rate.

## Validation

- Engine suite: 27 existing checks pass.
- Dividend suite: 24 of 24 source rows pass.
- Board-lot suite: both 4,314-day strategy runs pass with share-classification and lot invariants.
- Daily regression suite: both strategies pass 48,216 independent numerical checks.
- New fee/allocation suite passes fee components, rounding, caps, optional SST, initial cash allocation, and first-row fee accounting.
- Local Chromium passes 2152, 1440, 1075, and 390 CSS-pixel viewports in light and dark themes; automatic allocation, legacy/new JSON import, CSV fee column, existing dividend interaction, charts, Tooltips, and ledger navigation pass; page errors: 0.

## Deployment

- **PASS deployed:** existing Site Version 29, deployment `appgdep_6adc3494a2808191b896678af4f41f05`, status `succeeded`; saved version `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_f30203d44b008191868b47364337c8d7`.
- Site source commit: `1d97ccd8aa27a9a6e05f6e7d784bb5ecd47bf876`. Sites API confirms the original URL and active status. Access remains custom owner-only: current account is owner; one allowed owner, zero external visitors, groups, and editors; policy revision 1.
- Existing Site only: no new Site or project was created; no other Site was changed.
- GitHub documentation publication is recorded separately in `PROJECT_STATUS.md`; GitHub and Sites releases are independent.
