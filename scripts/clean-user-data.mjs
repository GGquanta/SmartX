#!/usr/bin/env node
/**
 * Remove SmartX and OpenClaw user data for a clean reinstall.
 *
 * Usage:
 *   pnpm run clean:user-data              # interactive confirm
 *   pnpm run clean:user-data -- --yes     # skip confirm
 *   pnpm run clean:user-data -- --dry-run # list only
 *   pnpm run clean:user-data -- --keep-openclaw
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import readline from 'node:readline/promises';
import process from 'node:process';

const APP_ID = 'app.smartx.desktop';

/** @typedef {{ label: string; path: string; kind: 'dir' | 'file' }} CleanupTarget */

/**
 * @param {string} platform
 * @param {string} home
 * @param {{ keepOpenclaw: boolean }} options
 * @returns {CleanupTarget[]}
 */
function buildCleanupTargets(platform, home, { keepOpenclaw }) {
  /** @type {CleanupTarget[]} */
  const targets = [];

  if (platform === 'darwin') {
    targets.push(
      { label: 'SmartX application data', path: join(home, 'Library', 'Application Support', 'smartx'), kind: 'dir' },
      { label: 'SmartX cache', path: join(home, 'Library', 'Caches', 'smartx'), kind: 'dir' },
      { label: 'SmartX logs', path: join(home, 'Library', 'Logs', 'smartx'), kind: 'dir' },
      { label: 'SmartX preferences', path: join(home, 'Library', 'Preferences', `${APP_ID}.plist`), kind: 'file' },
      {
        label: 'SmartX saved state',
        path: join(home, 'Library', 'Saved Application State', `${APP_ID}.savedState`),
        kind: 'dir',
      },
      { label: 'OpenClaw CLI symlink', path: join(home, '.local', 'bin', 'openclaw'), kind: 'file' },
      {
        label: 'Legacy Gateway launch agent',
        path: join(home, 'Library', 'LaunchAgents', 'ai.openclaw.gateway.plist'),
        kind: 'file',
      },
    );
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || join(home, 'AppData', 'Local');
    targets.push(
      { label: 'SmartX roaming data', path: join(appData, 'smartx'), kind: 'dir' },
      { label: 'SmartX local data', path: join(localAppData, 'smartx'), kind: 'dir' },
    );
  } else {
    const configHome = process.env.XDG_CONFIG_HOME || join(home, '.config');
    const cacheHome = process.env.XDG_CACHE_HOME || join(home, '.cache');
    targets.push(
      { label: 'SmartX application data', path: join(configHome, 'smartx'), kind: 'dir' },
      { label: 'SmartX cache', path: join(cacheHome, 'smartx'), kind: 'dir' },
      { label: 'OpenClaw CLI symlink', path: join(home, '.local', 'bin', 'openclaw'), kind: 'file' },
    );
  }

  if (!keepOpenclaw) {
    targets.push(
      { label: 'OpenClaw user data', path: join(home, '.openclaw'), kind: 'dir' },
      { label: 'Legacy SmartX config', path: join(home, '.smartx'), kind: 'dir' },
    );
  }

  return targets;
}

function parseArgs(argv) {
  return {
    yes: argv.includes('--yes') || argv.includes('-y'),
    dryRun: argv.includes('--dry-run'),
    keepOpenclaw: argv.includes('--keep-openclaw'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log(`SmartX user-data cleanup

Usage:
  pnpm run clean:user-data [-- options]

Options:
  --yes, -y           Delete without confirmation
  --dry-run           List paths that would be removed
  --keep-openclaw     Remove SmartX data only; keep ~/.openclaw
  --help, -h          Show this help

Note: Quit SmartX before running. The script attempts to stop running processes first.
`);
}

function stopSmartXProcesses(platform) {
  if (platform === 'win32') {
    const result = spawnSync('taskkill', ['/F', '/T', '/IM', 'SmartX.exe'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return result.status === 0;
  }

  const result = spawnSync('pkill', ['-x', 'SmartX'], { stdio: 'ignore' });
  if (result.status === 0) return true;

  const fallback = spawnSync('pkill', ['-f', 'SmartX'], { stdio: 'ignore' });
  return fallback.status === 0;
}

/**
 * @param {CleanupTarget[]} targets
 */
function listExistingTargets(targets) {
  return targets.filter((target) => existsSync(target.path));
}

/**
 * @param {CleanupTarget} target
 */
async function removeTarget(target) {
  await rm(target.path, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
}

async function confirmDeletion(paths) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question('Delete the paths above? [y/N] ');
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const home = homedir();
  const platform = process.platform;
  const targets = buildCleanupTargets(platform, home, { keepOpenclaw: args.keepOpenclaw });
  const existing = listExistingTargets(targets);

  if (existing.length === 0) {
    console.log('No SmartX/OpenClaw user data directories found on this machine.');
    return;
  }

  console.log(args.keepOpenclaw
    ? 'SmartX user-data cleanup (keeping ~/.openclaw):'
    : 'SmartX + OpenClaw user-data cleanup:');
  for (const target of existing) {
    console.log(`  - ${target.label}: ${target.path}`);
  }

  if (args.dryRun) {
    console.log('\nDry run only; nothing was deleted.');
    return;
  }

  if (!args.yes) {
    const confirmed = await confirmDeletion(existing);
    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }
  }

  if (stopSmartXProcesses(platform)) {
    console.log('Stopped running SmartX processes.');
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  let removed = 0;
  let failed = 0;

  for (const target of existing) {
    try {
      await removeTarget(target);
      console.log(`Removed: ${target.path}`);
      removed += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to remove ${target.path}: ${message}`);
    }
  }

  console.log(`\nDone. Removed ${removed} path(s)${failed > 0 ? `, ${failed} failed` : ''}.`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
