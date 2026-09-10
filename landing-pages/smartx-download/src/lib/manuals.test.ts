import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const MANUAL_PAGES = [
  'public/manuals/smartx/index.html',
  'public/manuals/liangku/index.html',
] as const;

describe('landing manuals', () => {
  it.each(MANUAL_PAGES)('%s exists for OSS deploy', (relativePath) => {
    expect(existsSync(join(landingRoot, relativePath))).toBe(true);
  });
});
