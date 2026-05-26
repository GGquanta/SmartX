import { Download, LayoutGrid, Monitor } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '#features', label: '核心功能', icon: LayoutGrid },
  { href: '#download', label: '软件下载', icon: Download },
  { href: '#requirements', label: '系统要求', icon: Monitor },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/40 bg-white/80 shadow-sm backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
          <img src="./images/logo.png" alt="" className="h-9 w-9 rounded-xl" width={36} height={36} />
          <span className="font-display text-lg font-semibold text-ink whitespace-nowrap">
            小光 · 智能助理
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="主导航">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <item.icon className="h-4 w-4 shrink-0 text-brand-blue/80" aria-hidden />
              {item.label}
            </a>
          ))}
        </nav>

        <Button href="#download" variant="primary" className="!px-5 !py-2.5 text-sm">
          免费下载
        </Button>
      </div>
    </header>
  );
}
