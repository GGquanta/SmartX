#!/usr/bin/env zx

/**
 * apply-openclaw-workspace-identity.mjs
 *
 * After `bundle-openclaw.mjs`, overwrite OpenClaw's seeded workspace template
 * `docs/reference/templates/IDENTITY.md` inside `build/openclaw/` with the
 * repo's `openclaw/workspace/IDENTITY.md`, so the bundled gateway seeds
 * ClawX's identity instead of upstream OpenClaw defaults.
 */

import 'zx/globals';

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'openclaw', 'workspace', 'IDENTITY.md');
const TARGET = path.join(ROOT, 'build', 'openclaw', 'docs', 'reference', 'templates', 'IDENTITY.md');

echo`🪪 Applying ClawX IDENTITY.md to bundled OpenClaw workspace templates...`;

if (!fs.existsSync(SOURCE)) {
  echo`❌ Source not found: ${SOURCE}`;
  process.exit(1);
}

if (!fs.existsSync(TARGET)) {
  echo`❌ Bundled template missing (run bundle-openclaw first): ${TARGET}`;
  process.exit(1);
}

fs.copyFileSync(SOURCE, TARGET);
echo`   ${SOURCE}`;
echo`   → ${TARGET}`;
echo`✅ Bundled workspace IDENTITY.md replaced.`;
