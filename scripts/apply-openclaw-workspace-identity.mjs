#!/usr/bin/env zx

/**
 * apply-openclaw-workspace-identity.mjs
 *
 * After `bundle-openclaw.mjs`, overwrite OpenClaw's seeded workspace templates
 * under `docs/reference/templates/` inside `build/openclaw/` with every file
 * from the repo's `openclaw/workspace/`, so the bundled gateway seeds SmartX
 * defaults instead of upstream OpenClaw templates.
 */

import 'zx/globals';

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'openclaw', 'workspace');
const TARGET_DIR = path.join(ROOT, 'build', 'openclaw', 'docs', 'reference', 'templates');

echo`🪪 Applying SmartX workspace templates to bundled OpenClaw...`;

if (!fs.existsSync(SOURCE_DIR)) {
  echo`❌ Source directory not found: ${SOURCE_DIR}`;
  process.exit(1);
}

if (!fs.existsSync(TARGET_DIR)) {
  echo`❌ Bundled templates missing (run bundle-openclaw first): ${TARGET_DIR}`;
  process.exit(1);
}

const files = fs
  .readdirSync(SOURCE_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name)
  .sort();

if (files.length === 0) {
  echo`❌ No .md workspace template files found in: ${SOURCE_DIR}`;
  process.exit(1);
}

for (const fileName of files) {
  const source = path.join(SOURCE_DIR, fileName);
  const target = path.join(TARGET_DIR, fileName);
  fs.copyFileSync(source, target);
  echo`   ${source}`;
  echo`   → ${target}`;
}

echo`✅ Replaced ${files.length} bundled workspace template file(s).`;
