# BUG-UI-005 deployment progress — 2026-11-09

## Verified tests

- GitHub source tested: `3542177059ed72a52d71f23e8df2d585991a3cb3` on `fix/bug-ui-005-chart-legend-colors`.
- GitHub Actions run [#238](https://github.com/jaronhoh/margin-share-calculator/actions/runs/42511024635): Node tests 43 passed, zero failed; Chromium checks passed at widths 1440, 390 and 320 in light and dark themes. Screenshots are attached to the run.
- Chromium checks covered legend layout and colors, tooltip colors, page overflow and independent series toggles. Market data responses were mocked.

## Production status

- Existing private Site: https://margin-share-calculator.jaron-hoh.chatgpt.site
- Sites reported a successful re-publication of existing Version 1, source commit `26b0092a38c424c939f33dde624d53fa0d110a9f`. This was a re-deployment of the prior saved version and is not evidence that the tested GitHub commit was deployed.
- Attempting to save tested commit `3542177059ed72a52d71f23e8df2d585991a3cb3` returned a conflict: the Site's configured source branch `main` was still at `26b0092a38c424c939f33dde624d53fa0d110a9f`.
- The Site source synchronization command did not start: network access from the sandbox failed DNS resolution and subsequent requests to run the helper with elevated network access were interrupted. No source push for the tested build was confirmed.
- BUG-UI-005 production deployment and live verification remain incomplete. Do not report the tested commit as live.

## Next step when work resumes

Synchronize the tested application source to the existing Site's configured source repository using the supported workflow, package from the pushed Site source commit, save and deploy that matching version, then verify the live behavior. Preserve the existing URL and owner-only access.

## Recovery attempt — 2026-11-09 (Malaysia)

- Rechecked the existing Site: Version 1 remains the only saved version, source `26b0092a38c424c939f33dde624d53fa0d110a9f`. Its access policy remains custom with only the owner listed and no external visitors.
- GitHub Actions run 42511024635 reports successful `node-tests` and `chromium-ui` jobs. The previous record associates this run with target commit `3542177059ed72a52d71f23e8df2d585991a3cb3`; the jobs endpoint did not independently return the run head SHA in this attempt.
- Obtained a Site source write credential through the supported Sites API. The source provider is `cloudflare_artifact` and branch is `main`; actual remote HEAD was not independently confirmed in this attempt.
- Sandbox `git ls-remote` against GitHub failed with `Could not resolve host: github.com`. The supported Site workflow helper could not start because `node` was not found in the execution environment. A request for elevated network access was aborted; no elevated network operation ran.
- No Site source push, build, new deployment or production UAT was completed in this attempt. BUG-UI-005 remains NOT DEPLOYED / NOT VERIFIED. Existing user data was not changed by this attempt; preservation has not been independently verified.
