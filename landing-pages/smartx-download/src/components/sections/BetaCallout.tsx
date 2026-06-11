import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, defaultTransition } from '../../lib/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const noticeItems = [
  '当前软件处于内测阶段，可能存在 Bug、功能缺陷或体验不完善的情况，请谅解。',
  '内测期间请勿将本网站或软件下载链接分享给其他人员，包括公司内部同事。',
  '如遇 Bug 或异常，请打开软件，进入「设置」页面，点击「功能反馈」提交您的意见。',
  '软件功能尚不完备，请勿用于对安全性或时效性要求较高的工作任务。',
  '感谢您的参与与测试，欢迎反馈功能亮点、改进建议与新需求。',
] as const;

export function BetaCallout() {
  const reduced = useReducedMotion();

  return (
    <section aria-labelledby="beta-notice-heading" className="scroll-mt-20 pb-2 pt-4 sm:pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.aside
          role="note"
          initial={reduced ? false : fadeUp.hidden}
          whileInView={fadeUp.visible}
          viewport={{ once: true, margin: '-40px' }}
          transition={defaultTransition}
          className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/60 px-5 py-5 shadow-sm sm:px-6 sm:py-6"
        >
          <div className="flex gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <h2
                id="beta-notice-heading"
                className="font-display text-base font-semibold text-amber-950 sm:text-lg"
              >
                内测须知
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                小光智能助理目前仅面向受邀内测人员开放，下载与使用前请仔细阅读以下说明。
              </p>

              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-amber-950/90">
                {noticeItems.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
