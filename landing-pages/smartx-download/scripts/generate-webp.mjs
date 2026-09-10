import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(root, '..', '..');
const publicDir = join(root, 'public');
const RASTER = new Set(['.png', '.jpg', '.jpeg']);

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    const candidate = join(repoRoot, 'node_modules', 'sharp', 'lib', 'index.js');
    if (!existsSync(candidate)) return null;
    try {
      return (await import(pathToFileURL(candidate).href)).default;
    } catch {
      return null;
    }
  }
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (RASTER.has(extname(name).toLowerCase())) files.push(full);
  }
  return files;
}

function webpPath(src) {
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function convertOne(sharp, src) {
  const dest = webpPath(src);
  const srcStats = statSync(src);
  if (existsSync(dest) && statSync(dest).mtimeMs >= srcStats.mtimeMs) {
    return { dest, skipped: true, original: srcStats.size, bytes: statSync(dest).size };
  }

  const image = sharp(src, { failOn: 'none' });
  const meta = await image.metadata();
  const basename = src.split('/').pop() ?? '';
  const isLogo = /logo|icon/i.test(basename) || srcStats.size < 120 * 1024;

  await image
    .clone()
    .webp({
      quality: isLogo ? 90 : 80,
      alphaQuality: 100,
      effort: 4,
      smartSubsample: !meta.hasAlpha,
    })
    .toFile(dest);

  return { dest, skipped: false, original: srcStats.size, bytes: statSync(dest).size };
}

const files = walk(publicDir);
const sharp = await loadSharp();

if (!sharp) {
  const missing = files.filter((src) => !existsSync(webpPath(src)));
  if (missing.length > 0) {
    console.error('[generate-webp] sharp is unavailable and these WebP files are missing:');
    for (const src of missing) console.error(`  ${relative(root, src)}`);
    process.exit(1);
  }
  console.log(`[generate-webp] sharp unavailable; using ${files.length} existing webp files`);
  process.exit(0);
}

let converted = 0;
let skipped = 0;
let originalTotal = 0;
let webpTotal = 0;

for (const src of files) {
  const result = await convertOne(sharp, src);
  originalTotal += result.original;
  webpTotal += result.bytes;
  const label = relative(root, src);
  if (result.skipped) {
    skipped += 1;
    continue;
  }
  converted += 1;
  const ratio = result.original === 0 ? 0 : Math.round((1 - result.bytes / result.original) * 100);
  console.log(
    `[generate-webp] ${label} → ${formatBytes(result.bytes)} (${ratio}% smaller)`,
  );
}

console.log(
  `[generate-webp] done: ${converted} converted, ${skipped} up-to-date, ${files.length} rasters, ${formatBytes(originalTotal)} → ${formatBytes(webpTotal)}`,
);
