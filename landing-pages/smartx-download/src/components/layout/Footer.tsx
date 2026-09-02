export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white/50 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <div className="flex items-center gap-2">
          <img src="./images/logo.png" alt="" className="h-8 w-8 rounded-lg opacity-90" width={32} height={32} />
          <p className="text-sm text-ink-muted">
            © {year} 小光 · 智能助理。基于 OpenClaw 构建。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <a
            href="https://github.com/GGquanta/SmartX"
            className="text-ink-muted transition-colors hover:text-brand-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="text-ink-faint">MIT License</span>
        </div>
      </div>
    </footer>
  );
}
