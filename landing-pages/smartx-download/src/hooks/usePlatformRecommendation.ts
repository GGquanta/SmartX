import { useEffect, useMemo, useState } from 'react';
import type { CpuArch, DetectedPlatform, PlatformRecommendationContext } from '../lib/platform-detect';
import {
  detectCpuArchAsync,
  detectCpuArchSync,
  detectPlatform,
  formatDetectionLabel,
} from '../lib/platform-detect';

export function usePlatformRecommendation() {
  const platform = useMemo(() => detectPlatform(), []);

  const [cpuArch, setCpuArch] = useState<CpuArch>(() => detectCpuArchSync(platform));

  useEffect(() => {
    let cancelled = false;

    void detectCpuArchAsync(platform).then((arch) => {
      if (cancelled) return;
      if (arch !== 'unknown') setCpuArch(arch);
    });

    return () => {
      cancelled = true;
    };
  }, [platform]);

  const ctx: PlatformRecommendationContext = useMemo(
    () => ({ platform, cpuArch }),
    [platform, cpuArch],
  );

  const detectionLabel = useMemo(() => formatDetectionLabel(ctx), [ctx]);

  return {
    ctx,
    detectionLabel,
    platform: platform as DetectedPlatform,
    cpuArch,
  };
}
