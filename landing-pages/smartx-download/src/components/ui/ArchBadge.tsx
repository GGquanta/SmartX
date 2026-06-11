type KnownArch = 'arm64' | 'x64';

interface ArchStyle {
  label: string;
  badge: string;
}

const ARCH_STYLES: Record<KnownArch, ArchStyle> = {
  arm64: {
    label: 'ARM64',
    badge: 'from-emerald-500 to-teal-500',
  },
  x64: {
    label: 'x64',
    badge: 'from-brand-blue to-brand-sky',
  },
};

const FALLBACK_STYLE: ArchStyle = {
  label: '',
  badge: 'from-ink-muted to-ink-faint',
};

function resolveArch(arch: string): { style: ArchStyle; label: string } {
  const normalized = arch.toLowerCase();
  if (normalized === 'arm64' || normalized.includes('aarch')) {
    return { style: ARCH_STYLES.arm64, label: ARCH_STYLES.arm64.label };
  }
  if (normalized === 'x64' || normalized.includes('x86') || normalized.includes('amd64')) {
    return { style: ARCH_STYLES.x64, label: ARCH_STYLES.x64.label };
  }
  return { style: FALLBACK_STYLE, label: arch.toUpperCase() };
}

interface ArchBadgeProps {
  arch: string;
}

export function ArchBadge({ arch }: ArchBadgeProps) {
  const { style, label } = resolveArch(arch);

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm ${style.badge}`}
      aria-label={`处理器架构：${label}`}
    >
      {label}
    </span>
  );
}
