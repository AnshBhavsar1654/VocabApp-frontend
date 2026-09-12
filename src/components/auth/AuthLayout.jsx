import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Volume2 } from "lucide-react";
import ThemeToggle from "../layout/ThemeToggle";
import "../../auth.css";

export default function AuthLayout({
  title,
  accentWord,
  beforeAccent,
  afterAccent,
  description,
  points,
  children,
}) {
  const shouldReduce = useReducedMotion();
  return (
    <div className="auth-shell">
      <aside className="auth-brand" aria-label="About WortSchatz">
        <div className="auth-brand-top">
          <div>
            <Link to="/" className="auth-wordmark">
              Wort<span>Schatz</span>
            </Link>
            <p className="auth-brand-tag">Your German flashcards — one word at a time.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="auth-brand-body">
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <h1>
              {beforeAccent} <span className="accent">{accentWord}</span> {afterAccent}
            </h1>
            <p>{description}</p>
            <ul className="auth-points">
              {points.map(({ icon: Icon, title: t, sub }) => (
                <li key={t}>
                  <span className="auth-point-icon">
                    <Icon size={16} />
                  </span>
                  <span>
                    {t}
                    <small>{sub}</small>
                  </span>
                </li>
              ))}
            </ul>
            <div className="auth-ticket" aria-hidden="true">
              <span>station</span>
              <span className="sep">↔</span>
              <span className="de">der Bahnhof</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent-strong)",
                  border: "1px solid var(--color-accent)",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                <Volume2 size={12} /> audio included
              </span>
            </div>
          </motion.div>
        </div>
      </aside>

      <main className="auth-form-side">
        <motion.div
          className="auth-card"
          initial={shouldReduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="auth-back">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h2>{title}</h2>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
