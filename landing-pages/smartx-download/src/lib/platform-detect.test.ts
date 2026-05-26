import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectCpuArchSync,
  detectPlatform,
  isVariantRecommendedForPlatform,
} from './platform-detect';

describe('detectPlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('识别 macOS（含 Apple Silicon 的 Intel Mac OS X UA）', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'MacIntel',
    });
    expect(detectPlatform()).toBe('macos');
  });
});

describe('detectCpuArchSync on macOS', () => {
  const macUa =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('不因 UA 中的 Intel Mac OS X 误判为 x64', () => {
    vi.stubGlobal('navigator', {
      userAgent: macUa,
      platform: 'MacIntel',
    });
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => null,
    } as unknown as HTMLCanvasElement);

    const arch = detectCpuArchSync('macos');
    expect(arch).not.toBe('x64');
  });

  it('WebGL 为 Apple M 系列时识别 arm64', () => {
    vi.stubGlobal('navigator', {
      userAgent: macUa,
      platform: 'MacIntel',
    });

    const getParameter = vi.fn((p: number) => {
      if (p === 0x9246) return 'Apple M2';
      return '';
    });
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => ({
        getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 0x9246 }),
        getParameter,
      }),
    } as unknown as HTMLCanvasElement);

    expect(detectCpuArchSync('macos')).toBe('arm64');
  });

  it('WebGL 为 Intel Iris 时识别 x64', () => {
    vi.stubGlobal('navigator', {
      userAgent: macUa,
      platform: 'MacIntel',
    });

    const getParameter = vi.fn(() => 'Intel Iris Plus Graphics 655');
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => ({
        getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 0x9246 }),
        getParameter,
      }),
    } as unknown as HTMLCanvasElement);

    expect(detectCpuArchSync('macos')).toBe('x64');
  });
});

describe('isVariantRecommendedForPlatform', () => {
  const variants = [
    { id: 'macos-arm64-dmg', arch: 'arm64', recommended: true },
    { id: 'macos-x64-dmg', arch: 'x64' },
  ];

  it('macOS + arm64 仅推荐 arm64 且带 recommended 的项', () => {
    expect(
      isVariantRecommendedForPlatform(
        'macos',
        variants[0],
        { platform: 'macos', cpuArch: 'arm64' },
        variants,
      ),
    ).toBe(true);
    expect(
      isVariantRecommendedForPlatform(
        'macos',
        variants[1],
        { platform: 'macos', cpuArch: 'arm64' },
        variants,
      ),
    ).toBe(false);
  });
});
