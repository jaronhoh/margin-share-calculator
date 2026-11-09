import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const workerTemplate = await readFile(join(root, 'worker/index.js'), 'utf8');
const runtimeFiles = [
  'index.html', 'neutral.css', 'engine.mjs', 'config.mjs', 'market-calendar.mjs',
  'market-data.mjs', 'dividend-data.mjs', 'dividend-events.mjs',
  'maybank-dividends.mjs', 'release-info.mjs',
];
const assets = {};
for (const file of runtimeFiles) assets[file] = await readFile(join(dist, file), 'utf8');

const built = workerTemplate.replace('__SITE_ASSETS__', () => JSON.stringify(assets));
if (built === workerTemplate) throw new Error('Worker asset marker was not replaced.');
const output = join(dist, 'server/index.js');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, built);
console.log(`Built Site Worker with ${runtimeFiles.length} static assets.`);
