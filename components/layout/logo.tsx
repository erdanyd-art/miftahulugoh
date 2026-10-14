export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-xl bg-sidebar-accent font-arab text-xl font-bold text-sidebar-accent-foreground"
      >
        م
      </span>
      <span className="leading-tight">
        <span className="block text-xs text-sidebar-foreground">Lembaga</span>
        <span className="block font-semibold text-white">Miftah al-Lughah</span>
      </span>
    </div>
  );
}
