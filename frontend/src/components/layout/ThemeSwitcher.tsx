import { useThemeStore } from '../../store/themeStore';
import type { ThemeMode } from '../../store/themeStore';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  const options: { mode: ThemeMode; icon: string; label: string }[] = [
    { mode: 'light', icon: '☀️', label: 'Light' },
    { mode: 'dark', icon: '🌙', label: 'Dark' },
    { mode: 'system', icon: '💻', label: 'System' },
  ];

  return (
    <div className="flex bg-muted/50 border border-border/60 rounded-lg p-0.5 scale-95 origin-left shrink-0">
      {options.map((opt) => (
        <button
          key={opt.mode}
          onClick={() => setTheme(opt.mode)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            theme === opt.mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={`${opt.label} Theme`}
          aria-label={`${opt.label} Theme`}
        >
          <span>{opt.icon}</span>
          <span className="sr-only sm:not-sr-only">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
