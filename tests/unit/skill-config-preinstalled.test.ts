import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  homeDir: '',
  appRoot: '',
  cwd: '',
}));

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return {
    ...actual,
    homedir: () => state.homeDir,
  };
});

vi.mock('@electron/utils/paths', () => ({
  getAppRootPath: () => state.appRoot,
  getOpenClawDir: () => '',
  getOpenClawResolvedDir: () => '',
  getOpenClawSkillsDir: () => join(state.homeDir, '.openclaw', 'skills'),
  getResourcesDir: () => join(state.appRoot, 'resources'),
}));

describe('ensurePreinstalledSkillsInstalled', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    const root = mkdtempSync(join(tmpdir(), 'smartx-preinstalled-skills-'));
    state.homeDir = join(root, 'home');
    state.appRoot = join(root, 'app');
    state.cwd = root;
    mkdirSync(join(state.homeDir, '.openclaw', 'skills'), { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(state.cwd);
  });

  it('deploys bundled skills from openclaw/skills into ~/.openclaw/skills', async () => {
    const sourceRoot = join(state.appRoot, 'openclaw', 'skills');
    mkdirSync(join(sourceRoot, 'writing-polish'), { recursive: true });
    writeFileSync(join(sourceRoot, 'writing-polish', 'SKILL.md'), '---\nname: writing-polish\n---\n');
    writeFileSync(
      join(sourceRoot, 'preinstalled-manifest.json'),
      JSON.stringify({ skills: [{ slug: 'writing-polish', version: '1.0.0' }] }, null, 2),
    );
    writeFileSync(
      join(sourceRoot, '.preinstalled-lock.json'),
      JSON.stringify({ skills: [{ slug: 'writing-polish', version: '1.0.0' }] }, null, 2),
    );

    const { ensurePreinstalledSkillsInstalled } = await import('@electron/utils/skill-config');
    await ensurePreinstalledSkillsInstalled();

    const targetDir = join(state.homeDir, '.openclaw', 'skills', 'writing-polish');
    expect(existsSync(join(targetDir, 'SKILL.md'))).toBe(true);
    expect(existsSync(join(targetDir, '.smartx-preinstalled.json'))).toBe(true);
    const marker = JSON.parse(readFileSync(join(targetDir, '.smartx-preinstalled.json'), 'utf8'));
    expect(marker).toMatchObject({ slug: 'writing-polish', version: '1.0.0' });
  });

  it('upgrades SmartX-managed skills when the bundled version changes', async () => {
    const sourceRoot = join(state.appRoot, 'build', 'preinstalled-skills');
    mkdirSync(join(sourceRoot, 'docx-formatter'), { recursive: true });
    writeFileSync(join(sourceRoot, 'docx-formatter', 'SKILL.md'), '---\nname: docx-formatter\n---\n# v2\n');
    writeFileSync(
      join(sourceRoot, 'preinstalled-manifest.json'),
      JSON.stringify({ skills: [{ slug: 'docx-formatter', version: '1.0.2' }] }, null, 2),
    );
    writeFileSync(
      join(sourceRoot, '.preinstalled-lock.json'),
      JSON.stringify({ skills: [{ slug: 'docx-formatter', version: '1.0.2' }] }, null, 2),
    );

    const targetDir = join(state.homeDir, '.openclaw', 'skills', 'docx-formatter');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'SKILL.md'), '---\nname: docx-formatter\n---\n# v1\n');
    writeFileSync(
      join(targetDir, '.smartx-preinstalled.json'),
      JSON.stringify({ source: 'smartx-preinstalled', slug: 'docx-formatter', version: '1.0.1', installedAt: '2026-01-01T00:00:00.000Z' }, null, 2),
    );

    const { ensurePreinstalledSkillsInstalled } = await import('@electron/utils/skill-config');
    await ensurePreinstalledSkillsInstalled();

    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toContain('# v2');
    const marker = JSON.parse(readFileSync(join(targetDir, '.smartx-preinstalled.json'), 'utf8'));
    expect(marker.version).toBe('1.0.2');
  });

  it('does not overwrite user-managed skills without a SmartX marker', async () => {
    const sourceRoot = join(state.appRoot, 'build', 'preinstalled-skills');
    mkdirSync(join(sourceRoot, 'custom-skill'), { recursive: true });
    writeFileSync(join(sourceRoot, 'custom-skill', 'SKILL.md'), '---\nname: custom-skill\n---\n# bundled\n');
    writeFileSync(
      join(sourceRoot, 'preinstalled-manifest.json'),
      JSON.stringify({ skills: [{ slug: 'custom-skill', version: '9.9.9' }] }, null, 2),
    );
    writeFileSync(
      join(sourceRoot, '.preinstalled-lock.json'),
      JSON.stringify({ skills: [{ slug: 'custom-skill', version: '9.9.9' }] }, null, 2),
    );

    const targetDir = join(state.homeDir, '.openclaw', 'skills', 'custom-skill');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'SKILL.md'), '---\nname: custom-skill\n---\n# user\n');

    const { ensurePreinstalledSkillsInstalled } = await import('@electron/utils/skill-config');
    await ensurePreinstalledSkillsInstalled();

    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toContain('# user');
    expect(existsSync(join(targetDir, '.smartx-preinstalled.json'))).toBe(false);
  });
});
