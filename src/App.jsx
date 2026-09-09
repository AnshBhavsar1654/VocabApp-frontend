import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AddWordForm from "./components/AddWordForm";
import WordList from "./components/WordList";
import Quiz from "./components/Quiz";
import Groups from "./components/Groups";
import { Layers, Sun, Moon, Flame, BookOpen } from "lucide-react";
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

function StreakStrip() {
  const { data: words = [] } = useQuery({
    queryKey: ["words"],
    queryFn: api.getWords,
    staleTime: 60_000,
  });
  const shouldReduce = useReducedMotion();
  const wordCount = words.length;
  // Streak from localStorage quiz stats — real state, not fake
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
  // Listen for updates from Quiz
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

  const progress = Math.min(100, Math.round((wordCount / 100) * 100));
  const targetHint =
    wordCount >= 100 ? "Ziel erreicht!" : `${100 - wordCount} bis 100`;

  return (
    <div className="streak-strip">
      <motion.span
        key={streak}
        initial={shouldReduce ? false : { scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
        className="streak-badge"
        title="Quiz streak — consecutive correct answers"
      >
        <Flame size={16} style={{ color: "var(--color-accent-strong)" }} />{" "}
        {streak} Tag Streak
      </motion.span>
      <span className="words-badge">
        <BookOpen size={14} /> {wordCount} Wörter
      </span>
      <div className="progress-track" aria-label={`Progress ${progress}%`}>
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={
            shouldReduce
              ? { duration: 0 }
              : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
      <span
        style={{
          fontSize: "0.78rem",
          color: "var(--color-text-muted)",
          fontWeight: 600,
        }}
      >
        {targetHint}
      </span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("add");

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>
              Wort<span className="peak">Schatz</span>
            </h1>
            <p>
              Your playful German flashcard trainer — one word at a time. ä ö ü
              ß ready.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <StreakStrip />
      </header>

      <nav className="nav-tabs" aria-label="Primary">
        <button
          className={`nav-tab ${activeTab === "add" ? "active" : ""}`}
          onClick={() => setActiveTab("add")}
        >
          Add Word
        </button>
        <button
          className={`nav-tab ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          My Words
        </button>
        <button
          className={`nav-tab ${activeTab === "groups" ? "active" : ""}`}
          onClick={() => setActiveTab("groups")}
        >
          <Layers size={16} /> Groups
        </button>
        <button
          className={`nav-tab ${activeTab === "quiz" ? "active" : ""}`}
          onClick={() => setActiveTab("quiz")}
        >
          Quiz
        </button>
      </nav>

      <main>
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
            {activeTab === "quiz" && <Quiz />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
