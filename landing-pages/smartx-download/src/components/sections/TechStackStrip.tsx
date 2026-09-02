import { motion } from 'framer-motion';
import { Cpu, Globe, Lock, Zap } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { fadeUp, staggerContainer, defaultTransition } from '../../lib/motion';

const items = [
  { icon: Cpu, label: 'OpenClaw 内置', detail: '官方核心嵌入，开箱即用' },
  { icon: Globe, label: '跨平台桌面', detail: 'macOS · Windows · Linux' },
  { icon: Lock, label: '密钥链存储', detail: 'AI 供应商凭证安全保存' },
  { icon: Zap, label: 'Gateway 自动管理', detail: '网关生命周期无需手动维护' },
];

export function TechStackStrip() {
  const reduced = useReducedMotion();

  return (
    <section className="border-y border-slate-200/60 bg-white/40 py-14 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {items.map((item) => (
            <motion.div
              key={item.label}
              variants={fadeUp}
              transition={defaultTransition}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <item.icon className="mb-3 h-8 w-8 text-brand-blue" aria-hidden />
              <h3 className="font-display font-semibold text-ink">{item.label}</h3>
              <p className="mt-1 text-sm text-ink-muted">{item.detail}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
