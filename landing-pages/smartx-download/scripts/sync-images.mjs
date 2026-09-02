import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(root, '..', '..');
const outDir = join(root, 'public', 'images');

const assets = [
  { from: join(repoRoot, 'images', 'mockup-01.jpg'), to: 'mockup-01.jpg' },
  { from: join(repoRoot, 'images', 'screenshot-01.png'), to: 'screenshot-01.png' },
  { from: join(repoRoot, 'src', 'assets', 'logo.png'), to: 'logo.png' },
  { from: join(repoRoot, 'resources', 'icons', 'icon.png'), to: 'icon.png' },
];

mkdirSync(outDir, { recursive: true });

for (const { from, to } of assets) {
  if (!existsSync(from)) {
    console.warn(`[sync-images] skip missing: ${from}`);
    continue;
  }
  copyFileSync(from, join(outDir, to));
  console.log(`[sync-images] ${to}`);
}
