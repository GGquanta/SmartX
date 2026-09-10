import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { fadeUp, staggerContainer, defaultTransition } from '../../lib/motion';
import { SectionHeading } from '../ui/SectionHeading';

type ManualTheme = {
  paper0: string;
  paper1: string;
  paper2: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  accent: string;
  accentDeep: string;
  accentGlow: string;
  accentSoft: string;
  wash: string;
  halo: string;
};

const smartxTheme: ManualTheme = {
  paper0: '#e6eaef',
  paper1: '#eef2f6',
  paper2: '#f6f8fb',
  ink: '#121826',
  inkSoft: '#3d4a5c',
  muted: '#6d7b8c',
  line: '#d4dce6',
  accent: '#2a7aa8',
  accentDeep: '#1a5578',
  accentGlow: '#4ec4e8',
  accentSoft: '#d7ecf5',
  wash: 'rgba(42, 122, 168, 0.08)',
  halo: 'rgba(78, 196, 232, 0.22)',
};

const liangkuTheme: ManualTheme = {
  paper0: '#e9eae6',
  paper1: '#f0f1ed',
  paper2: '#f7f7f3',
  ink: '#182124',
  inkSoft: '#465256',
  muted: '#788285',
  line: '#d6dad6',
  accent: '#2b6175',
  accentDeep: '#204b5b',
  accentGlow: '#2b6175',
  accentSoft: '#dce9eb',
  wash: 'rgba(43, 97, 117, 0.07)',
  halo: 'rgba(43, 97, 117, 0.12)',
};

const manuals = [
  {
    href: './manuals/smartx/index.html',
    title: '小光 · 智能助理用户说明书',
    description: '对话、技能、定时任务、知识库与系统设置的操作指南。',
    topics: ['对话', '技能管理', '定时任务', '系统设置'],
    preview: './manuals/smartx/assets/01-首页-dell工位.png',
    previewAlt: '小光主界面：左侧模块与空对话',
    theme: smartxTheme,
  },
  {
    href: './manuals/liangku/index.html',
    title: '量库（企业版）用户说明书',
    description: '文档库、检索中心、知识图谱与智能体问答的完整操作指南。',
    topics: ['文档库', '检索中心', '知识图谱', '智能体'],
    preview: './manuals/liangku/asset/docs.png',
    previewAlt: '量库文档库：目录树与资料浏览',
    theme: liangkuTheme,
  },
] as const;

function themeVars(theme: ManualTheme): CSSProperties {
  return {
    '--paper-0': theme.paper0,
    '--paper-1': theme.paper1,
    '--paper-2': theme.paper2,
    '--ink': theme.ink,
    '--ink-soft': theme.inkSoft,
    '--muted': theme.muted,
    '--line': theme.line,
    '--accent': theme.accent,
    '--accent-deep': theme.accentDeep,
    '--accent-glow': theme.accentGlow,
    '--accent-soft': theme.accentSoft,
    '--wash': theme.wash,
    '--halo': theme.halo,
  } as CSSProperties;
}

export function Manuals() {
  const reduced = useReducedMotion();

  return (
    <section id="manuals" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="使用手册"
          title="打开说明书，按图操作"
          description="两份独立手册，分别覆盖桌面客户端与企业知识库。"
        />

        <motion.div
          className="mt-14 grid gap-6 overflow-visible lg:grid-cols-2 lg:gap-8"
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          {manuals.map((manual) => (
            <motion.div
              key={manual.href}
              variants={fadeUp}
              transition={defaultTransition}
              className="h-full"
            >
              <a
                href={manual.href}
                target="_blank"
                rel="noopener noreferrer"
                style={themeVars(manual.theme)}
                className={`group relative block h-full rounded-[18px] outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-offset-4 ${
                  reduced ? '' : 'hover:-translate-y-1 focus-visible:-translate-y-1'
                }`}
                aria-label={`打开${manual.title}`}
              >
                <article
                  className="relative h-full overflow-hidden rounded-[18px] border"
                  style={{
                    borderColor: 'var(--line)',
                    background:
                      'radial-gradient(circle at 82% -6rem, var(--halo), transparent 22rem), var(--paper-0)',
                    boxShadow: '0 26px 70px -48px rgba(18, 24, 38, 0.48)',
                    color: 'var(--ink-soft)',
                  }}
                >
                <span
                  className="pointer-events-none absolute -top-44 left-1/2 h-96 w-[38rem] -translate-x-1/2 rounded-full border"
                  style={{ borderColor: 'color-mix(in srgb, var(--accent-glow) 22%, transparent)' }}
                  aria-hidden
                />

                <header
                  className="relative z-10 px-6 py-5 text-center sm:px-8"
                  style={{
                    background: 'color-mix(in srgb, var(--paper-2) 88%, transparent)',
                  }}
                >
                  <h3
                    className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-[1.35rem]"
                    style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
                  >
                    {manual.title}
                  </h3>
                </header>

                <div
                  className="relative z-10 m-3 rounded-[14px] border p-4 sm:m-4 sm:p-5"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--line) 90%, transparent)',
                    background:
                      'linear-gradient(90deg, transparent 22px, color-mix(in srgb, var(--accent) 6%, transparent) 22px, transparent 23px), var(--paper-2)',
                  }}
                >
                  <div
                    className="overflow-hidden rounded-[12px] border"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <img
                      src={manual.preview}
                      alt={manual.previewAlt}
                      className="aspect-[16/9] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  <p className="mt-4 whitespace-nowrap text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                    {manual.description}
                  </p>

                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {manual.topics.map((topic) => (
                      <li
                        key={topic}
                        className="rounded-md px-2 py-1 text-[12px] leading-none"
                        style={{
                          color: 'var(--accent-deep)',
                          background: 'var(--wash)',
                        }}
                      >
                        {topic}
                      </li>
                    ))}
                  </ul>

                  <p
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: 'var(--accent-deep)' }}
                  >
                    阅读说明书
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </p>
                </div>
                </article>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
