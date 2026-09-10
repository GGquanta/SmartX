import { describe, expect, it } from 'vitest';
import { hasWebpFallback, toWebpSrc } from './image';

describe('toWebpSrc', () => {
  it('将 png / jpg 路径换成 webp', () => {
    expect(toWebpSrc('./images/logo.png')).toBe('./images/logo.webp');
    expect(toWebpSrc('./images/mockup-02.jpg')).toBe('./images/mockup-02.webp');
    expect(toWebpSrc('./images/hero.JPEG')).toBe('./images/hero.webp');
  });

  it('保留查询串与 hash', () => {
    expect(toWebpSrc('./images/logo.png?v=2')).toBe('./images/logo.webp?v=2');
    expect(toWebpSrc('./images/logo.png#icon')).toBe('./images/logo.webp#icon');
  });

  it('非光栅图路径保持不变', () => {
    expect(toWebpSrc('./images/logo.svg')).toBe('./images/logo.svg');
    expect(toWebpSrc('./images/hero.webp')).toBe('./images/hero.webp');
  });
});

describe('hasWebpFallback', () => {
  it('仅对 png / jpg 返回 true', () => {
    expect(hasWebpFallback('./images/logo.png')).toBe(true);
    expect(hasWebpFallback('./images/logo.svg')).toBe(false);
  });
});
