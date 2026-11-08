# Margin Share Calculator Site source

This directory checks in the current static Site application snapshot so its source and regression suite are reviewable in the project repository. It uses native browser APIs and ES modules; the automated suite needs Node.js only.

Run `npm test` from this directory. The workbook comparison harness is intentionally excluded because it requires an external workbook path and as-of date. Site publishing is a separate release action and is not performed by this test workflow.

## CR-003 release footer

The Worker reads the release receipt at runtime. This lets the release operator record a successful publication after Sites reports its version and publication time, using the same published archive. Local builds and builds awaiting a receipt display `Version unavailable · Updated: unavailable`.

For an authorized release:

1. In the actual Sites source manifest, configure a private R2 binding named `RELEASE_BUCKET` and configure the Worker secret `RELEASE_WRITE_TOKEN` with a high-entropy value. The GitHub source snapshot does not provision these. Preserve the existing Site project ID and access policy.
2. Set `SITE_RELEASE_PROJECT_ID` to the existing Sites project ID and `SITE_RELEASE_BUILD_ID` to a fresh lowercase UUID when running `node tools/build-site-worker.mjs`. Retain the build UUID and the exact Sites source commit and archive used for the saved version. Use a new build UUID for each publication, including a rollback built from older source. Republishing an old archive reuses its receipt identity.
3. Once the **matching production deployment succeeds**, capture the native Sites version and deployment objects. Prepare a local input JSON file with `projectId`, `buildId`, `sourceSha` (the native Sites source commit), `versionId`, `deploymentId`, `version` (the native version object), `deployment` (the native deployment object), and `publishedAt` (the verified publication timestamp with a timezone offset). Use the timestamp from the observed transition to successful publication when the native deployment supplies it. A later general `updated_at` field alone does not establish publication time. Keep the footer unavailable if the publication time cannot be verified.
4. Run `node tools/release-receipt.mjs <input.json>`. Send only the returned `receipt` object as JSON in a `PUT /api/release-info` to the matching owner-only Site. Authenticate through the existing Sites access gate and send the separate Worker secret in `X-Release-Write-Token`. Keep both credentials in the release operator's secret store. The endpoint returns 201 for a new receipt, 200 for an identical retry and 409 for a conflicting receipt. A mismatched build is rejected.
5. Read `GET /api/release-info` and reload the Site to confirm the version and Malaysia time. The response exposes only those two fields and is never cached.

The receipt generator verifies the native IDs, the source commit and terminal production status. The publisher supplies the timestamp evidence and performs the authenticated handoff. The current Sites integration does not give the application a runtime publication timestamp or call this endpoint automatically.
