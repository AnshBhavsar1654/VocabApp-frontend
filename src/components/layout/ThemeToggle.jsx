import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      className="inline-flex items-center justify-center w-11 h-11 rounded-(--radius-md) bg-(--color-surface) border border-(--color-border) text-(--color-text-muted) shrink-0 cursor-pointer transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text)"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
