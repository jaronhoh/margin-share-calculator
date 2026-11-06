import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

test('release footer is present and reads deploy-time metadata',async()=>{
  const html=await readFile(resolve(root,'dist/index.html'),'utf8');
  assert.match(html,/<footer id="releaseFooter"/);
  assert.match(html,/id="releaseVersion"/);
  assert.match(html,/id="releaseUpdated"/);
  assert.match(html,/import \{SITE_RELEASE_VERSION,SITE_RELEASE_UPDATED_AT\} from '\.\/release-info\.mjs'/);
  assert.match(html,/timeZone:'Asia\/Kuala_Lumpur'/);
  assert.doesNotMatch(html,/PRIVATE · OWNER ONLY · VERSION 64/);
});

test('release metadata is not fabricated before deployment',async()=>{
  const release=await import('../dist/release-info.mjs');
  assert.equal(release.SITE_RELEASE_VERSION,null);
  assert.equal(release.SITE_RELEASE_UPDATED_AT,null);
});
