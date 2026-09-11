import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AddWordForm from "./components/AddWordForm";
import WordList from "./components/WordList";
import Quiz from "./components/Quiz";
import Groups from "./components/Groups";
import {
  Layers,
  Sun,
  Moon,
  Flame,
  BookOpen,
  Plus,
  Sparkles,
  Target,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { api } from "./api";

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("vocabapp-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vocabapp-theme", theme);
  }, [theme]);
  return (
    <button
      className="inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] shrink-0 cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

const NAV_ITEMS = [
  { id: "add", label: "Add Word", icon: Plus },
  { id: "list", label: "My Words", icon: BookOpen },
  { id: "groups", label: "Groups", icon: Layers },
  { id: "quiz", label: "Quiz", icon: Sparkles },
];

function Navbar({ activeTab, setActiveTab }) {
  return (
    <header
      className="sticky top-0 z-20 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-[var(--shadow-card)]"
      role="banner"
    >
      <div className="max-w-[860px] mx-auto px-5 py-3 flex items-center gap-4 max-[768px]:px-4 max-[768px]:py-2.5">
        <div className="shrink-0 min-w-0">
          <h1 className="font-[var(--font-display)] text-[1.5rem] font-extrabold tracking-[-0.02em] text-[var(--color-text)] leading-none max-[768px]:text-[1.3rem]">
            Wort<span className="text-[var(--color-primary)]">Schatz</span>
          </h1>
          <p className="text-[0.72rem] text-[var(--color-text-muted)] mt-[0.15rem] whitespace-nowrap max-[768px]:hidden">
            ä ö ü ß ready — one word at a time.
          </p>
        </div>

        <nav className="flex gap-[0.35rem] flex-1 justify-center max-[768px]:hidden" aria-label="Primary">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-1.5 px-3.5 py-[0.55rem] rounded-full border font-[var(--font-display)] font-bold text-[0.84rem] cursor-pointer whitespace-nowrap transition-all duration-180",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] border-[var(--color-primary-strong)] shadow-[0_1px_6px_rgba(21,148,106,0.25)]"
                    : "bg-transparent text-[var(--color-text-muted)] border-transparent hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]",
                ].join(" ")}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function BottomTabs({ activeTab, setActiveTab }) {
  return (
    <nav
      className="hidden max-[768px]:flex fixed inset-x-0 bottom-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[var(--shadow-sticky)] pt-[0.35rem] pb-[max(0.35rem,env(safe-area-inset-bottom))] px-1 gap-[0.15rem]"
      aria-label="Primary"
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex-1 flex flex-col items-center gap-[0.15rem] px-1 py-[0.45rem] rounded-[var(--radius-md)] border-t-[3px] font-[var(--font-display)] font-bold text-[0.66rem] cursor-pointer transition-colors",
              isActive
                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] border-t-[var(--color-primary)] dark:text-[var(--color-primary)]"
                : "bg-transparent text-[var(--color-text-muted)] border-transparent",
            ].join(" ")}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function StatStrip() {
  const { data: words = [] } = useQuery({
    queryKey: ["words"],
    queryFn: api.getWords,
    staleTime: 60_000,
  });
  const shouldReduce = useReducedMotion();
  const wordCount = words.length;

  const [quizStats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("vocabapp-quiz-stats") ||
          '{"correct":0,"streak":0}',
      );
    } catch {
      return { correct: 0, streak: 0 };
    }
  });
  const [streak, setStreak] = useState(quizStats.streak);
  useEffect(() => {
    const onStorage = () => {
      try {
        const s = JSON.parse(
          localStorage.getItem("vocabapp-quiz-stats") || '{"streak":0}',
        );
        setStreak(s.streak || 0);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    const iv = setInterval(onStorage, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(iv);
    };
  }, []);

  const [progressTarget, setProgressTarget] = useState(() => {
    try {
      const raw = localStorage.getItem("vocabapp-progress-target");
      const n = raw ? parseInt(raw, 10) : 100;
      return Number.isFinite(n) && n > 0 ? n : 100;
    } catch {
      return 100;
    }
  });
  const [editingTarget, setEditingTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState(String(progressTarget));

  useEffect(() => {
    localStorage.setItem("vocabapp-progress-target", String(progressTarget));
    window.dispatchEvent(new Event("vocabapp-progress-target-change"));
  }, [progressTarget]);

  const saveTarget = () => {
    const n = parseInt(draftTarget, 10);
    if (!Number.isFinite(n) || n <= 0 || n > 10000) return;
    setProgressTarget(n);
    setEditingTarget(false);
  };
  const cancelTarget = () => {
    setDraftTarget(String(progressTarget));
    setEditingTarget(false);
  };

  const progress = Math.min(100, Math.round((wordCount / progressTarget) * 100));
  const remaining = Math.max(0, progressTarget - wordCount);
  const targetHint =
    wordCount >= progressTarget ? "Ziel erreicht!" : `${remaining} bis ${progressTarget}`;

  const R = 34;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress / 100);

  return (
    <div className="mb-5">
      <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
        {/* Streak */}
        <article className="relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex items-center gap-[0.9rem] shadow-[var(--shadow-card)] min-h-[96px] max-[640px]:px-[0.85rem]">
          <div className="w-11 h-11 rounded-[var(--radius-md)] grid place-items-center shrink-0 bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] border border-[var(--color-accent)]">
            <Flame size={18} />
          </div>
          <div className="flex flex-col gap-[0.1rem] min-w-0 flex-1">
            <motion.span
              key={streak}
              initial={shouldReduce ? false : { scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              className="font-[var(--font-display)] text-[1.7rem] font-extrabold leading-none text-[var(--color-text)] tracking-[-0.02em]"
            >
              {streak}
            </motion.span>
            <span className="font-[var(--font-display)] font-bold text-[0.78rem] text-[var(--color-text)] uppercase tracking-[0.04em]">Tag Streak</span>
            <span className="text-[0.78rem] text-[var(--color-text-muted)] font-medium">Quiz streak</span>
          </div>
        </article>

        {/* Total Words */}
        <article className="relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex items-center gap-[0.9rem] shadow-[var(--shadow-card)] min-h-[96px] max-[640px]:px-[0.85rem]">
          <div className="w-11 h-11 rounded-[var(--radius-md)] grid place-items-center shrink-0 bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] border border-[var(--color-primary)] dark:text-[var(--color-primary)]">
            <BookOpen size={18} />
          </div>
          <div className="flex flex-col gap-[0.1rem] min-w-0 flex-1">
            <span className="font-[var(--font-display)] text-[1.7rem] font-extrabold leading-none text-[var(--color-text)] tracking-[-0.02em]">{wordCount}</span>
            <span className="font-[var(--font-display)] font-bold text-[0.78rem] text-[var(--color-text)] uppercase tracking-[0.04em]">Wörter</span>
            <span className="text-[0.78rem] text-[var(--color-text-muted)] font-medium">Total words</span>
          </div>
        </article>

        {/* Progress — ring */}
        <article className="relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex items-center gap-[0.9rem] shadow-[var(--shadow-card)] min-h-[96px] max-[640px]:px-[0.85rem]">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="block" viewBox="0 0 80 80" aria-hidden="true" width={80} height={80}>
              <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" className="stroke-[var(--color-surface-raised)]" />
              <motion.circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                initial={false}
                animate={{ strokeDasharray: C, strokeDashoffset: dashOffset }}
                transition={shouldReduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ strokeDasharray: C }}
                className="stroke-[var(--color-primary)]"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-[var(--font-display)] font-extrabold text-[0.9rem] text-[var(--color-primary-strong)] dark:text-[var(--color-primary)]">{progress}%</span>
          </div>
          <div className="flex flex-col gap-[0.1rem] min-w-0 flex-1">
            <span className="font-[var(--font-display)] text-[1.15rem] font-extrabold leading-none text-[var(--color-text)] tracking-[-0.02em]">{wordCount} / {progressTarget}</span>
            <span className="font-[var(--font-display)] font-bold text-[0.78rem] text-[var(--color-text)] uppercase tracking-[0.04em]">Progress</span>
            <span className="text-[0.78rem] text-[var(--color-text-muted)] font-medium">{targetHint}</span>
            {!editingTarget ? (
              <button
                onClick={() => {
                  setDraftTarget(String(progressTarget));
                  setEditingTarget(true);
                }}
                title="Change progress target"
                className="mt-[0.35rem] inline-flex items-center gap-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-1 rounded-full text-[0.72rem] font-bold cursor-pointer w-fit hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              >
                <Pencil size={12} /> Ziel: {progressTarget}
              </button>
            ) : (
              <div className="flex items-center gap-1 mt-[0.35rem]">
                <input
                  className="w-[84px] px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.85rem] font-[var(--font-body)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-soft)]"
                  type="number"
                  min={1}
                  max={10000}
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTarget();
                    if (e.key === "Escape") cancelTarget();
                  }}
                  autoFocus
                />
                <button
                  className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-hover)]"
                  onClick={saveTarget}
                  aria-label="Save target"
                >
                  <Check size={14} />
                </button>
                <button
                  className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-hover)]"
                  onClick={cancelTarget}
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="absolute right-3 top-3 text-[var(--color-text-faint)] opacity-60" aria-hidden="true">
            <Target size={18} />
          </div>
        </article>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("add");
  const isQuiz = activeTab === "quiz";

  if (isQuiz) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[var(--color-bg)]">
        <div className="min-h-screen min-h-[100dvh] bg-[var(--color-bg)] flex items-start justify-center px-4 py-6">
          <div className="w-full max-w-[560px]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-[var(--font-display)] text-[1.15rem] font-extrabold tracking-[-0.02em] text-[var(--color-text)] leading-none">
                Wort<span className="text-[var(--color-primary)]">Schatz</span>
              </span>
              <button
                className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                onClick={() => setActiveTab("add")}
                title="Exit quiz"
                aria-label="Exit quiz"
              >
                <X size={18} />
              </button>
            </div>
            <Quiz onExit={() => setActiveTab("add")} onNeedWords={() => setActiveTab("add")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--color-bg)]">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-[860px] mx-auto px-5 pt-5 pb-10 w-full max-[768px]:pb-[5.5rem]">
        <StatStrip />

        <main className="block">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "add" && <AddWordForm />}
              {activeTab === "list" && <WordList />}
              {activeTab === "groups" && <Groups />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
