import { NavLink } from "react-router-dom";
import { Layers, BookOpen, Plus, Sparkles } from "lucide-react";
import { PATHS } from "../../routes/paths";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { path: PATHS.HOME, label: "Add Word", icon: Plus },
  { path: PATHS.WORDS, label: "My Words", icon: BookOpen },
  { path: PATHS.GROUPS, label: "Groups", icon: Layers },
  { path: PATHS.QUIZ, label: "Quiz", icon: Sparkles },
];

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-20 bg-(--color-surface) border-b border-(--color-border) shadow-(--shadow-card)"
      role="banner"
    >
      <div className="max-w-215 mx-auto px-5 py-3 flex items-center gap-4 max-[768px]:px-4 max-[768px]:py-2.5">
        <div className="shrink-0 min-w-0">
          <h1 className="font-(--font-display) text-[1.5rem] font-extrabold tracking-[-0.02em] text-(--color-text) leading-none max-[768px]:text-[1.3rem]">
            Wort<span className="text-(--color-primary)">Schatz</span>
          </h1>
          <p className="text-[0.72rem] text-(--color-text-muted) mt-[0.15rem] whitespace-nowrap max-[768px]:hidden">
            ä ö ü ß ready — one word at a time.
          </p>
        </div>

        <nav className="flex gap-[0.35rem] flex-1 justify-center max-[768px]:hidden" aria-label="Primary">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === PATHS.HOME}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-1.5 px-3.5 py-[0.55rem] rounded-full border font-(--font-display) font-bold text-[0.84rem] cursor-pointer whitespace-nowrap transition-all duration-180",
                  isActive
                    ? "bg-(--color-primary) text-(--color-primary-contrast) border-(--color-primary-strong) shadow-[0_1px_6px_rgba(21,148,106,0.25)]"
                    : "bg-transparent text-(--color-text-muted) border-transparent hover:bg-(--color-surface-raised) hover:text-(--color-text)",
                ].join(" ")
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
