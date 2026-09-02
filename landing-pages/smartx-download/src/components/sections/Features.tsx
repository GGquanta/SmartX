import { motion } from 'framer-motion';
import { Atom, BookOpen, Briefcase, Puzzle } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { fadeUp, staggerContainer, defaultTransition } from '../../lib/motion';
import { SectionHeading } from '../ui/SectionHeading';

const features = [
  {
    icon: Atom,
    title: '量子实验平台接入',
    description:
      '内置科研工具入口，一键打开 Quafu 量子计算实验平台。科研探索与日常办公在同一桌面完成，无需切换环境。',
    accent: 'from-brand-sky/20 to-brand-blue/10',
  },
  {
    icon: BookOpen,
    title: '企业知识库访问',
    description:
      '内嵌企业知识库 Web 界面，支持语义检索与一键绑定 OpenClaw 配置。公司文档、项目资料与会议纪要触手可及。',
    accent: 'from-brand-violet/15 to-brand-sky/10',
  },
  {
    icon: Puzzle,
    title: '海量 Skills 支持',
    description:
      '预装 PDF、Office 文档处理与搜索类技能，可视化浏览、安装与管理。扩展 Agent 能力无需命令行或包管理器。',
    accent: 'from-brand-blue/15 to-brand-violet/10',
  },
  {
    icon: Briefcase,
    title: '智能化办公',
    description:
      '多 Agent 对话、频道管理、定时任务与可视化设置。从安装到首次 AI 交互，全程图形界面，零 YAML 配置。',
    accent: 'from-slate-200/80 to-brand-sky/10',
  },
];

export function Features() {
  const reduced = useReducedMotion();

  return (
    <section id="features" className="scroll-mt-20 bg-surface-muted/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="核心能力"
          title="为科研与企业办公而生"
          description="四大能力模块，覆盖从量子实验到知识检索、技能扩展与自动化办公的完整工作流。"
        />

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2"
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              transition={defaultTransition}
              className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white p-8 shadow-soft transition-shadow hover:shadow-glow"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.accent} blur-2xl`}
                aria-hidden
              />
              <div className="relative">
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-sky text-white shadow-soft">
                  <feature.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="font-display text-xl font-semibold text-ink">{feature.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-muted">{feature.description}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
