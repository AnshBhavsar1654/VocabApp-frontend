import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, MousePointerClick, RotateCcw, Volume2, XCircle } from "lucide-react";

// Self-contained demo: 3 sample cards, no backend, no audio fetch.
// Mirrors the real Quiz.jsx flip + typed-answer interaction.
const CARDS = [
  { de: "der Bahnhof", en: "station" },
  { de: "die Gemütlichkeit", en: "coziness" },
  { de: "der Schatz", en: "treasure" },
];

function norm(s) {
  return (s || "").trim().toLowerCase();
}

export default function LandingQuizDemo() {
  const shouldReduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState(null); // "ok" | "no"
  const [done, setDone] = useState(0);

  const card = CARDS[index];
  const progress = Math.round(((index + (verdict ? 1 : 0)) / CARDS.length) * 100);

  const flip = () => {
    if (verdict) return;
    setFlipped((v) => !v);
  };

  const check = (e) => {
    e?.preventDefault?.();
    if (!answer.trim() || verdict) return;
    const ok = norm(answer) === norm(card.en);
    setVerdict(ok ? "ok" : "no");
    setFlipped(true);
  };

  const next = () => {
    if (verdict === "ok") setDone((d) => d + 1);
    if (index + 1 >= CARDS.length) {
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
    setFlipped(false);
    setAnswer("");
    setVerdict(null);
  };

  const reset = () => {
    setIndex(0);
    setFlipped(false);
    setAnswer("");
    setVerdict(null);
    setDone(0);
  };

  return (
    <div className="landing-demo" aria-label="Interactive flashcard demo">
      <div className="landing-demo-head">
        <span className="landing-demo-title">
          <MousePointerClick size={16} style={{ color: "var(--color-accent-strong)" }} />
          Try a flashcard
        </span>
        <span className="landing-demo-live">
          <span className="dot" /> LIVE DEMO
        </span>
      </div>

      <div className="quiz-progress-slim" aria-label={`Demo card ${index + 1} of ${CARDS.length}`}>
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div
        className="landing-flip"
        onClick={flip}
        role="button"
        tabIndex={0}
        aria-label="Flip demo card"
        onKeyDown={(e) => {
          if (e.code === "Space") { e.preventDefault(); flip(); }
        }}
      >
        <motion.div
          className="landing-flip-inner"
          animate={shouldReduce ? {} : { rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing-flip-face landing-flip-front">
            <div style={{ textAlign: "center" }}>
              <p className="landing-flip-prompt">Translate to English</p>
              <p className="landing-flip-word">{card.de}</p>
              <p className="landing-flip-hint">{flipped ? "" : "Tap the card to reveal"}</p>
            </div>
          </div>
          <div className="landing-flip-face landing-flip-back">
            <div style={{ textAlign: "center" }}>
              <p className="landing-flip-prompt">Answer</p>
              <p className="landing-flip-word" style={{ color: "var(--color-primary-strong)" }}>{card.en}</p>
              <p className="landing-flip-hint">English translation</p>
            </div>
          </div>
        </motion.div>
      </div>

      {!verdict ? (
        <form onSubmit={check}>
          <div className="landing-demo-row">
            <input
              className="landing-demo-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type the English word…"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Type the English translation"
            />
            <button type="submit" className="landing-demo-check" disabled={!answer.trim()}>
              <ArrowRight size={16} /> Check
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className={`landing-demo-verdict ${verdict}`}>
            {verdict === "ok" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <CheckCircle2 size={16} /> Richtig — nicely recalled.
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <XCircle size={16} /> Not quite — the answer is “{card.en}”.
              </span>
            )}
          </p>
          <div className="landing-demo-row">
            <button type="button" className="landing-demo-check" onClick={next}>
              Next card <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="landing-btn landing-btn-ghost"
              onClick={reset}
              style={{ fontSize: "0.8rem", padding: "0.6rem 0.9rem" }}
            >
              <RotateCcw size={14} /> Restart
            </button>
          </div>
        </div>
      )}

      <div className="landing-demo-foot">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <Volume2 size={14} /> Audio included in the app
        </span>
        <span>
          <kbd>Space</kbd> flip · <kbd>Enter</kbd> check · {done} correct here
        </span>
      </div>
    </div>
  );
}
