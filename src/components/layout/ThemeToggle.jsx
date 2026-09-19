import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.92, rotate: theme === "light" ? 15 : -15 }}
      transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
      className="inline-flex items-center justify-center w-11 h-11 rounded-(--radius-md) bg-(--color-surface) border border-(--color-border) text-(--color-text-muted) shrink-0 cursor-pointer transition-[background-color,border-color,color] duration-150 hover:bg-(--color-surface-hover) hover:text-(--color-text)"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center justify-center"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
