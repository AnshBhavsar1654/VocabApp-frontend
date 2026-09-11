import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, BookOpen, Pencil, Check, X, Target } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function StatStrip() {
  const { user } = useAuth();
  const { data: words = [] } = useQuery({
    queryKey: ["words", user?.id],
    queryFn: api.getWords,
    staleTime: 60_000,
    enabled: !!user,
  });
  const shouldReduce = useReducedMotion();
  const wordCount = words.length;

  const [quizStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vocabapp-quiz-stats") || '{"correct":0,"streak":0}');
    } catch {
      return { correct: 0, streak: 0 };
    }
  });
  const [streak, setStreak] = useState(quizStats.streak);
  useEffect(() => {
    const onStorage = () => {
      try {
        const s = JSON.parse(localStorage.getItem("vocabapp-quiz-stats") || '{"streak":0}');
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
  const targetHint = wordCount >= progressTarget ? "Ziel erreicht!" : `${remaining} bis ${progressTarget}`;

  const R = 34;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress / 100);

  return (
    <div className="mb-5">
      <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
        {/* Streak */}
        <article className="relative overflow-hidden bg-(--color-surface) border border-(--color-border) rounded-lg p-4 flex items-center gap-[0.9rem] shadow-(--shadow-card) min-h-24 max-[640px]:px-[0.85rem]">
          <div className="w-11 h-11 rounded-(--radius-md) grid place-items-center shrink-0 bg-(--color-accent-soft) text-(--color-accent-strong) border border-(--color-accent)">
            <Flame size={18} />
          </div>
          <div className="flex flex-col gap-[0.1rem] min-w-0 flex-1">
            <motion.span
              key={streak}
              initial={shouldReduce ? false : { scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              className="font-(--font-display) text-[1.7rem] font-extrabold leading-none text-(--color-text) tracking-[-0.02em]"
            >
              {streak}
            </motion.span>
            <span className="font-(--font-display) font-bold text-[0.78rem] text-(--color-text) uppercase tracking-[0.04em]">
              Tag Streak
            </span>
            <span className="text-[0.78rem] text-(--color-text-muted) font-medium">Quiz streak</span>
          </div>
        </article>

        {/* Total Words */}
        <article className="relative overflow-hidden bg-(--color-surface) border border-(--color-border) rounded-lg p-4 flex items-center gap-[0.9rem] shadow-(--shadow-card) min-h-24 max-[640px]:px-[0.85rem]">
          <div className="w-11 h-11 rounded-(--radius-md) grid place-items-center shrink-0 bg-(--color-primary-soft) text-(--color-primary-strong) border border-(--color-primary) dark:text-(--color-primary)">
            <BookOpen size={18} />
          </div>
          <div className="flex flex-col gap-[0.1rem] min-w-0 flex-1">
            <span className="font-(--font-display) text-[1.7rem] font-extrabold leading-none text-(--color-text) tracking-[-0.02em]">
              {wordCount}
            </span>
            <span className="font-(--font-display) font-bold text-[0.78rem] text-(--color-text) uppercase tracking-[0.04em]">
              Wörter
            </span>
            <span className="text-[0.78rem] text-(--color-text-muted) font-medium">Total words</span>
          </div>
        </article>

        {/* Progress — ring */}
        <article className="relative overflow-hidden bg-(--color-surface) border border-(--color-border) rounded-lg p-4 flex items-center gap-[0.9rem] shadow-(--shadow-card) min-h-24 max-[640px]:px-[0.85rem]">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="block" viewBox="0 0 80 80" aria-hidden="true" width={80} height={80}>
              <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" className="stroke-(--color-surface-raised)" />
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
                className="stroke-(--color-primary)"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-(--font-display) font-extrabold text-[0.9rem] text-(--color-primary-strong) dark:text-(--color-primary)">
              {progress}%
            </span>
          </div>
          <div className="flex flex-col gap-[0.1rem] min-w-0 flex-1">
            <span className="font-(--font-display) text-[1.15rem] font-extrabold leading-none text-(--color-text) tracking-[-0.02em]">
              {wordCount} / {progressTarget}
            </span>
            <span className="font-(--font-display) font-bold text-[0.78rem] text-(--color-text) uppercase tracking-[0.04em]">
              Progress
            </span>
            <span className="text-[0.78rem] text-(--color-text-muted) font-medium">{targetHint}</span>
            {!editingTarget ? (
              <button
                onClick={() => {
                  setDraftTarget(String(progressTarget));
                  setEditingTarget(true);
                }}
                title="Change progress target"
                className="mt-[0.35rem] inline-flex items-center gap-1 bg-(--color-surface-raised) border border-(--color-border) text-(--color-text-muted) px-2 py-1 rounded-full text-[0.72rem] font-bold cursor-pointer w-fit hover:bg-(--color-surface-hover) hover:text-(--color-text)"
              >
                <Pencil size={12} /> Ziel: {progressTarget}
              </button>
            ) : (
              <div className="flex items-center gap-1 mt-[0.35rem]">
                <input
                  className="w-21 px-2 py-1 border border-(--color-border) rounded-sm bg-(--color-surface) text-(--color-text) text-[0.85rem] font-(--font-body) focus:outline-none focus:border-(--color-primary) focus:shadow-[0_0_0_3px_var(--color-primary-soft)]"
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
                  className="inline-flex items-center justify-center w-7.5 h-7.5 rounded-sm bg-(--color-surface-raised) border border-(--color-border) text-(--color-text-muted) cursor-pointer hover:bg-(--color-surface-hover)"
                  onClick={saveTarget}
                  aria-label="Save target"
                >
                  <Check size={14} />
                </button>
                <button
                  className="inline-flex items-center justify-center w-7.5 h-7.5 rounded-sm bg-(--color-surface-raised) border border-(--color-border) text-(--color-text-muted) cursor-pointer hover:bg-(--color-surface-hover)"
                  onClick={cancelTarget}
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="absolute right-3 top-3 text-(--color-text-faint) opacity-60" aria-hidden="true">
            <Target size={18} />
          </div>
        </article>
      </div>
    </div>
  );
}
