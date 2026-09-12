import { Link } from "react-router-dom";
import ThemeToggle from "../layout/ThemeToggle";

export default function LandingNav({ isAuthenticated }) {
  return (
    <header className="landing-nav" role="banner">
      <div className="landing-nav-inner">
        <Link to="/" className="landing-wordmark" aria-label="WortSchatz home">
          Wort<span>Schatz</span>
        </Link>
        <nav className="landing-nav-links" aria-label="Landing sections">
          <a href="#how">How it works</a>
          <a href="#quiz">Quiz</a>
          <a href="#groups">Groups</a>
        </nav>
        <div className="landing-nav-cta">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to="/app" className="landing-btn landing-btn-primary">
              Open my words
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-btn landing-btn-ghost">
                Sign in
              </Link>
              <Link to="/signup" className="landing-btn landing-btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
