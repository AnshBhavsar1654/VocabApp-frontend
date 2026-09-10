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
      className="theme-toggle"
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
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <h1 className="navbar-wordmark">
            Wort<span className="peak">Schatz</span>
          </h1>
          <p className="navbar-subtitle">ä ö ü ß ready — one word at a time.</p>
        </div>

        <nav className="navbar-nav" aria-label="Primary">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="navbar-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function BottomTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-tabs" aria-label="Primary">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`bottom-tab ${activeTab === id ? "active" : ""}`}
          onClick={() => setActiveTab(id)}
          aria-current={activeTab === id ? "page" : undefined}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
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

  // Configurable progress denominator
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

  // Ring geometry
  const R = 34;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress / 100);

  return (
    <div className="stat-strip">
      <div className="stat-grid">
        {/* Streak */}
        <article className="stat-tile">
          <div className="stat-tile-icon accent">
            <Flame size={18} />
          </div>
          <div className="stat-tile-body">
            <motion.span
              key={streak}
              initial={shouldReduce ? false : { scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              className="stat-number"
            >
              {streak}
            </motion.span>
            <span className="stat-label">Tag Streak</span>
            <span className="stat-sub">Quiz streak</span>
          </div>
        </article>

        {/* Total Words */}
        <article className="stat-tile">
          <div className="stat-tile-icon primary">
            <BookOpen size={18} />
          </div>
          <div className="stat-tile-body">
            <span className="stat-number">{wordCount}</span>
            <span className="stat-label">Wörter</span>
            <span className="stat-sub">Total words</span>
          </div>
        </article>

        {/* Progress — ring */}
        <article className="stat-tile stat-tile--progress">
          <div className="stat-ring-wrap">
            <svg
              className="stat-ring"
              viewBox="0 0 80 80"
              aria-hidden="true"
              width={80}
              height={80}
            >
              <circle
                className="stat-ring-track"
                cx="40"
                cy="40"
                r={R}
                fill="none"
                strokeWidth="7"
              />
              <motion.circle
                className="stat-ring-fill"
                cx="40"
                cy="40"
                r={R}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                initial={false}
                animate={{ strokeDasharray: C, strokeDashoffset: dashOffset }}
                transition={
                  shouldReduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                }
                style={{ strokeDasharray: C }}
              />
            </svg>
            <span className="stat-ring-center">{progress}%</span>
          </div>
          <div className="stat-tile-body">
            <span className="stat-number small">{wordCount} / {progressTarget}</span>
            <span className="stat-label">Progress</span>
            <span className="stat-sub">{targetHint}</span>
            {!editingTarget ? (
              <button
                className="stat-edit-btn"
                onClick={() => {
                  setDraftTarget(String(progressTarget));
                  setEditingTarget(true);
                }}
                title="Change progress target"
              >
                <Pencil size={12} /> Ziel: {progressTarget}
              </button>
            ) : (
              <div className="stat-edit-row">
                <input
                  className="stat-edit-input"
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
                <button className="btn-icon small" onClick={saveTarget} aria-label="Save target">
                  <Check size={14} />
                </button>
                <button className="btn-icon small" onClick={cancelTarget} aria-label="Cancel">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="stat-tile-deco" aria-hidden="true">
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
      <div className="app-shell quiz-focus">
        <div className="quiz-stage">
          <div className="quiz-stage-inner">
            <div className="quiz-stage-top">
              <span className="navbar-wordmark small">
                Wort<span className="peak">Schatz</span>
              </span>
              <button
                className="btn-icon"
                onClick={() => setActiveTab("add")}
                title="Exit quiz"
                aria-label="Exit quiz"
              >
                <X size={18} />
              </button>
            </div>
            <Quiz />
            <div className="quiz-stage-actions">
              <button className="bottom-tab quiz-exit" onClick={() => setActiveTab("add")}>
                ← Back to app
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-column">
        <StatStrip />

        <main className="content-area">
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
