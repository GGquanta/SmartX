import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  getProviderDefaultsFromEnv,
  loadProviderDefaultEnvFiles,
  resetProviderDefaultEnvCache,
  resolveProviderDefaultName,
  resolveSmartXProjectRoot,
} from '../../electron/utils/provider-default-env';

describe('provider-default-env', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    resetProviderDefaultEnvCache();
  });

  it('returns null when no provider default env vars are set', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-env-empty-'));
    delete process.env.PROVIDER_DEFAULT_NAME;
    delete process.env.PROVIDER_DEFAULT_NAME;
    delete process.env.PROVIDER_DEFAULT_APIKEY;
    delete process.env.PROVIDER_DEFAULT_MODEL;
    delete process.env.PROVIDER_DEFAULT_BASE_URL;
    resetProviderDefaultEnvCache();
    expect(getProviderDefaultsFromEnv(root)).toBeNull();
  });

  it('resolves provider id from PROVIDER_DEFAULT_NAME', () => {
    expect(resolveProviderDefaultName('custom')).toBe('custom');
    expect(resolveProviderDefaultName('Moonshot')).toBe('moonshot');
    expect(resolveProviderDefaultName('bailian')).toBe('bailian');
    expect(resolveProviderDefaultName('not-a-provider')).toBeNull();
  });

  it('auto-fills bailian base URL and model from provider registry', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-env-bailian-'));
    writeFileSync(
      join(root, '.env.local'),
      [
        'PROVIDER_DEFAULT_NAME=bailian',
        'PROVIDER_DEFAULT_APIKEY=sk-test',
      ].join('\n'),
      'utf8',
    );

    delete process.env.PROVIDER_DEFAULT_NAME;
    delete process.env.PROVIDER_DEFAULT_APIKEY;
    delete process.env.PROVIDER_DEFAULT_MODEL;
    delete process.env.PROVIDER_DEFAULT_BASE_URL;
    resetProviderDefaultEnvCache();
    loadProviderDefaultEnvFiles(root);

    expect(getProviderDefaultsFromEnv(root)).toEqual({
      providerId: 'bailian',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    expect(process.env.PROVIDER_DEFAULT_BASE_URL).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1');
    expect(process.env.PROVIDER_DEFAULT_MODEL).toBe('qwen3.7-max');
  });

  it('lets explicit env values override bailian registry defaults', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-env-bailian-override-'));
    writeFileSync(
      join(root, '.env.local'),
      [
        'PROVIDER_DEFAULT_NAME=bailian',
        'PROVIDER_DEFAULT_MODEL=qwen-plus',
        'PROVIDER_DEFAULT_BASE_URL=https://custom.example.com/v1',
      ].join('\n'),
      'utf8',
    );

    delete process.env.PROVIDER_DEFAULT_NAME;
    delete process.env.PROVIDER_DEFAULT_MODEL;
    delete process.env.PROVIDER_DEFAULT_BASE_URL;
    resetProviderDefaultEnvCache();
    loadProviderDefaultEnvFiles(root);

    expect(getProviderDefaultsFromEnv(root)).toEqual({
      providerId: 'bailian',
      apiKey: '',
      model: 'qwen-plus',
      baseUrl: 'https://custom.example.com/v1',
    });
  });

  it('reads provider defaults from .env.local', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-env-'));
    writeFileSync(
      join(root, '.env.local'),
      [
        'PROVIDER_DEFAULT_NAME=custom',
        'PROVIDER_DEFAULT_APIKEY=sk-test',
        'PROVIDER_DEFAULT_MODEL=qwen3.7-max',
        'PROVIDER_DEFAULT_BASE_URL=https://example.com/v1',
      ].join('\n'),
      'utf8',
    );

    delete process.env.PROVIDER_DEFAULT_NAME;
    delete process.env.PROVIDER_DEFAULT_APIKEY;
    delete process.env.PROVIDER_DEFAULT_MODEL;
    delete process.env.PROVIDER_DEFAULT_BASE_URL;
    resetProviderDefaultEnvCache();
    loadProviderDefaultEnvFiles(root);

    expect(getProviderDefaultsFromEnv(root)).toEqual({
      providerId: 'custom',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://example.com/v1',
    });
  });

  it('falls back to custom when only model/base URL are configured', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-env-'));
    writeFileSync(
      join(root, '.env.local'),
      'PROVIDER_DEFAULT_MODEL=qwen3.7-max\n',
      'utf8',
    );

    delete process.env.PROVIDER_DEFAULT_NAME;
    delete process.env.PROVIDER_DEFAULT_MODEL;
    resetProviderDefaultEnvCache();
    loadProviderDefaultEnvFiles(root);

    expect(getProviderDefaultsFromEnv(root)).toEqual({
      providerId: 'custom',
      apiKey: '',
      model: 'qwen3.7-max',
      baseUrl: '',
    });
  });

  it('resolves project root from package.json', () => {
    const root = resolveSmartXProjectRoot();
    expect(root).toContain('SmartX');
  });

  it('lets .env.local override values from .env', () => {
    const root = mkdtempSync(join(tmpdir(), 'smartx-env-'));
    writeFileSync(join(root, '.env'), 'PROVIDER_DEFAULT_MODEL=from-env\n', 'utf8');
    writeFileSync(join(root, '.env.local'), 'PROVIDER_DEFAULT_MODEL=from-local\n', 'utf8');

    delete process.env.PROVIDER_DEFAULT_MODEL;
    resetProviderDefaultEnvCache();
    loadProviderDefaultEnvFiles(root);

    expect(getProviderDefaultsFromEnv(root)?.model).toBe('from-local');
  });
});
