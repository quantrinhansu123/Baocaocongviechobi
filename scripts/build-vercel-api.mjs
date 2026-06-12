import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = ['find', 'add', 'edit', 'delete', 'status', 'debug'];
const outDir = path.join(root, 'api', 'data');

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await esbuild.build({
  entryPoints: routes.map(name => path.join(root, 'api-src', 'routes', `${name}.ts`)),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outdir: outDir,
  entryNames: '[name]',
  outExtension: { '.js': '.cjs' },
  logLevel: 'info',
});

for (const name of routes) {
  console.log(`Built /api/data/${name} → api/data/${name}.cjs`);
}
