# Margin Share Calculator — Owner-only Site

Owner-only ChatGPT Site for Bursa Malaysia daily margin-financing backtests. The first page load starts blank. After entering a Bursa `.KL` ticker and choosing **获取行情并回测**, the app actively requests Yahoo Finance daily closes, market calendar, and dividend events, then looks up KLSE Screener Payment Date candidates. Users can instead import or export a complete JSON configuration. No inputs or results are stored in browser storage; refresh returns to a blank session.

## Checks

```sh
node --test tests/*.test.mjs
node tools/build-site-worker.mjs
```

The Worker proxies Yahoo Finance and KLSE Screener through same-origin API routes. It does not connect to broker accounts or place trades. Payment dates remain candidates until confirmed according to the matching rules. Missing start-day close data blocks a run; missing data is never silently invented.
