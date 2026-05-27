import { motion } from 'framer-motion';
import { Apple, Hexagon, Loader2, Monitor, Smartphone, Terminal } from 'lucide-react';
import { useDownloads } from '../../hooks/useDownloads';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { isVariantRecommendedForPlatform } from '../../lib/platform-detect';
import { usePlatformRecommendation } from '../../hooks/usePlatformRecommendation';
import { fadeUp, staggerContainer, defaultTransition } from '../../lib/motion';
import type { PlatformIcon } from '../../types/downloads';
import { ComingSoonPlatformCard } from '../ui/ComingSoonPlatformCard';
import { DownloadCard } from '../ui/DownloadCard';
import { SectionHeading } from '../ui/SectionHeading';

const platformIcons: Record<PlatformIcon, typeof Apple> = {
  apple: Apple,
  windows: Monitor,
  linux: Terminal,
};

const comingSoonPlatforms = [
  { id: 'ios', label: 'iOS', Icon: Apple, accent: 'ios' as const },
  { id: 'android', label: 'Android', Icon: Smartphone, accent: 'android' as const },
  { id: 'harmony', label: '鸿蒙', Icon: Hexagon, accent: 'harmony' as const },
] as const;

export function DownloadSection() {
  const { data, loading, error } = useDownloads();
  const reduced = useReducedMotion();
  const { ctx, detectionLabel } = usePlatformRecommendation();

  return (
    <section id="download" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="软件下载"
          title="选择您的系统"
          description="请选择与您操作系统和处理器架构匹配的安装包。如有疑问，可联系技术支持获取帮助。"
        />

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            暂时无法获取下载信息，请稍后刷新页面重试。
          </div>
        ) : null}

        {loading ? (
          <div className="mt-12 flex justify-center py-16 text-ink-muted" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" aria-hidden />
            <span className="sr-only">加载下载信息</span>
          </div>
        ) : null}

        {data ? (
          <motion.div
            className="mt-14 space-y-16"
            initial={reduced ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {detectionLabel ? (
              <motion.p
                variants={fadeUp}
                transition={defaultTransition}
                className="text-center text-sm text-ink-muted"
                role="status"
              >
                {detectionLabel}
              </motion.p>
            ) : null}

            {data.platforms.map((platform) => {
              const Icon = platformIcons[platform.icon];
              return (
                <motion.div key={platform.id} variants={fadeUp} transition={defaultTransition}>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft">
                      <Icon className="h-5 w-5 text-brand-blue" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink">{platform.label}</h3>
                      <p className="text-sm text-ink-faint">v{data.version} · 更新于 {data.updatedAt}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {platform.variants.map((variant) => (
                      <DownloadCard
                        key={variant.id}
                        platformLabel={platform.label}
                        variant={variant}
                        version={data.version}
                        highlighted={isVariantRecommendedForPlatform(
                          platform.id,
                          variant,
                          ctx,
                          platform.variants,
                        )}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}

            <motion.div variants={fadeUp} transition={defaultTransition}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft">
                  <Smartphone className="h-5 w-5 text-brand-blue" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">移动端</h3>
                  <p className="text-sm text-ink-faint">iOS · Android · 鸿蒙 · 开发中</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comingSoonPlatforms.map(({ id, label, Icon, accent }) => (
                  <ComingSoonPlatformCard key={id} label={label} Icon={Icon} accent={accent} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
