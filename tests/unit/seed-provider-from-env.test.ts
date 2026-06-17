import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getProviderDefaultsFromEnv: vi.fn(),
  listProviderAccounts: vi.fn(),
  getActiveOpenClawProviders: vi.fn(),
  createAccount: vi.fn(),
  setDefaultAccount: vi.fn(),
  hasAccountApiKey: vi.fn(),
  listAccounts: vi.fn(),
  getDefaultAccountId: vi.fn(),
  syncSavedProviderToRuntime: vi.fn(),
  syncDefaultProviderToRuntime: vi.fn(),
  providerAccountToConfig: vi.fn((account: { id: string; label: string; vendorId: string; model?: string }) => ({
    id: account.id,
    name: account.label,
    type: account.vendorId,
    model: account.model,
  })),
}));

vi.mock('@electron/utils/provider-default-env', () => ({
  getProviderDefaultsFromEnv: mocks.getProviderDefaultsFromEnv,
  resolveProviderDefaultName: (raw: string | undefined) => {
    const normalized = raw?.trim().toLowerCase();
    if (normalized === 'bailian') return 'bailian';
    if (normalized === 'custom') return 'custom';
    return null;
  },
}));

vi.mock('@electron/services/providers/provider-store', () => ({
  listProviderAccounts: mocks.listProviderAccounts,
  providerAccountToConfig: mocks.providerAccountToConfig,
}));

vi.mock('@electron/utils/openclaw-auth', () => ({
  getActiveOpenClawProviders: mocks.getActiveOpenClawProviders,
}));

vi.mock('@electron/services/providers/provider-service', () => ({
  getProviderService: () => ({
    createAccount: mocks.createAccount,
    setDefaultAccount: mocks.setDefaultAccount,
    hasAccountApiKey: mocks.hasAccountApiKey,
    listAccounts: mocks.listAccounts,
    getDefaultAccountId: mocks.getDefaultAccountId,
  }),
}));

vi.mock('@electron/services/providers/provider-runtime-sync', () => ({
  syncSavedProviderToRuntime: mocks.syncSavedProviderToRuntime,
  syncDefaultProviderToRuntime: mocks.syncDefaultProviderToRuntime,
}));

vi.mock('@electron/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  buildSeedProviderAccount,
  canAutoSeedFromEnv,
  getProviderEnvDefaultsPreview,
  seedProviderFromEnvIfNeeded,
} from '../../electron/utils/seed-provider-from-env';

describe('seed-provider-from-env', () => {
  const originalE2E = process.env.SMARTX_E2E;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SMARTX_E2E;
    mocks.listProviderAccounts.mockResolvedValue([]);
    mocks.getActiveOpenClawProviders.mockResolvedValue(new Set());
    mocks.createAccount.mockResolvedValue({});
    mocks.setDefaultAccount.mockResolvedValue(undefined);
    mocks.syncSavedProviderToRuntime.mockResolvedValue(undefined);
    mocks.syncDefaultProviderToRuntime.mockResolvedValue(undefined);
    mocks.hasAccountApiKey.mockResolvedValue(false);
    mocks.listAccounts.mockResolvedValue([]);
    mocks.getDefaultAccountId.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalE2E === undefined) {
      delete process.env.SMARTX_E2E;
    } else {
      process.env.SMARTX_E2E = originalE2E;
    }
  });

  it('accepts bailian defaults with only name and api key', () => {
    expect(canAutoSeedFromEnv({
      providerId: 'bailian',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })).toBe(true);
  });

  it('rejects defaults when api key is required but missing', () => {
    expect(canAutoSeedFromEnv({
      providerId: 'bailian',
      apiKey: '',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })).toBe(false);
  });

  it('builds a bailian account from env defaults', () => {
    const account = buildSeedProviderAccount({
      providerId: 'bailian',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    expect(account.vendorId).toBe('bailian');
    expect(account.id.startsWith('bailian-')).toBe(true);
    expect(account.model).toBe('qwen3.7-max');
    expect(account.baseUrl).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1');
    expect(account.isDefault).toBe(true);
  });

  it('returns a preview without exposing api keys', () => {
    mocks.getProviderDefaultsFromEnv.mockReturnValue({
      providerId: 'bailian',
      apiKey: 'sk-secret',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    expect(getProviderEnvDefaultsPreview()).toEqual({
      providerId: 'bailian',
      providerName: '阿里云百炼',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  });

  it('seeds provider on first launch when env defaults are present', async () => {
    mocks.getProviderDefaultsFromEnv.mockReturnValue({
      providerId: 'bailian',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    await expect(seedProviderFromEnvIfNeeded()).resolves.toEqual({
      status: 'seeded',
      providerName: '阿里云百炼',
      model: 'qwen3.7-max',
    });
    expect(mocks.createAccount).toHaveBeenCalledTimes(1);
    expect(mocks.setDefaultAccount).toHaveBeenCalledTimes(1);
    expect(mocks.syncSavedProviderToRuntime).toHaveBeenCalledTimes(1);
    expect(mocks.syncDefaultProviderToRuntime).toHaveBeenCalledTimes(1);
  });

  it('returns already-configured summary when a provider exists', async () => {
    mocks.getProviderDefaultsFromEnv.mockReturnValue({
      providerId: 'bailian',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    mocks.listProviderAccounts.mockResolvedValue([{
      id: 'existing',
      vendorId: 'moonshot',
      label: 'Moonshot',
      authMode: 'api_key',
      enabled: true,
      isDefault: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }]);
    mocks.hasAccountApiKey.mockResolvedValue(true);
    mocks.listAccounts.mockResolvedValue([{
      id: 'existing',
      vendorId: 'moonshot',
      label: 'Moonshot',
      authMode: 'api_key',
      model: 'kimi-k2',
      enabled: true,
      isDefault: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }]);
    mocks.getDefaultAccountId.mockResolvedValue('existing');

    await expect(seedProviderFromEnvIfNeeded()).resolves.toEqual({
      status: 'already-configured',
      providerName: 'Moonshot',
      model: 'kimi-k2',
    });
    expect(mocks.createAccount).not.toHaveBeenCalled();
  });

  it('skips seeding in E2E mode', async () => {
    process.env.SMARTX_E2E = '1';
    mocks.getProviderDefaultsFromEnv.mockReturnValue({
      providerId: 'bailian',
      apiKey: 'sk-test',
      model: 'qwen3.7-max',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    await expect(seedProviderFromEnvIfNeeded()).resolves.toEqual({ status: 'skipped' });
    expect(mocks.createAccount).not.toHaveBeenCalled();
  });
});
