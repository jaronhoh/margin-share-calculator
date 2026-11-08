import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReleaseInfo } from '../dist/release-info.mjs';

test('release footer formats the hard-coded release in Malaysia time', () => {
  assert.deepEqual(formatReleaseInfo(68, '2026-11-08T16:50:00+08:00'),
    ['Version 68', 'Updated: 2026-11-08 16:50 (MYT)']);
  assert.deepEqual(formatReleaseInfo(65, '2026-11-08T16:02:03.123456Z'),
    ['Version 65', 'Updated: 2026-11-09 00:02 (MYT)']);
});

test('release footer falls back for missing or invalid metadata', () => {
  for (const [version, updatedAt] of [[null, null], ['67', '2026-11-08T12:30:00Z'],
    [67, '2026-02-30T00:00:00Z'], [67, 'invalid']]) {
    assert.deepEqual(formatReleaseInfo(version, updatedAt),
      ['Version unavailable', 'Updated: unavailable']);
  }
});

test('the page reads its release constants without a runtime endpoint', async () => {
  const {readFile} = await import('node:fs/promises');
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(html, /SITE_RELEASE_VERSION,SITE_RELEASE_UPDATED_AT,formatReleaseInfo/);
  assert.doesNotMatch(html, /api\/release-info/);
});
