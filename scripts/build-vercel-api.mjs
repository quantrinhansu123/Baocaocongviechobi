import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'api', 'data');
const outfile = path.join(outDir, '[action].js');

await mkdir(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'api-src', 'data', '[action].ts')],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outfile,
  logLevel: 'info',
});

console.log(`Built Vercel API → ${path.relative(root, outfile)}`);
