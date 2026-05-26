export type DetectedPlatform = 'macos' | 'windows' | 'linux' | 'unknown';
export type CpuArch = 'arm64' | 'x64' | 'unknown';

export interface PlatformRecommendationContext {
  platform: DetectedPlatform;
  cpuArch: CpuArch;
}

function getNavigator(): Navigator | undefined {
  return typeof navigator !== 'undefined' ? navigator : undefined;
}

export function detectPlatform(): DetectedPlatform {
  const nav = getNavigator();
  if (!nav) return 'unknown';

  const ua = nav.userAgent.toLowerCase();
  const platform = (nav.platform ?? '').toLowerCase();

  if (/mac|iphone|ipad|ipod/.test(ua) || platform.includes('mac')) {
    return 'macos';
  }
  if (/win/.test(ua) || platform.includes('win')) {
    return 'windows';
  }
  if (/linux|android|x11/.test(ua) || platform.includes('linux')) {
    return 'linux';
  }
  return 'unknown';
}

/** WebGL 渲染器字符串，用于在 macOS 上区分 Apple Silicon 与 Intel 显卡 */
export function getWebGLRenderer(): string {
  if (typeof document === 'undefined') return '';

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return '';

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';

    return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch {
    return '';
  }
}

function inferMacArchFromRenderer(renderer: string): CpuArch {
  const r = renderer.toLowerCase();
  if (/apple m\d|apple gpu/.test(r)) return 'arm64';
  if (/intel|amd|radeon|nvidia|iris|uhd|geforce/.test(r)) return 'x64';
  return 'unknown';
}

function inferArchFromUserAgent(ua: string, platform: DetectedPlatform): CpuArch {
  if (platform === 'linux') {
    if (ua.includes('aarch64') || ua.includes('arm64') || ua.includes('armv8')) return 'arm64';
    if (ua.includes('x86_64') || ua.includes('amd64')) return 'x64';
    return 'unknown';
  }

  if (platform === 'windows') {
    if (ua.includes('arm64') || ua.includes('aarch64')) return 'arm64';
    if (ua.includes('win64') || ua.includes('wow64') || ua.includes('x64')) return 'x64';
    if (ua.includes('windows')) return 'x64';
    return 'unknown';
  }

  if (platform === 'macos') {
    // 切勿用 ua.includes('intel')：Apple Silicon 的 UA 仍含 "Intel Mac OS X"
    return inferMacArchFromRenderer(getWebGLRenderer());
  }

  return 'unknown';
}

export function detectCpuArchSync(platform: DetectedPlatform = detectPlatform()): CpuArch {
  const nav = getNavigator();
  if (!nav || platform === 'unknown') return 'unknown';

  const ua = nav.userAgent.toLowerCase();

  const fromUa = inferArchFromUserAgent(ua, platform);
  if (fromUa !== 'unknown') return fromUa;

  // Chromium: platform 字符串有时含架构提示（非 "MacIntel"）
  const navPlatform = (nav.platform ?? '').toLowerCase();
  if (platform === 'macos') {
    if (navPlatform.includes('arm') || navPlatform.includes('aarch')) return 'arm64';
    return inferMacArchFromRenderer(getWebGLRenderer());
  }

  return 'unknown';
}

export async function detectCpuArchAsync(
  platform: DetectedPlatform = detectPlatform(),
): Promise<CpuArch> {
  const sync = detectCpuArchSync(platform);
  if (sync !== 'unknown') return sync;

  const nav = getNavigator();
  if (!nav?.userAgentData?.getHighEntropyValues) return 'unknown';

  try {
    const { architecture } = await nav.userAgentData.getHighEntropyValues(['architecture']);
    if (architecture === 'arm') return 'arm64';
    if (architecture === 'x86') return 'x64';
  } catch {
    // ignore
  }

  if (platform === 'macos') {
    return inferMacArchFromRenderer(getWebGLRenderer());
  }

  return 'unknown';
}

export function getPlatformRecommendationContext(): PlatformRecommendationContext {
  const platform = detectPlatform();
  return { platform, cpuArch: detectCpuArchSync(platform) };
}

/**
 * 是否高亮为「推荐」下载项。
 * @param allVariants 同一 OS 下的全部 variants，用于同架构多格式时优先 recommended 项
 */
export function isVariantRecommendedForPlatform(
  platformId: string,
  variant: { id: string; arch: string; recommended?: boolean },
  ctx: PlatformRecommendationContext,
  allVariants: Array<{ id: string; arch: string; recommended?: boolean }>,
): boolean {
  const { platform: detected, cpuArch } = ctx;

  if (detected === 'unknown') return Boolean(variant.recommended);
  if (platformId !== detected) return false;

  if (cpuArch !== 'unknown') {
    if (variant.arch !== cpuArch) return false;

    const sameArch = allVariants.filter((v) => v.arch === cpuArch);
    const withFlag = sameArch.filter((v) => v.recommended);
    if (withFlag.length > 0) {
      return Boolean(variant.recommended);
    }
    return sameArch[0]?.id === variant.id;
  }

  return Boolean(variant.recommended);
}

export function formatDetectionLabel(ctx: PlatformRecommendationContext): string | null {
  if (ctx.platform === 'unknown') return null;

  const platformLabels: Record<Exclude<DetectedPlatform, 'unknown'>, string> = {
    macos: 'macOS',
    windows: 'Windows',
    linux: 'Linux',
  };

  const archLabels: Record<Exclude<CpuArch, 'unknown'>, string> = {
    arm64: 'Apple Silicon / ARM64',
    x64: 'Intel / x64',
  };

  const os = platformLabels[ctx.platform];
  if (ctx.cpuArch === 'unknown') {
    return `已识别系统：${os}（处理器架构检测中…）`;
  }
  return `已识别系统：${os} · ${archLabels[ctx.cpuArch]}`;
}
