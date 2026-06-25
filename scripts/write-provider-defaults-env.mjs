#!/usr/bin/env node
/**
 * Writes CI/build-time PROVIDER_DEFAULT_* values into resources/provider-defaults.env
 * so packaged SmartX builds can auto-seed the default AI provider on first launch.
 *
 * Called by run-electron-builder.mjs before electron-builder copies extraResources.
 */

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEYS = [
  'PROVIDER_DEFAULT_NAME',
  'PROVIDER_DEFAULT_APIKEY',
  'PROVIDER_DEFAULT_MODEL',
  'PROVIDER_DEFAULT_BASE_URL',
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = join(ROOT, 'resources', 'provider-defaults.env');

function escapeEnvValue(value) {
  if (/[\s#"'\\]/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

const lines = [];
for (const key of KEYS) {
  const value = process.env[key]?.trim();
  if (value) {
    lines.push(`${key}=${escapeEnvValue(value)}`);
  }
}

if (lines.length === 0) {
  if (existsSync(OUT_PATH)) {
    unlinkSync(OUT_PATH);
  }
  console.log('[write-provider-defaults-env] No PROVIDER_DEFAULT_* set; skipped bundled defaults');
} else {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`[write-provider-defaults-env] Wrote ${lines.length} key(s) to resources/provider-defaults.env`);
}
