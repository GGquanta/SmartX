#!/usr/bin/env zx

import 'zx/globals';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const lockPath = join(ROOT, 'build', 'preinstalled-skills', '.preinstalled-lock.json');
const bundleManifestPath = join(ROOT, 'build', 'preinstalled-skills', 'preinstalled-manifest.json');
const localSkillsRoot = join(ROOT, 'openclaw', 'skills');
const localLockPath = join(ROOT, 'openclaw', '.clawhub', 'lock.json');
const bundleScript = join(ROOT, 'scripts', 'bundle-preinstalled-skills.mjs');

function listLocalSkillSlugs() {
  if (!existsSync(localSkillsRoot)) {
    return [];
  }
  return readdirSync(localSkillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(localSkillsRoot, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function readBundledSlugs() {
  if (!existsSync(lockPath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(lockPath, 'utf8'));
    return (parsed.skills || [])
      .map((entry) => entry.slug)
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

function needsRefresh() {
  const localSlugs = listLocalSkillSlugs();
  if (localSlugs.length === 0) {
    return !existsSync(lockPath);
  }

  if (!existsSync(lockPath) || !existsSync(bundleManifestPath)) {
    return true;
  }

  const bundledSlugs = readBundledSlugs();
  const missingLocalSlugs = localSlugs.filter((slug) => !bundledSlugs.includes(slug));
  if (missingLocalSlugs.length > 0) {
    return true;
  }

  if (existsSync(localLockPath)) {
    const localMtime = statSync(localLockPath).mtimeMs;
    const bundleMtime = statSync(lockPath).mtimeMs;
    if (localMtime > bundleMtime) {
      return true;
    }
  }

  return false;
}

if (process.env.SMARTX_SKIP_PREINSTALLED_SKILLS_PREPARE === '1') {
  echo`Skipping preinstalled skills prepare (SMARTX_SKIP_PREINSTALLED_SKILLS_PREPARE=1).`;
  process.exit(0);
}

if (!needsRefresh()) {
  echo`Preinstalled skills bundle is up to date, skipping prepare.`;
  process.exit(0);
}

echo`Preinstalled skills bundle is missing or stale, preparing for dev startup...`;

try {
  await $`zx ${bundleScript}`;
} catch (error) {
  // Dev startup should remain available even if network-based skill fetching fails.
  echo`Warning: failed to prepare preinstalled skills for dev startup: ${error?.message || error}`;
  process.exit(0);
}
