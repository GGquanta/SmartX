// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  flattenReleaseArtifacts,
  mergeUpdaterDocuments,
  parseUpdaterYml,
  stringifyUpdaterYml,
} from '../../scripts/merge-electron-updater-yml.mjs';

const ARM_SHA = 'Y'.repeat(88);
const X64_SHA = 'Z'.repeat(88);

function updaterDoc({ version = '0.5.5', arch, date }) {
  const zip = `SmartX-${version}-mac-${arch}.zip`;
  const dmg = `SmartX-${version}-mac-${arch}.dmg`;
  const sha = arch === 'arm64' ? ARM_SHA : X64_SHA;
  return {
    version,
    files: [
      { url: zip, sha512: sha, size: arch === 'arm64' ? 100 : 110, blockMapSize: 12 },
      { url: dmg, sha512: sha, size: arch === 'arm64' ? 200 : 210 },
    ],
    path: zip,
    sha512: sha,
    releaseDate: date,
  };
}

describe('merge-electron-updater-yml', () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('round-trips a typical electron-builder mac updater document', () => {
    const doc = updaterDoc({ arch: 'arm64', date: '2026-09-10T07:27:38.530Z' });
    const parsed = parseUpdaterYml(stringifyUpdaterYml(doc));
    expect(parsed).toEqual(doc);
  });

  it('parses folded sha512 scalars', () => {
    const yaml = [
      'version: 0.5.5',
      'files:',
      '  - url: SmartX-0.5.5-mac-arm64.zip',
      '    sha512: >-',
      `      ${ARM_SHA.slice(0, 40)}`,
      `      ${ARM_SHA.slice(40)}`,
      '    size: 42',
      'path: SmartX-0.5.5-mac-arm64.zip',
      `sha512: "${ARM_SHA}"`,
      "releaseDate: '2026-09-10T07:27:38.530Z'",
      '',
    ].join('\n');

    const parsed = parseUpdaterYml(yaml);
    expect(parsed.files[0].sha512).toBe(`${ARM_SHA.slice(0, 40)} ${ARM_SHA.slice(40)}`);
    expect(parsed.files[0].size).toBe(42);
    expect(parsed.releaseDate).toBe('2026-09-10T07:27:38.530Z');
  });

  it('merges x64 and arm64 files and prefers arm64 zip for path', () => {
    const merged = mergeUpdaterDocuments([
      updaterDoc({ arch: 'x64', date: '2026-09-10T07:20:00.000Z' }),
      updaterDoc({ arch: 'arm64', date: '2026-09-10T07:30:00.000Z' }),
    ]);

    expect(merged.version).toBe('0.5.5');
    expect(merged.files.map((file: { url: string }) => file.url)).toEqual([
      'SmartX-0.5.5-mac-arm64.dmg',
      'SmartX-0.5.5-mac-arm64.zip',
      'SmartX-0.5.5-mac-x64.dmg',
      'SmartX-0.5.5-mac-x64.zip',
    ]);
    expect(merged.path).toBe('SmartX-0.5.5-mac-arm64.zip');
    expect(merged.sha512).toBe(ARM_SHA);
    expect(merged.releaseDate).toBe('2026-09-10T07:30:00.000Z');
  });

  it('rejects updater documents with different versions', () => {
    expect(() => mergeUpdaterDocuments([
      updaterDoc({ version: '0.5.5', arch: 'arm64', date: '2026-09-10T07:30:00.000Z' }),
      updaterDoc({ version: '0.5.6', arch: 'x64', date: '2026-09-10T07:30:00.000Z' }),
    ])).toThrow(/different versions/);
  });

  it('flattens parallel arch artifacts and merges *-mac.yml', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-yml-merge-'));
    tempRoots.push(root);
    const armDir = join(root, 'release-mac-arm64');
    const x64Dir = join(root, 'release-mac-x64');
    const winDir = join(root, 'release-win');
    mkdirSync(armDir, { recursive: true });
    mkdirSync(x64Dir, { recursive: true });
    mkdirSync(winDir, { recursive: true });

    writeFileSync(join(armDir, 'latest-mac.yml'), stringifyUpdaterYml(updaterDoc({
      arch: 'arm64',
      date: '2026-09-10T07:30:00.000Z',
    })));
    writeFileSync(join(armDir, 'SmartX-0.5.5-mac-arm64.zip'), 'arm-zip');
    writeFileSync(join(x64Dir, 'latest-mac.yml'), stringifyUpdaterYml(updaterDoc({
      arch: 'x64',
      date: '2026-09-10T07:20:00.000Z',
    })));
    writeFileSync(join(x64Dir, 'SmartX-0.5.5-mac-x64.zip'), 'x64-zip');
    writeFileSync(join(winDir, 'latest.yml'), 'version: 0.5.5\n');
    writeFileSync(join(winDir, 'builder-debug.yml'), 'ignore-me: true\n');

    const outDir = join(root, 'out');
    flattenReleaseArtifacts(root, outDir);

    const merged = parseUpdaterYml(readFileSync(join(outDir, 'latest-mac.yml'), 'utf8'));
    expect(merged.files).toHaveLength(4);
    expect(merged.path).toBe('SmartX-0.5.5-mac-arm64.zip');
    expect(readFileSync(join(outDir, 'SmartX-0.5.5-mac-arm64.zip'), 'utf8')).toBe('arm-zip');
    expect(readFileSync(join(outDir, 'SmartX-0.5.5-mac-x64.zip'), 'utf8')).toBe('x64-zip');
    expect(readFileSync(join(outDir, 'latest.yml'), 'utf8')).toBe('version: 0.5.5\n');
    expect(() => readFileSync(join(outDir, 'builder-debug.yml'))).toThrow();
  });

  it('prefers the arch-matching copy when the same dmg appears in both mac jobs', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-yml-arch-dup-'));
    tempRoots.push(root);
    const armDir = join(root, 'release-mac-arm64');
    const x64Dir = join(root, 'release-mac-x64');
    mkdirSync(armDir, { recursive: true });
    mkdirSync(x64Dir, { recursive: true });

    writeFileSync(join(armDir, 'latest-mac.yml'), stringifyUpdaterYml(updaterDoc({
      arch: 'arm64',
      date: '2026-09-10T07:30:00.000Z',
    })));
    writeFileSync(join(x64Dir, 'latest-mac.yml'), stringifyUpdaterYml({
      ...updaterDoc({ arch: 'x64', date: '2026-09-10T07:20:00.000Z' }),
      files: [
        ...updaterDoc({ arch: 'x64', date: '2026-09-10T07:20:00.000Z' }).files,
        { url: 'SmartX-0.5.5-mac-arm64.dmg', sha512: 'wrong-arm-sha', size: 1 },
      ],
    }));
    writeFileSync(join(armDir, 'SmartX-0.5.5-mac-arm64.dmg'), 'arm-dmg-from-arm-job');
    writeFileSync(join(x64Dir, 'SmartX-0.5.5-mac-arm64.dmg'), 'arm-dmg-from-x64-job');
    writeFileSync(join(x64Dir, 'SmartX-0.5.5-mac-x64.dmg'), 'x64-dmg');

    flattenReleaseArtifacts(root, join(root, 'out'));

    expect(readFileSync(join(root, 'out', 'SmartX-0.5.5-mac-arm64.dmg'), 'utf8')).toBe('arm-dmg-from-arm-job');
    expect(readFileSync(join(root, 'out', 'SmartX-0.5.5-mac-x64.dmg'), 'utf8')).toBe('x64-dmg');
    const merged = parseUpdaterYml(readFileSync(join(root, 'out', 'latest-mac.yml'), 'utf8'));
    const armDmg = merged.files.find((file: { url: string }) => file.url.endsWith('mac-arm64.dmg'));
    expect(armDmg?.sha512).toBe(ARM_SHA);
  });

  it('throws when the same basename has different non-yml content', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-yml-conflict-'));
    tempRoots.push(root);
    mkdirSync(join(root, 'a'), { recursive: true });
    mkdirSync(join(root, 'b'), { recursive: true });
    writeFileSync(join(root, 'a', 'latest.yml'), 'one');
    writeFileSync(join(root, 'b', 'latest.yml'), 'two');

    expect(() => flattenReleaseArtifacts(root, join(root, 'out'))).toThrow(/different content/);
  });
});
