import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = process.cwd();
const WRITE_SCRIPT = join(REPO_ROOT, 'scripts/write-provider-defaults-env.mjs');
const OUT_PATH = join(REPO_ROOT, 'resources/provider-defaults.env');

describe('write-provider-defaults-env.mjs', () => {
  const originalEnv = { ...process.env };
  let wroteFile = false;

  afterEach(() => {
    process.env = { ...originalEnv };
    if (wroteFile && existsSync(OUT_PATH)) {
      unlinkSync(OUT_PATH);
      wroteFile = false;
    }
  });

  it('writes provider defaults into resources/provider-defaults.env', () => {
    const result = spawnSync(process.execPath, [WRITE_SCRIPT], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PROVIDER_DEFAULT_NAME: 'bailian',
        PROVIDER_DEFAULT_APIKEY: 'sk-test-key',
        PROVIDER_DEFAULT_MODEL: 'qwen-plus',
      },
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    wroteFile = true;
    expect(existsSync(OUT_PATH)).toBe(true);

    const content = readFileSync(OUT_PATH, 'utf8');
    expect(content).toContain('PROVIDER_DEFAULT_NAME=bailian');
    expect(content).toContain('PROVIDER_DEFAULT_APIKEY=sk-test-key');
    expect(content).toContain('PROVIDER_DEFAULT_MODEL=qwen-plus');
  });

  it('removes stale bundled defaults when no env vars are set', () => {
    writeFileSync(OUT_PATH, 'PROVIDER_DEFAULT_NAME=bailian\n', 'utf8');
    wroteFile = true;

    const result = spawnSync(process.execPath, [WRITE_SCRIPT], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PROVIDER_DEFAULT_NAME: '',
        PROVIDER_DEFAULT_APIKEY: '',
        PROVIDER_DEFAULT_MODEL: '',
        PROVIDER_DEFAULT_BASE_URL: '',
      },
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(OUT_PATH)).toBe(false);
    wroteFile = false;
  });
});
