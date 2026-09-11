#!/usr/bin/env node
/**
 * Merge electron-updater YAML produced by parallel arch builds.
 *
 * CI builds macOS x64 and arm64 in separate jobs, so each job writes its own
 * `*-mac.yml`. GitHub Release asset names and the OSS flatten step both use
 * basenames — this script merges those files and copies every other artifact
 * into a single output directory.
 *
 * Arch-specific installers may appear in more than one job folder (Apple Silicon
 * hosts can emit an extra arm64 copy while building x64). Prefer the copy from
 * the matching `release-mac-<arch>` artifact directory instead of failing.
 *
 * Zero npm dependencies so publish/upload-oss can run it after checkout only.
 */
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isMacUpdaterYml(fileName) {
  return fileName.endsWith('-mac.yml');
}

export function parseUpdaterYml(text) {
  return parseYaml(text.replace(/^\uFEFF/, ''));
}

export function stringifyUpdaterYml(doc) {
  return `${stringifyYaml(doc, 0)}\n`;
}

export function archTokenFromBasename(fileName) {
  const match = String(fileName).match(/-(?:mac|win)-(arm64|x64)(?:\.|$)/i)
    || String(fileName).match(/-linux-(arm64|amd64|x64|x86_64)(?:\.|$)/i);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  if (raw === 'amd64' || raw === 'x86_64') return 'x64';
  return raw;
}

export function pathMatchesArch(filePath, arch) {
  if (!arch) return false;
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const markers = [`release-mac-${arch}`, `mac-${arch}`, `release-win-${arch}`, `release-linux-${arch}`];
  return markers.some((marker) => {
    const token = `/${marker}`;
    return normalized.includes(`${token}/`) || normalized.endsWith(token);
  });
}

export function pickPreferredPath(base, paths) {
  if (paths.length === 1) return paths[0];

  const buffers = paths.map((filePath) => readFileSync(filePath));
  const allEqual = buffers.every((buf) => Buffer.compare(buf, buffers[0]) === 0);
  if (allEqual) return paths[0];

  const arch = archTokenFromBasename(base);
  const matching = arch ? paths.filter((filePath) => pathMatchesArch(filePath, arch)) : [];
  if (matching.length === 1) {
    const skipped = paths.filter((filePath) => filePath !== matching[0]);
    console.log(`Using ${matching[0]} for ${base}; ignored ${skipped.length} other copy/copies:`);
    for (const filePath of skipped) console.log(`  - ${filePath}`);
    return matching[0];
  }

  throw new Error(
    `Duplicate basename with different content: ${base}\n${paths.map((filePath) => `  - ${filePath}`).join('\n')}`,
  );
}

export function mergeUpdaterDocuments(docs, sources = []) {
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error('No updater documents to merge');
  }

  const versions = [...new Set(docs.map((doc) => String(doc?.version ?? '')))];
  if (versions.length > 1) {
    throw new Error(`Cannot merge updater yml with different versions: ${versions.join(', ')}`);
  }

  const filesByUrl = new Map();
  docs.forEach((doc, index) => {
    const source = sources[index] || '';
    for (const file of Array.isArray(doc?.files) ? doc.files : []) {
      if (!file || typeof file.url !== 'string') continue;
      const existing = filesByUrl.get(file.url);
      if (!existing) {
        filesByUrl.set(file.url, { file: { ...file }, source });
        continue;
      }
      const arch = archTokenFromBasename(file.url);
      const existingMatch = Boolean(arch && pathMatchesArch(existing.source, arch));
      const nextMatch = Boolean(arch && pathMatchesArch(source, arch));
      if (nextMatch && !existingMatch) {
        filesByUrl.set(file.url, { file: { ...file }, source });
      }
    }
  });
  const files = [...filesByUrl.values()].map((entry) => entry.file);
  files.sort((a, b) => a.url.localeCompare(b.url));

  const merged = { ...docs[0], files };
  const preferred = files.find((file) => /arm64.*\.zip$/i.test(file.url))
    || files.find((file) => /\.zip$/i.test(file.url))
    || files[0];
  if (preferred) {
    merged.path = preferred.url;
    merged.sha512 = preferred.sha512;
    if (preferred.size != null) merged.size = preferred.size;
  }

  const dates = docs.map((doc) => doc?.releaseDate).filter(Boolean).sort();
  if (dates.length) merged.releaseDate = dates[dates.length - 1];
  return merged;
}

export function flattenReleaseArtifacts(inDir, outDir) {
  const grouped = new Map();
  for (const filePath of walkFiles(inDir)) {
    const base = path.basename(filePath);
    if (base === 'builder-debug.yml') continue;
    const list = grouped.get(base) || [];
    list.push(filePath);
    grouped.set(base, list);
  }

  mkdirSync(outDir, { recursive: true });
  const written = [];

  for (const [base, paths] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const dest = path.join(outDir, base);
    if (isMacUpdaterYml(base)) {
      const docs = paths.map((filePath) => parseUpdaterYml(readFileSync(filePath, 'utf8')));
      const merged = mergeUpdaterDocuments(docs, paths);
      writeFileSync(dest, stringifyUpdaterYml(merged), 'utf8');
      const urls = (merged.files || []).map((file) => file.url);
      console.log(`Merged ${base} from ${paths.length} source(s): ${urls.join(', ') || '(no files)'}`);
      written.push(dest);
      continue;
    }

    copyFileSync(pickPreferredPath(base, paths), dest);
    written.push(dest);
  }

  return written;
}

function walkFiles(root) {
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) out.push(fullPath);
    }
  }
  return out;
}

function parseYaml(text) {
  const lines = text.split(/\r?\n/);
  let index = 0;

  const isBlank = (line) => !line.trim() || line.trimStart().startsWith('#');
  const indentOf = (line) => line.match(/^ */)[0].length;

  function current() {
    while (index < lines.length && isBlank(lines[index])) index += 1;
    return index < lines.length ? lines[index] : null;
  }

  function parseFolded(contentIndent, fold) {
    const parts = [];
    while (index < lines.length) {
      const line = lines[index];
      if (isBlank(line)) {
        parts.push('');
        index += 1;
        continue;
      }
      if (indentOf(line) < contentIndent) break;
      parts.push(line.slice(contentIndent));
      index += 1;
    }
    while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
    return fold ? parts.join(' ') : parts.join('\n');
  }

  function parseScalar(raw) {
    const value = raw.trim();
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null' || value === '~' || value === '') return null;
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1);
    }
    if (/^-?\d+$/.test(value)) return Number(value);
    if (/^-?\d+\.\d+$/.test(value)) return Number(value);
    return value;
  }

  function parseMap(indent) {
    const obj = {};
    while (true) {
      const line = current();
      if (line == null) break;
      const ind = indentOf(line);
      if (ind !== indent) break;
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) break;
      const colon = trimmed.indexOf(':');
      if (colon < 0) {
        throw new Error(`Invalid YAML at line ${index + 1}: ${trimmed}`);
      }
      const key = trimmed.slice(0, colon).trim();
      const rest = trimmed.slice(colon + 1).trim();
      index += 1;
      obj[key] = parseValue(rest, indent);
    }
    return obj;
  }

  function parseSeq(indent) {
    const arr = [];
    while (true) {
      const line = current();
      if (line == null) break;
      if (indentOf(line) !== indent) break;
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) break;
      const rest = trimmed.slice(2);
      index += 1;
      if (rest === '') {
        arr.push(parseNode(indent + 2));
        continue;
      }
      if (rest.includes(':')) {
        const colon = rest.indexOf(':');
        const key = rest.slice(0, colon).trim();
        const val = rest.slice(colon + 1).trim();
        const item = { [key]: parseValue(val, indent) };
        Object.assign(item, parseMap(indent + 2));
        arr.push(item);
        continue;
      }
      arr.push(parseScalar(rest));
    }
    return arr;
  }

  function parseValue(rest, parentIndent) {
    if (rest === '|' || rest === '|-' || rest === '|+' ) {
      return parseFolded(parentIndent + 2, false);
    }
    if (rest === '>' || rest === '>-' || rest === '>+') {
      return parseFolded(parentIndent + 2, true);
    }
    if (rest !== '') return parseScalar(rest);
    const next = current();
    if (next && indentOf(next) > parentIndent) {
      return parseNode(parentIndent + 1);
    }
    return '';
  }

  function parseNode(minIndent) {
    const line = current();
    if (line == null) return null;
    const indent = indentOf(line);
    if (indent < minIndent) return null;
    return line.trim().startsWith('- ') ? parseSeq(indent) : parseMap(indent);
  }

  const doc = parseNode(0);
  if (doc == null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('Updater YAML must be a mapping');
  }
  return doc;
}

function dumpScalar(value) {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value == null) return 'null';
  const text = String(value);
  if (text === '' || /[:#{}[\],&*?|<>=!%@`]/.test(text) || text.includes('\n')) {
    return JSON.stringify(text);
  }
  return text;
}

function stringifyYaml(value, indent) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length === 0) return `${pad}- {}`;
        const [first, ...rest] = keys;
        const lines = [`${pad}- ${first}: ${formatInlineOrBlock(item[first], indent + 2)}`];
        for (const key of rest) {
          lines.push(`${' '.repeat(indent + 2)}${key}: ${formatInlineOrBlock(item[key], indent + 4)}`);
        }
        return lines.join('\n');
      }
      return `${pad}- ${dumpScalar(item)}`;
    }).join('\n');
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return `${pad}{}`;
    return keys.map((key) => `${pad}${key}: ${formatInlineOrBlock(value[key], indent + 2)}`).join('\n');
  }
  return `${pad}${dumpScalar(value)}`;
}

function formatInlineOrBlock(value, indent) {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return `\n${stringifyYaml(value, indent)}`;
  }
  return dumpScalar(value);
}

function parseArgs(argv) {
  const args = { inDir: null, outDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--in' || arg === '--out') {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a path`);
      if (arg === '--in') args.inDir = value;
      else args.outDir = value;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.inDir || !args.outDir) {
    throw new Error('Usage: node scripts/merge-electron-updater-yml.mjs --in <dir> --out <dir>');
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const { inDir, outDir } = parseArgs(argv);
  const written = flattenReleaseArtifacts(inDir, outDir);
  console.log(`Wrote ${written.length} artifact(s) to ${outDir}`);
  return written;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
