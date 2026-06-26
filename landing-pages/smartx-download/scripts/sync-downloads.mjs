import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from '../../../node_modules/yaml/dist/index.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(scriptDir, '..');
const manifestPath = join(landingRoot, 'public', 'downloads.json');

const DEFAULT_OSS_BASE = 'https://smartx-assets.oss-cn-hongkong.aliyuncs.com';
const YML_SOURCES = [
  { name: 'latest-mac.yml', url: `${DEFAULT_OSS_BASE}/latest/latest-mac.yml` },
  { name: 'latest-linux.yml', url: `${DEFAULT_OSS_BASE}/latest/latest-linux.yml` },
  { name: 'latest.yml', url: `${DEFAULT_OSS_BASE}/latest/latest.yml` },
];

/** Maps variant id → filename suffix after SmartX-{version} */
const VARIANT_SUFFIXES = {
  'macos-arm64-dmg': '-mac-arm64.dmg',
  'macos-x64-dmg': '-mac-x64.dmg',
  'macos-arm64-zip': '-mac-arm64.zip',
  'macos-x64-zip': '-mac-x64.zip',
  'windows-x64-nsis': '-win-x64.exe',
  'linux-arm64-appimage': '-linux-arm64.AppImage',
  'linux-x64-appimage': '-linux-x86_64.AppImage',
  'linux-arm64-deb': '-linux-arm64.deb',
  'linux-x64-deb': '-linux-amd64.deb',
  'linux-x64-rpm': '-linux-x86_64.rpm',
};

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatUpdatedAt(releaseDate) {
  return releaseDate.slice(0, 10);
}

function bumpPathVersion(path, version) {
  return path.replace(/SmartX-[\d.]+-/, `SmartX-${version}-`);
}

function collectFilesFromYmlDocs(docs) {
  const files = new Map();

  for (const doc of docs) {
    for (const entry of doc.files ?? []) {
      if (entry?.url && typeof entry.size === 'number' && !files.has(entry.url)) {
        files.set(entry.url, entry.size);
      }
    }
  }

  return files;
}

function findFileForVariant(files, suffix) {
  for (const [url, size] of files) {
    if (url.endsWith(suffix)) {
      return { url, size };
    }
  }
  return null;
}

function pickVersion(docs) {
  const macDoc = docs.find((doc) => doc.source === 'latest-mac.yml');
  const versions = docs.map((doc) => doc.version).filter(Boolean);
  const unique = [...new Set(versions)];

  if (unique.length > 1) {
    console.warn(`[sync-downloads] version mismatch across yml files: ${unique.join(', ')}`);
  }

  return macDoc?.version ?? unique[0] ?? null;
}

function pickUpdatedAt(docs) {
  const dates = docs
    .map((doc) => doc.releaseDate)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return dates[0] ? formatUpdatedAt(dates[0]) : null;
}

async function fetchYmlSource({ name, url }) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${name}: HTTP ${res.status}`);
  }

  const text = await res.text();
  const doc = parseYaml(text);

  return {
    source: name,
    version: typeof doc.version === 'string' ? doc.version : null,
    releaseDate: typeof doc.releaseDate === 'string' ? doc.releaseDate : null,
    files: Array.isArray(doc.files) ? doc.files : [],
  };
}

function syncManifest(manifest, docs) {
  const files = collectFilesFromYmlDocs(docs);
  const version = pickVersion(docs);
  const updatedAt = pickUpdatedAt(docs);

  if (!version) {
    throw new Error('Could not determine version from yml sources');
  }

  const next = structuredClone(manifest);
  next.version = version;
  if (updatedAt) next.updatedAt = updatedAt;

  const warnings = [];

  for (const platform of next.platforms) {
    for (const variant of platform.variants) {
      const suffix = VARIANT_SUFFIXES[variant.id];
      if (!suffix) {
        warnings.push(`unknown variant id: ${variant.id}`);
        continue;
      }

      const match = findFileForVariant(files, suffix);
      if (match) {
        variant.path = `/latest/${match.url}`;
        variant.size = formatBytes(match.size);
        continue;
      }

      variant.path = bumpPathVersion(variant.path, version);
      warnings.push(`${variant.id}: not found in yml, updated path only`);
    }
  }

  return { manifest: next, warnings };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const ossBase = manifest.ossBaseUrl?.replace(/\/$/, '') ?? DEFAULT_OSS_BASE;

  const sources = YML_SOURCES.map((source) =>
    source.name === 'latest-mac.yml'
      ? { ...source, url: `${ossBase}/latest/latest-mac.yml` }
      : source.name === 'latest-linux.yml'
        ? { ...source, url: `${ossBase}/latest/latest-linux.yml` }
        : { ...source, url: `${ossBase}/latest/latest.yml` },
  );

  console.log('[sync-downloads] fetching yml from OSS...');
  const docs = await Promise.all(sources.map((source) => fetchYmlSource(source)));

  const { manifest: next, warnings } = syncManifest(manifest, docs);

  console.log(`[sync-downloads] version ${manifest.version} -> ${next.version}`);
  console.log(`[sync-downloads] updatedAt ${manifest.updatedAt} -> ${next.updatedAt}`);

  for (const warning of warnings) {
    console.warn(`[sync-downloads] warn: ${warning}`);
  }

  if (dryRun) {
    console.log('[sync-downloads] dry run, not writing file');
    console.log(JSON.stringify(next, null, 2));
    return;
  }

  writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`[sync-downloads] wrote ${manifestPath}`);
}

main().catch((error) => {
  console.error('[sync-downloads] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
