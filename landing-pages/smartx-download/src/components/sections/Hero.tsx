import { motion } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';
import { fadeUp, defaultTransition } from '../../lib/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Button } from '../ui/Button';

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div className="pointer-events-none absolute inset-0 bg-hero-gradient" aria-hidden />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <motion.div
          initial={reduced ? false : 'hidden'}
          animate="visible"
          variants={fadeUp}
          transition={defaultTransition}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-white/60 px-4 py-1.5 text-sm font-medium text-ink-muted backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-brand-sky" aria-hidden />
            中科国光量子 · 企业级 AI 桌面客户端
          </div>

          <h1 className="flex items-center gap-4 font-display text-4xl font-bold leading-[1.15] tracking-tight text-ink sm:gap-5 sm:text-5xl lg:text-[3.25rem]">
            <img
              src="./images/icon.png"
              alt=""
              className="h-14 w-14 shrink-0 sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem]"
              width={72}
              height={72}
              fetchPriority="high"
            />
            <span>
              <span className="text-gradient-brand">小光</span>
              <span className="text-ink"> · 智能助理</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            基于 OpenClaw 打造，无需命令行即可完成配置。接入量子实验平台、企业知识库与海量
            Skills，让智能化办公触手可及。
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button href="#download" variant="primary">
              立即下载
            </Button>
            <Button href="#features" variant="secondary">
              了解功能
              <ArrowDown className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <p className="mt-8 text-sm text-ink-faint">
            支持 macOS · Windows · Linux · 开箱即用
          </p>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
          initial={reduced ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...defaultTransition, delay: reduced ? 0 : 0.15 }}
        >
          <div className="absolute -inset-4 rounded-4xl bg-gradient-to-br from-brand-sky/20 to-brand-violet/15 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-4xl border border-white/50 shadow-soft">
            <img
              src="./images/mockup-01.jpg"
              alt="小光智能助理在 MacBook 上运行的界面展示"
              className="h-auto w-full object-cover"
              width={1200}
              height={800}
              fetchPriority="high"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface/90 to-transparent"
              aria-hidden
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
