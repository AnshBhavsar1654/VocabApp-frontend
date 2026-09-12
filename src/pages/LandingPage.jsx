import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Layers,
  Plus,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LandingNav from "../components/landing/LandingNav";
import LandingQuizDemo from "../components/landing/LandingQuizDemo";
import "../landing.css";

const EASE = [0.22, 1, 0.36, 1];

function Reveal({ children, delay = 0, ...rest }) {
  return (
    <motion.div
      className="landing-reveal"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Fixed-word demo: the word is locked, clicking Add entry saves it with its
// English translation and real listenable audio (browser speech synthesis).
const DEMO_CARD = { de: "die Gemütlichkeit", say: "Gemütlichkeit", en: "coziness" };

function AddMock() {
  const [added, setAdded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [noAudio, setNoAudio] = useState(false);

  React.useEffect(() => {
    return () => { try { window.speechSynthesis?.cancel(); } catch {} };
  }, []);

  const speak = () => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) { setNoAudio(true); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(DEMO_CARD.say);
      u.lang = "de-DE";
      u.rate = 0.85;
      const voices = synth.getVoices();
      const de = voices.find((v) => v.lang?.toLowerCase().startsWith("de"));
      if (de) u.voice = de;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      setNoAudio(false);
      synth.speak(u);
    } catch {
      setNoAudio(true);
      setSpeaking(false);
    }
  };

  return (
    <div className="landing-add-mock">
      <div>
        <div className="landing-add-formrow">
          <div className="grow">
            <label className="landing-mini-label" htmlFor="landing-word">Demo word — locked, just press add</label>
            <input
              id="landing-word"
              className="landing-demo-input"
              value={DEMO_CARD.say}
              disabled
              readOnly
              aria-readonly="true"
              style={{ opacity: 1 }}
            />
          </div>
          <div className="lang">
            <span className="landing-mini-label">Language</span>
            <div className="seg-control" aria-label="Demo word language">
              <span className="seg-btn active" aria-current="true">German</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="landing-demo-check"
          style={{ marginTop: "0.7rem" }}
          onClick={() => setAdded(true)}
          disabled={added}
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
          {added ? "Saved to deck" : "Add entry"}
        </button>
      </div>
      {added && (
        <motion.div
          className="landing-ticket"
          aria-live="polite"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <span>{DEMO_CARD.en}</span>
          <span className="sep">↔</span>
          <span className="de">{DEMO_CARD.de}</span>
          <button
            type="button"
            className="landing-audio-pill"
            onClick={speak}
            disabled={speaking}
            title={noAudio ? "Audio not supported in this browser" : "Listen to the pronunciation"}
            aria-label={`Listen to ${DEMO_CARD.de}`}
          >
            <Volume2 size={12} /> {speaking ? "playing…" : noAudio ? "no audio here" : "listen"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

const SAMPLE_GROUPS = [
  { name: "Numbers", count: 10 },
  { name: "Reisen", count: 14 },
  { name: "Essen & Trinken", count: 9 },
  { name: "Verben", count: 21 },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const shouldReduce = useReducedMotion();
  const appTo = isAuthenticated ? "/app" : "/signup";
  const appLabel = isAuthenticated ? "Open my words" : "Sign up";

  return (
    <div className="landing">
      <LandingNav isAuthenticated={isAuthenticated} />

      {/* Hero — split, fits first viewport */}
      <section className="landing-hero">
        <div className="landing-wrap landing-hero-grid">
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="landing-eyebrow">
              <Sparkles size={12} /> YOUR GERMAN FLASHCARDS
            </span>
            <h1 className="landing-h1">
              Keep every <span className="accent">German word</span> you learn.
            </h1>
            <p className="landing-sub">
              Add words as you meet them, hear every one spoken, and lock them in with flashcard practice.
            </p>
            <div className="landing-hero-ctas">
              <Link to={appTo} className="landing-btn landing-btn-primary landing-btn-lg">
                {appLabel} <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="landing-btn landing-btn-ghost landing-btn-lg">
                Sign in
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
          >
            <LandingQuizDemo />
          </motion.div>
        </div>
        <div className="landing-wrap">
          <div className="landing-ticks" aria-label="Highlights">
            <span className="landing-tick"><Check size={13} /> Your own deck, made by you</span>
            <span className="landing-tick"><Check size={13} /> Auto-generated audio on every card</span>
            <span className="landing-tick"><Check size={13} /> ä ö ü ß ready</span>
            <span className="landing-tick"><Check size={13} /> Custom groups</span>
            <span className="landing-tick"><Check size={13} /> Works on mobile</span>
          </div>
        </div>
      </section>

      {/* Steps — numbered flow, not cards */}
      <section className="landing-wrap" aria-label="How it flows">
        <div className="landing-flow">
          <div className="landing-step">
            <span className="landing-step-num">1</span>
            <div>
              <h3>Add in seconds</h3>
              <p>Type in English or German — translation plus auto-generated audio, saved straight to the card.</p>
            </div>
          </div>
          <span className="landing-step-arrow"><ChevronRight size={18} /></span>
          <div className="landing-step">
            <span className="landing-step-num">2</span>
            <div>
              <h3>Keep it organised</h3>
              <p>File words into groups like Reisen or Verben. Leftovers wait safely in Ungrouped.</p>
            </div>
          </div>
          <span className="landing-step-arrow"><ChevronRight size={18} /></span>
          <div className="landing-step">
            <span className="landing-step-num">3</span>
            <div>
              <h3>Recall under pressure</h3>
              <p>Flip-card practice with typing, streaks, and a progress ring toward your goal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — asymmetric editor + explainer */}
      <section id="how" className="landing-section" style={{ scrollMarginTop: "80px" }}>
        <div className="landing-wrap">
          <Reveal>
            <h2>From “heard it once” to “I know it”.</h2>
            <p className="lede">
              One input does the heavy lifting: translation plus a native-style audio clip,
              so every entry is listenable from the moment you save it.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="landing-add-grid">
              <AddMock />
              <div className="landing-add-side">
                <Volume2 size={22} style={{ color: "var(--color-primary-strong)" }} />
                <strong>Every card speaks itself</strong>
                <p>The moment you save a word, its German pronunciation audio is auto-generated and pinned to the card — tap the speaker on any flashcard to hear it, in the deck or mid-quiz.</p>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
                  <BookOpen size={18} style={{ color: "var(--color-primary-strong)", flexShrink: 0, marginTop: "0.1rem" }} />
                  <p style={{ margin: 0 }}>Phrases count too — anything with a space is kept as a phrase and quizzed as one.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quiz band — full-width tinted */}
      <section id="quiz" className="landing-band" style={{ scrollMarginTop: "64px" }}>
        <div className="landing-wrap landing-band-grid">
          <Reveal>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.015em", fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)", lineHeight: 1.12, margin: "0 0 0.5rem" }}>
                Flip through your deck like real flashcards.
              </h2>
              <p className="lede" style={{ marginBottom: 0 }}>
                Each card flips to reveal, typing scores your recall. Shortcuts keep your hands
                on the keyboard and your streak alive.
              </p>
              <ul className="landing-checklist">
                <li><Check size={15} /> Flip-card sessions of up to 20 words</li>
                <li><Check size={15} /> Typed answers with instant Richtig feedback</li>
                <li><Check size={15} /> Streaks and a progress ring toward your Ziel</li>
              </ul>
              <div className="landing-kbd-row">
                <span><kbd>Space</kbd> flip / listen</span>
                <span><kbd>Enter</kbd> check / next</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="landing-band-card">
              <div className="landing-progress-slim">
                <div className="landing-progress-fill" style={{ width: "65%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.8rem" }}>
                <span>Card 13 of 20</span>
                <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                  <Flame size={12} /> 8 correct
                </span>
              </div>
              <div style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.4rem 1rem", textAlign: "center" }}>
                <p className="landing-flip-prompt">Translate to German</p>
                <p className="landing-flip-word">coziness</p>
                <p className="landing-flip-hint">…then flip for die Gemütlichkeit</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
                <Link to={appTo} className="landing-btn landing-btn-primary" style={{ flex: 1 }}>
                  {isAuthenticated ? "Practice for real" : "Start practicing"} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Groups — horizontal strip reusing product language */}
      <section id="groups" className="landing-section" style={{ scrollMarginTop: "80px" }}>
        <div className="landing-wrap">
          <Reveal>
            <h2>Learning, personalized your way.</h2>
            <p className="lede">
              Your deck, your rules. Build groups around your life — exam chapter, travel list,
              tricky verbs — set your own word goal, and practice at your own pace.
              Anything homeless waits in Ungrouped until you file it.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="groups-strip-wrapper" style={{ padding: 0 }}>
              <div className="groups-strip" aria-label="Sample groups">
                {SAMPLE_GROUPS.map((g) => (
                  <span key={g.name} className="group-pill">
                    <Layers size={14} />
                    <span className="group-pill-name">{g.name}</span>
                    <span className="group-pill-count">{g.count}</span>
                  </span>
                ))}
                <span className="group-pill is-default">
                  <span className="group-pill-name">Ungrouped</span>
                  <span className="group-pill-count">66</span>
                </span>
              </div>
              <p className="landing-note">Sample groups — yours start empty and fill as you add words.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Proof — divider band, not cards */}
      <section className="landing-wrap" aria-label="At a glance">
        <Reveal>
          <div className="landing-proof">
            <div>
              <div className="big">10+</div>
              <div className="cap">Cards unlock practice</div>
              <div className="sub">Add ten entries and your first flip session is ready.</div>
            </div>
            <div>
              <div className="big">20</div>
              <div className="cap">Cards per session, max</div>
              <div className="sub">Short enough to finish on a coffee break.</div>
            </div>
            <div>
              <div className="big">100%</div>
              <div className="cap">Yours and private</div>
              <div className="sub">Words, groups and progress belong to your account.</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Finale + footer */}
      <section className="landing-section">
        <div className="landing-wrap">
          <Reveal>
            <div className="landing-finale">
              <div>
                <h2>Your first ten words take five minutes.</h2>
                <p>Sign up, add a word you heard today, and hear it spoken back. Flashcard practice handles the rest.</p>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  {isAuthenticated ? (
                    <Link to="/app" className="landing-btn landing-btn-primary landing-btn-lg">
                      Open my words <ArrowRight size={17} />
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup" className="landing-btn landing-btn-primary landing-btn-lg">
                        Sign up <ArrowRight size={17} />
                      </Link>
                      <Link to="/login" className="landing-btn landing-btn-ghost landing-btn-lg">
                        Sign in
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="landing-finale-ctas">
                <div className="landing-demo" style={{ width: "100%", boxShadow: "var(--shadow-card)" }}>
                  <div className="landing-demo-head">
                    <span className="landing-demo-title"><Flame size={15} style={{ color: "var(--color-accent-strong)" }} /> Streak starts day one</span>
                  </div>
                  <p style={{ fontSize: "0.87rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.55 }}>
                    Every correct quiz answer extends your Tag Streak. Miss a day and it resets — gentle pressure that works.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
          <footer className="landing-footer">
            <span>WortSchatz — your German flashcards.</span>
            <nav aria-label="Footer">
              <Link to="/login">Sign in</Link>
              <Link to="/signup">Sign up</Link>
              <a href="#how">How it works</a>
              <a href="#quiz">Quiz</a>
              <a href="#groups">Groups</a>
            </nav>
          </footer>
        </div>
      </section>
    </div>
  );
}
