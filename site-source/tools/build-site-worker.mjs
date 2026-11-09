import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(root,'dist');
const template=await readFile(join(root,'worker/index.js'),'utf8');
const assets={};
async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='.openai'||e.name==='server')continue;const p=join(dir,e.name);if(e.isDirectory())await collect(p);else if(['.html','.mjs','.css','.json'].includes(extname(p)))assets[relative(dist,p).split('\\').join('/')]=await readFile(p,'utf8');}}
await collect(dist);
if(!assets['index.html'])throw Error('dist/index.html missing');
const out=template.replace('__SITE_ASSETS__',()=>JSON.stringify(assets));
const target=join(dist,'server/index.js');await mkdir(dirname(target),{recursive:true});await writeFile(target,out);console.log(`Built Worker with ${Object.keys(assets).length} assets`);
