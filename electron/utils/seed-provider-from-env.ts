import { randomUUID } from 'node:crypto';
import type { GatewayManager } from '../gateway/manager';
import type {
  ProviderEnvDefaultsPreview,
  SeedProviderFromEnvResponse,
} from '@shared/host-api/contract';
import { getProviderDefinition } from '../shared/providers/registry';
import {
  OLLAMA_PLACEHOLDER_API_KEY,
  type ProviderAccount,
  type ProviderType,
} from '../shared/providers/types';
import { getProviderService } from '../services/providers/provider-service';
import {
  listProviderAccounts,
  providerAccountToConfig,
} from '../services/providers/provider-store';
import {
  syncDefaultProviderToRuntime,
  syncSavedProviderToRuntime,
} from '../services/providers/provider-runtime-sync';
import { getActiveOpenClawProviders } from './openclaw-auth';
import { logger } from './logger';
import {
  getProviderDefaultsFromEnv,
  resolveProviderDefaultName,
  type ProviderEnvDefaults,
} from './provider-default-env';

function resolveSeedVendorId(defaults: ProviderEnvDefaults): ProviderType {
  return resolveProviderDefaultName(defaults.providerId) ?? 'custom';
}

function buildSeedAccountId(vendorId: ProviderType): string {
  const definition = getProviderDefinition(vendorId);
  if (definition?.supportsMultipleAccounts) {
    return `${vendorId}-${randomUUID()}`;
  }
  return vendorId;
}

function resolveSeedApiKey(vendorId: ProviderType, defaults: ProviderEnvDefaults): string {
  const trimmed = defaults.apiKey.trim();
  if (trimmed) {
    return trimmed;
  }
  if (vendorId === 'ollama') {
    return OLLAMA_PLACEHOLDER_API_KEY;
  }
  return '';
}

export function canAutoSeedFromEnv(defaults: ProviderEnvDefaults | null): defaults is ProviderEnvDefaults {
  if (!defaults) {
    return false;
  }

  const vendorId = resolveSeedVendorId(defaults);
  const definition = getProviderDefinition(vendorId);
  const requiresApiKey = definition?.requiresApiKey ?? vendorId !== 'ollama';
  const apiKey = resolveSeedApiKey(vendorId, defaults);

  if (requiresApiKey && !apiKey) {
    return false;
  }

  if (definition?.isOAuth && !definition.supportsApiKey && !apiKey) {
    return false;
  }

  if (vendorId === 'custom' && (!defaults.baseUrl.trim() || !defaults.model.trim())) {
    return false;
  }

  return true;
}

async function hasConfiguredProviderAccounts(): Promise<boolean> {
  const providerService = getProviderService();
  const accounts = await listProviderAccounts();

  for (const account of accounts) {
    if (await providerService.hasAccountApiKey(account.id)) {
      return true;
    }
    if (account.vendorId === 'ollama') {
      return true;
    }
    if (account.authMode === 'oauth_browser' || account.authMode === 'oauth_device') {
      return true;
    }
  }

  const activeProviders = await getActiveOpenClawProviders();
  return activeProviders.size > 0;
}

async function resolveConfiguredProviderSummary(): Promise<Pick<SeedProviderFromEnvResponse, 'providerName' | 'model'> | null> {
  const providerService = getProviderService();
  const accounts = await providerService.listAccounts();
  if (accounts.length === 0) {
    return null;
  }

  const defaultAccountId = await providerService.getDefaultAccountId();
  const account = accounts.find((entry) => entry.id === defaultAccountId) ?? accounts[0];
  const definition = getProviderDefinition(account.vendorId);

  return {
    providerName: account.label || definition?.name || account.vendorId,
    model: account.model || definition?.defaultModelId,
  };
}

export function getProviderEnvDefaultsPreview(): ProviderEnvDefaultsPreview | null {
  const defaults = getProviderDefaultsFromEnv();
  if (!canAutoSeedFromEnv(defaults)) {
    return null;
  }

  const vendorId = resolveSeedVendorId(defaults);
  const definition = getProviderDefinition(vendorId);

  return {
    providerId: vendorId,
    providerName: definition?.name ?? vendorId,
    model: defaults.model.trim() || definition?.defaultModelId || '',
    baseUrl: defaults.baseUrl.trim()
      || definition?.defaultBaseUrl
      || definition?.providerConfig?.baseUrl
      || '',
  };
}

export function buildSeedProviderAccount(defaults: ProviderEnvDefaults): ProviderAccount {
  const vendorId = resolveSeedVendorId(defaults);
  const definition = getProviderDefinition(vendorId);
  const now = new Date().toISOString();

  return {
    id: buildSeedAccountId(vendorId),
    vendorId,
    label: definition?.name ?? (vendorId === 'custom' ? 'Custom' : vendorId),
    authMode: vendorId === 'ollama'
      ? 'local'
      : (definition?.defaultAuthMode ?? 'api_key'),
    baseUrl: defaults.baseUrl.trim()
      || definition?.defaultBaseUrl
      || definition?.providerConfig?.baseUrl,
    apiProtocol: definition?.providerConfig?.api,
    model: defaults.model.trim() || definition?.defaultModelId,
    enabled: true,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function seedProviderFromEnvIfNeeded(
  gatewayManager?: GatewayManager,
): Promise<SeedProviderFromEnvResponse> {
  if (process.env.SMARTX_E2E === '1') {
    return { status: 'skipped' };
  }

  const defaults = getProviderDefaultsFromEnv();
  if (!canAutoSeedFromEnv(defaults)) {
    return { status: 'missing-env' };
  }

  if (await hasConfiguredProviderAccounts()) {
    const summary = await resolveConfiguredProviderSummary();
    if (summary) {
      logger.debug('Provider env seed skipped: provider already configured');
      return {
        status: 'already-configured',
        ...summary,
      };
    }
    return { status: 'skipped' };
  }

  const account = buildSeedProviderAccount(defaults);
  const apiKey = resolveSeedApiKey(resolveSeedVendorId(defaults), defaults);
  const providerService = getProviderService();

  try {
    await providerService.createAccount(account, apiKey);
    await providerService.setDefaultAccount(account.id);
    const config = providerAccountToConfig(account);
    await syncSavedProviderToRuntime(config, apiKey, gatewayManager);
    await syncDefaultProviderToRuntime(account.id, gatewayManager);
    logger.info(`Auto-seeded default provider "${account.id}" from environment defaults`);
    return {
      status: 'seeded',
      providerName: account.label,
      model: account.model,
    };
  } catch (error) {
    const message = String(error);
    logger.warn('Failed to auto-seed provider from environment defaults:', error);
    return {
      status: 'failed',
      error: message,
    };
  }
}
