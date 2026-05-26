import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { fadeUp, defaultTransition } from '../../lib/motion';
import { SectionHeading } from '../ui/SectionHeading';

const highlights = [
  '多 Agent 智能对话与 @agent 路由',
  '技能管理 — 浏览、安装与路径可视化',
  '企业知识库 — 内嵌检索与配置绑定',
  '科研工具 — 量子计算实验平台入口',
  '频道配置、定时任务与模型参数',
];

export function Showcase() {
  const reduced = useReducedMotion();

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="产品界面"
          title="所见即所得的现代体验"
          description="简洁侧栏导航与对话式主界面，让复杂 AI 能力以直观方式呈现。"
          align="left"
        />

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.ul
            className="space-y-4"
            initial={reduced ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {highlights.map((item) => (
              <motion.li
                key={item}
                variants={fadeUp}
                transition={defaultTransition}
                className="flex items-start gap-3 text-ink-muted"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sky/20 text-brand-blue">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-base leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            initial={reduced ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={defaultTransition}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-4xl bg-gradient-to-tr from-brand-sky/15 to-brand-violet/10 blur-xl" aria-hidden />
            <img
              src="./images/screenshot-01.png"
              alt="小光智能助理主界面截图，展示企业知识库对话与侧栏功能"
              className="relative h-auto w-full"
              width={1400}
              height={900}
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
