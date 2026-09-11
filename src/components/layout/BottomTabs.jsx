import { NavLink } from "react-router-dom";
import { Layers, BookOpen, Plus, Sparkles } from "lucide-react";
import { PATHS } from "../../routes/paths";

const NAV_ITEMS = [
  { path: PATHS.HOME, label: "Add Word", icon: Plus },
  { path: PATHS.WORDS, label: "My Words", icon: BookOpen },
  { path: PATHS.GROUPS, label: "Groups", icon: Layers },
  { path: PATHS.QUIZ, label: "Quiz", icon: Sparkles },
];

export default function BottomTabs() {
  return (
    <nav
      className="hidden max-[768px]:flex fixed inset-x-0 bottom-0 z-40 bg-(--color-surface) border-t border-(--color-border) shadow-(--shadow-sticky) pt-[0.35rem] pb-[max(0.35rem,env(safe-area-inset-bottom))] px-1 gap-[0.15rem]"
      aria-label="Primary"
    >
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === PATHS.HOME}
          className={({ isActive }) =>
            [
              "flex-1 flex flex-col items-center gap-[0.15rem] px-1 py-[0.45rem] rounded-(--radius-md) border-t-[3px] font-(--font-display) font-bold text-[0.66rem] cursor-pointer transition-colors",
              isActive
                ? "bg-(--color-primary-soft) text-(--color-primary-strong) border-t-(--color-primary) dark:text-(--color-primary)"
                : "bg-transparent text-(--color-text-muted) border-transparent",
            ].join(" ")
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
