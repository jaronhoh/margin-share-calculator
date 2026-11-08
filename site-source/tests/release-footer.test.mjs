import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReleaseInfo } from '../dist/release-info.mjs';
import { createReleaseReceipt } from '../tools/release-receipt.mjs';

test('release footer formats the exact Malaysia date and time across midnight', () => {
  assert.deepEqual(formatReleaseInfo({ version: 65, updatedAt: '2026-11-08T16:02:03.123456+00:00' }),
    ['Version 65', 'Updated: 2026-11-09 00:02 (MYT)']);
  assert.deepEqual(formatReleaseInfo({ version: 65, updatedAt: '2026-11-09T00:02:03+08:00' }),
    ['Version 65', 'Updated: 2026-11-09 00:02 (MYT)']);
});

test('release footer falls back for missing or invalid metadata', () => {
  for (const info of [null, { version: 65 }, { version: '65', updatedAt: '2026-11-08T12:30:00Z' },
    ...['2026-11-08', '2026-11-08T12:30:00', '2026-02-30T00:00:00Z', '2026-11-08T24:00:00Z',
      '2026-11-08T00:00:00Z\n'].map(updatedAt => ({ version: 65, updatedAt }))]) {
    assert.deepEqual(formatReleaseInfo(info), ['Version unavailable', 'Updated: unavailable']);
  }
});

test('release receipt requires matched Sites source, version and successful publication', () => {
  const projectId = 'appgprj_test', buildId = 'e8c86d54-44a5-4e90-8177-9fc08e9e6411';
  const versionId = 'version-id', deploymentId = 'deployment-id', sourceSha = 'a'.repeat(40);
  const publishedAt = '2026-11-08T13:00:00Z';
  const version = { id: versionId, project_id: projectId, version_number: 65, source: { commit_sha: sourceSha } };
  const deployment = { id: deploymentId, project_id: projectId, version_id: versionId,
    status: 'succeeded', type: 'publish', url: 'https://site.example', updated_at: '2026-11-08T13:10:00Z' };
  const input = { projectId, buildId, sourceSha, versionId, deploymentId, version, deployment, publishedAt };
  assert.deepEqual(createReleaseReceipt(input), {
    key: `release-info/${projectId}/${buildId}.json`,
    receipt: { projectId, buildId, versionId, deploymentId, sourceSha, version: 65, updatedAt: publishedAt },
  });
  for (const patch of [{ status: 'failed' }, { status: 'publishing' }, { type: 'preview' },
    { project_id: 'another-project' }, { version_id: 'older-version' }, { id: 'different-deployment' }]) {
    assert.throws(() => createReleaseReceipt({ ...input, deployment: { ...deployment, ...patch } }));
  }
  assert.throws(() => createReleaseReceipt({ ...input, sourceSha: 'b'.repeat(40) }));
  assert.throws(() => createReleaseReceipt({ ...input, publishedAt: undefined }));
  assert.throws(() => createReleaseReceipt({ ...input, buildId: '../old-build' }));
});
