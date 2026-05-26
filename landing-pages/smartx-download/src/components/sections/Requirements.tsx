import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { fadeUp, defaultTransition } from '../../lib/motion';
import { SectionHeading } from '../ui/SectionHeading';

const requirements = [
  { os: 'macOS', version: '11 或更高版本' },
  { os: 'Windows', version: '10 或更高版本' },
  { os: 'Linux', version: 'Ubuntu 20.04+ 或同等发行版' },
  { os: '内存', version: '最低 4 GB（推荐 8 GB）' },
  { os: '磁盘', version: '约 1 GB 可用空间' },
];

export function Requirements() {
  const reduced = useReducedMotion();

  return (
    <section id="requirements" className="scroll-mt-20 bg-surface-muted/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="系统要求" title="在您开始之前" />

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {requirements.map((req) => (
            <motion.div
              key={req.os}
              variants={fadeUp}
              transition={defaultTransition}
              className="glass-card rounded-2xl p-6"
            >
              <p className="font-display font-semibold text-ink">{req.os}</p>
              <p className="mt-1 text-sm text-ink-muted">{req.version}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={reduced ? false : fadeUp.hidden}
          whileInView={fadeUp.visible}
          viewport={{ once: true }}
          transition={defaultTransition}
        >
          <a
            href="#download"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-blue to-brand-sky px-8 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:scale-[1.02] hover:shadow-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            前往下载
          </a>
        </motion.div>
      </div>
    </section>
  );
}
