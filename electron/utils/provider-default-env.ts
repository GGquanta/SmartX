import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProviderDefinition } from '../shared/providers/registry';
import { PROVIDER_TYPES, type ProviderType } from '../shared/providers/types';
import { logger } from './logger';

export type ProviderEnvDefaults = {
  providerId: string;
  apiKey: string;
  model: string;
  baseUrl: string;
};

const ENV_KEYS = [
  'PROVIDER_DEFAULT_NAME',
  'PROVIDER_DEFAULT_APIKEY',
  'PROVIDER_DEFAULT_MODEL',
  'PROVIDER_DEFAULT_BASE_URL',
] as const;

let envFilesLoaded = false;
let loadedRoot: string | null = null;

const moduleDir = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function isSmartXProjectRoot(dir: string): boolean {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return false;
  if (existsSync(join(dir, '.env.local')) || existsSync(join(dir, '.env'))) {
    return true;
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
    return pkg.name === 'smartx';
  } catch {
    return false;
  }
}

/** Resolve repo root for `.env` / `.env.local` (dev cwd may differ from project root). */
export function resolveSmartXProjectRoot(): string {
  const explicit = process.env.SMARTX_PROJECT_ROOT?.trim();
  if (explicit && isSmartXProjectRoot(explicit)) {
    return explicit;
  }

  const candidates = [
    process.env.INIT_CWD?.trim(),
    process.cwd(),
  ].filter((value): value is string => Boolean(value));

  for (const dir of candidates) {
    if (isSmartXProjectRoot(dir)) {
      return dir;
    }
  }

  let dir = moduleDir;
  for (let depth = 0; depth < 12; depth += 1) {
    if (isSmartXProjectRoot(dir)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return process.cwd();
}

function shouldReloadEnvFilesInDev(): boolean {
  return Boolean(process.env.VITE_DEV_SERVER_URL);
}

function applyParsedEnv(parsed: Record<string, string>, override: boolean): void {
  for (const key of ENV_KEYS) {
    if (!(key in parsed)) continue;
    const value = parsed[key]?.trim() ?? '';
    if (!override && process.env[key]?.trim()) continue;
    if (value) {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

export function resolveProviderDefaultName(raw: string | undefined): ProviderType | null {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return null;
  return (PROVIDER_TYPES as readonly string[]).includes(normalized)
    ? (normalized as ProviderType)
    : null;
}

export function resolveProviderRegistryDefaults(
  providerId: ProviderType | null,
): { baseUrl: string; model: string } {
  if (!providerId || providerId === 'custom') {
    return { baseUrl: '', model: '' };
  }

  const definition = getProviderDefinition(providerId);
  return {
    baseUrl: definition?.defaultBaseUrl ?? definition?.providerConfig?.baseUrl ?? '',
    model: definition?.defaultModelId ?? '',
  };
}

function applyRegistryDefaultsToProcessEnv(providerId: ProviderType | null): void {
  if (!providerId || providerId === 'custom') {
    return;
  }

  const defaults = resolveProviderRegistryDefaults(providerId);
  if (!process.env.PROVIDER_DEFAULT_BASE_URL?.trim() && defaults.baseUrl) {
    process.env.PROVIDER_DEFAULT_BASE_URL = defaults.baseUrl;
  }
  if (!process.env.PROVIDER_DEFAULT_MODEL?.trim() && defaults.model) {
    process.env.PROVIDER_DEFAULT_MODEL = defaults.model;
  }
}

/**
 * Load `.env` then `.env.local` from the project root.
 * In dev, re-reads on each call so `.env.local` edits apply without restarting Electron.
 */
export function loadProviderDefaultEnvFiles(rootDir?: string): void {
  const root = rootDir ?? resolveSmartXProjectRoot();
  const forceReload = shouldReloadEnvFilesInDev();
  if (envFilesLoaded && loadedRoot === root && !forceReload) {
    return;
  }

  envFilesLoaded = true;
  loadedRoot = root;

  const envPath = join(root, '.env');
  if (existsSync(envPath)) {
    applyParsedEnv(parseEnvFile(readFileSync(envPath, 'utf8')), false);
  }

  const localEnvPath = join(root, '.env.local');
  if (existsSync(localEnvPath)) {
    applyParsedEnv(parseEnvFile(readFileSync(localEnvPath, 'utf8')), true);
  }

  applyRegistryDefaultsToProcessEnv(
    resolveProviderDefaultName(process.env.PROVIDER_DEFAULT_NAME),
  );

  logger.debug('Provider default env loaded', {
    root,
    hasName: Boolean(process.env.PROVIDER_DEFAULT_NAME?.trim()),
    hasModel: Boolean(process.env.PROVIDER_DEFAULT_MODEL?.trim()),
    hasBaseUrl: Boolean(process.env.PROVIDER_DEFAULT_BASE_URL?.trim()),
    hasApiKey: Boolean(process.env.PROVIDER_DEFAULT_APIKEY?.trim()),
  });
}

export function getProviderDefaultsFromEnv(rootDir?: string): ProviderEnvDefaults | null {
  loadProviderDefaultEnvFiles(rootDir);

  const rawName = process.env.PROVIDER_DEFAULT_NAME?.trim() ?? '';
  const providerId = resolveProviderDefaultName(rawName);
  if (rawName && !providerId) {
    logger.warn(`Invalid PROVIDER_DEFAULT_NAME "${rawName}"; expected one of: ${PROVIDER_TYPES.join(', ')}`);
  }

  const apiKey = process.env.PROVIDER_DEFAULT_APIKEY?.trim() ?? '';
  const registryDefaults = resolveProviderRegistryDefaults(providerId);
  const model = process.env.PROVIDER_DEFAULT_MODEL?.trim() || registryDefaults.model;
  const baseUrl = process.env.PROVIDER_DEFAULT_BASE_URL?.trim() || registryDefaults.baseUrl;

  if (!providerId && !apiKey && !model && !baseUrl) {
    return null;
  }

  return {
    providerId: providerId ?? 'custom',
    apiKey,
    model,
    baseUrl,
  };
}

/** For tests: reset cached load state. */
export function resetProviderDefaultEnvCache(): void {
  envFilesLoaded = false;
  loadedRoot = null;
}
