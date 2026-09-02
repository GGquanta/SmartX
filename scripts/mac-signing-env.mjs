#!/usr/bin/env node
/**
 * Load local macOS signing env (same method as quantamate-demo):
 *   - Developer ID Application via Keychain, or CSC_LINK (.p12)
 *   - Notarization via App Store Connect API Key (notarytool)
 *
 * Path-style vars in .env / .env.local:
 *   CSC_LINK_PATH, APPLE_API_KEY_P8_PATH
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnvFiles(root = ROOT) {
  return {
    ...parseEnvFile(path.join(root, '.env')),
    ...parseEnvFile(path.join(root, '.env.local')),
  };
}

export function applyMacSigningEnv(env = process.env, { root = ROOT } = {}) {
  const next = { ...env };
  const files = loadEnvFiles(root);
  for (const [key, value] of Object.entries(files)) {
    if (next[key] === undefined || next[key] === '') {
      next[key] = value;
    }
  }

  // Importing a .p12 is slower than Keychain auto-discovery. Only do it when
  // CI/local explicitly asks (CSC_LINK already set, or SMARTX_USE_CSC_LINK=1).
  const useP12 = next.SMARTX_USE_CSC_LINK === '1' || next.SMARTX_USE_CSC_LINK === 'true';
  if (!next.CSC_LINK && next.CSC_LINK_PATH && useP12) {
    next.CSC_LINK = next.CSC_LINK_PATH;
  }
  if (!next.CSC_KEY_PASSWORD && next.MAC_CERTS_PASSWORD) {
    next.CSC_KEY_PASSWORD = next.MAC_CERTS_PASSWORD;
  }
  if (!next.CSC_LINK && next.MAC_CERTS) {
    next.CSC_LINK = next.MAC_CERTS;
  }

  if (!next.APPLE_API_KEY && next.APPLE_API_KEY_P8_PATH) {
    const src = next.APPLE_API_KEY_P8_PATH;
    if (!existsSync(src)) {
      throw new Error(`APPLE_API_KEY_P8_PATH not found: ${src}`);
    }
    const dest = path.join(os.tmpdir(), `AuthKey_${next.APPLE_API_KEY_ID || 'smartx'}.p8`);
    copyFileSync(src, dest);
    chmodSync(dest, 0o600);
    next.APPLE_API_KEY = dest;
  }

  return next;
}

export function listCodesigningIdentities() {
  const result = spawnSync('security', ['find-identity', '-v', '-p', 'codesigning'], {
    encoding: 'utf8',
  });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

export function hasDeveloperIdIdentity(identityText = listCodesigningIdentities()) {
  return /Developer ID Application:/.test(identityText);
}

export function preflightMacSigning(env = process.env) {
  console.log('=== macOS signing preflight ===');
  const identities = listCodesigningIdentities();
  process.stdout.write(identities);
  const hasIdentity = hasDeveloperIdIdentity(identities);
  if (hasIdentity) {
    console.log('Keychain Developer ID Application: available');
  } else if (env.CSC_LINK) {
    console.log('Keychain has no Developer ID; will import CSC_LINK (.p12)');
  } else {
    throw new Error('No Developer ID Application identity in Keychain and CSC_LINK is unset');
  }

  const required = ['APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing notarization env: ${missing.join(', ')}`);
  }

  console.log(`APPLE_API_KEY_ID: ${env.APPLE_API_KEY_ID}`);
  console.log(`APPLE_API_ISSUER: ${env.APPLE_API_ISSUER}`);
  console.log('=== notarytool auth ===');
  const notary = spawnSync('xcrun', [
    'notarytool',
    'history',
    '--key',
    env.APPLE_API_KEY,
    '--key-id',
    env.APPLE_API_KEY_ID,
    '--issuer',
    env.APPLE_API_ISSUER,
  ], { stdio: 'inherit' });
  if (notary.status !== 0) {
    throw new Error('notarytool auth failed — check APPLE_API_KEY_P8 / KEY_ID / ISSUER');
  }
}

export function verifyMacApp(appPath) {
  if (!appPath || !existsSync(appPath)) {
    throw new Error(`No .app found to verify: ${appPath || '(empty path)'}`);
  }

  console.log(`Verifying: ${appPath}`);
  const verify = spawnSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
    stdio: 'inherit',
  });
  if (verify.status !== 0) {
    throw new Error('codesign --verify failed');
  }

  const details = spawnSync('codesign', ['-dv', '--verbose=4', appPath], { encoding: 'utf8' });
  const text = `${details.stdout || ''}${details.stderr || ''}`;
  process.stderr.write(details.stderr || '');
  process.stdout.write(details.stdout || '');
  if (!/Authority=Developer ID Application/.test(text)) {
    throw new Error('App is not signed with Developer ID Application');
  }
  console.log('Signature OK: Developer ID Application');
  return text;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const env = applyMacSigningEnv(process.env);
  Object.assign(process.env, env);
  const command = process.argv[2];
  if (command === 'verify') {
    verifyMacApp(process.argv[3]);
  } else {
    preflightMacSigning(process.env);
  }
}
