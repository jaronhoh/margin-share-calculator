import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const workerTemplate = await readFile(join(root, 'worker/index.js'), 'utf8');
const assets = {};

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.openai' || entry.name === 'server') continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    else {
      const assetPath = relative(dist, absolute).split('\\').join('/');
      if (!['.html', '.mjs', '.css', '.json'].includes(extname(assetPath))) continue;
      assets[assetPath] = await readFile(absolute, 'utf8');
    }
  }
}

await collect(dist);
if (!assets['index.html']) throw new Error('dist/index.html is required to build the Site Worker.');
const built = workerTemplate.replace('__SITE_ASSETS__', JSON.stringify(assets));
if (built === workerTemplate) throw new Error('Worker asset marker was not replaced.');
const output = join(dist, 'server/index.js');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, built);
console.log(`Built Site Worker with ${Object.keys(assets).length} static assets.`);
