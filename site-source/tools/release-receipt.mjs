import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isReleaseInfo } from '../dist/release-info.mjs';

export function releaseTarget(projectId, buildId) {
  if (!/^appgprj_[a-z0-9]+$/.test(projectId ?? '') ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(buildId ?? '')) {
    throw new Error('A Sites project ID and a fresh build UUID are required.');
  }
  return { projectId, buildId, key: `release-info/${projectId}/${buildId}.json` };
}

export function createReleaseReceipt({ projectId, buildId, sourceSha, versionId, deploymentId, version, deployment, publishedAt }) {
  const target = releaseTarget(projectId, buildId);
  if (!/^[a-f0-9]{40}$/.test(sourceSha ?? '') ||
      !versionId || version?.id !== versionId || version.project_id !== projectId ||
      version.source?.commit_sha !== sourceSha ||
      !deploymentId || deployment?.id !== deploymentId ||
      deployment.project_id !== projectId || deployment.version_id !== versionId ||
      deployment.type !== 'publish' || deployment.status !== 'succeeded' || !deployment.url) {
    throw new Error('The saved version and successful production deployment must match the release record.');
  }
  const receipt = { projectId, buildId, versionId, deploymentId, sourceSha, version: version.version_number, updatedAt: publishedAt };
  if (!isReleaseInfo(receipt)) throw new Error('A valid version number and verified publication timestamp are required.');
  return { key: target.key, receipt };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
  process.stdout.write(JSON.stringify(createReleaseReceipt(input), null, 2) + '\n');
}
