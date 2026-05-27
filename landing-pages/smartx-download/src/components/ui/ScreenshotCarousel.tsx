import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const SLIDES = [
  {
    src: './images/screenshot-01.png',
    alt: '小光智能助理主界面截图，展示企业知识库对话与侧栏功能',
  },
  {
    src: './images/screenshot-02.png',
    alt: '小光智能助理界面截图',
  },
  {
    src: './images/screenshot-03.png',
    alt: '小光智能助理界面截图',
  },
  {
    src: './images/screenshot-04.png',
    alt: '小光智能助理界面截图',
  },
  {
    src: './images/screenshot-05.png',
    alt: '小光智能助理界面截图',
  },
] as const;

const INTERVAL_MS = 5000;
const FADE_DURATION = 0.85;

export function ScreenshotCarousel() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || SLIDES.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const slide = SLIDES[index];
  const fadeTransition = reduced
    ? { duration: 0 }
    : { duration: FADE_DURATION, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div>
      <div
        className="relative aspect-[14/9] w-full overflow-hidden"
        aria-roledescription="carousel"
        aria-label="产品界面截图轮播"
      >
        <img
          src={SLIDES[0].src}
          alt=""
          className="pointer-events-none invisible h-auto w-full"
          width={1400}
          height={900}
          aria-hidden
        />

        <AnimatePresence initial={false}>
          <motion.img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className="absolute inset-0 h-full w-full object-contain object-center"
            width={1400}
            height={900}
            loading={index === 0 ? 'eager' : 'lazy'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            aria-live="polite"
          />
        </AnimatePresence>
      </div>

      {SLIDES.length > 1 && (
        <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="选择截图">
          {SLIDES.map((item, i) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`第 ${i + 1} 张截图`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-brand-blue' : 'w-1.5 bg-ink/25 hover:bg-ink/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
