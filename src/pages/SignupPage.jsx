import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../lib/errors";
import { UserPlus, User, Mail, Lock, Loader2, Eye, EyeOff, Sparkles, Volume2, BookOpen } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import GoogleIcon from "../components/auth/GoogleIcon";

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const passwordOk = password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) { setError("Please tell us what we should call you."); return; }
    if (password.length < 6) { setError("Your password must be at least 6 characters long."); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      setSuccess(`Willkommen, ${name.trim()}! Check your email to confirm, then sign in.`);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(friendlyError(err, "Couldn't create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyError(err, "Couldn't start Google sign-in. Please try again."));
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title={<><UserPlus size={20} /> Create account</>}
      beforeAccent="Start your"
      accentWord="German flashcard"
      afterAccent="deck."
      description="Add a word you heard today, hear it spoken back, and let flashcard practice handle the rest."
      points={[
        { icon: Sparkles, title: "Free to start", sub: "Add words in seconds, no setup needed" },
        { icon: Volume2, title: "Audio on everything", sub: "Pronunciation generated for every entry" },
        { icon: BookOpen, title: "Practice unlocks at 10 cards", sub: "Flip-card practice with streaks and goals" },
      ]}
    >
      <div className="mb-4 p-3 rounded-(--radius-md) bg-(--color-primary-soft) border border-(--color-primary) text-(--color-primary-strong) dark:text-(--color-primary) text-[0.86rem] font-semibold flex items-center gap-2.5">
        <Sparkles size={18} className="shrink-0 text-(--color-accent)" />
        <span>Willkommen! What should we call you?</span>
      </div>
      <p className="auth-sub">Your own deck, made by you — private per account.</p>
      {error && <div className="status-msg error" role="alert">{error}</div>}
      {success && <div className="status-msg success" role="status">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="input-label" htmlFor="signup-name">What should we call you?</label>
          <div className="auth-input-wrap">
            <input
              id="signup-name"
              type="text"
              className="text-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ansh Bhavsar"
              required
              autoComplete="name"
              autoFocus
            />
            <span className="auth-input-icon"><User size={16} /></span>
          </div>
          <p className="auth-hint">Your first name and surname for your card deck profile.</p>
        </div>
        <div className="auth-field">
          <label className="input-label" htmlFor="signup-email">Email</label>
          <div className="auth-input-wrap">
            <input
              id="signup-email"
              type="email"
              className="text-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-invalid={error && !success ? true : undefined}
            />
            <span className="auth-input-icon"><Mail size={16} /></span>
          </div>
          <p className="auth-hint">We only use this for sign-in and confirmation.</p>
        </div>
        <div className="auth-field">
          <label className="input-label" htmlFor="signup-password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              className="text-input has-right"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              autoComplete="new-password"
              aria-describedby="signup-password-hint"
            />
            <span className="auth-input-icon"><Lock size={16} /></span>
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p id="signup-password-hint" className={`auth-hint ${password ? (passwordOk ? "ok" : "") : ""}`}>
            {password ? (passwordOk ? "Good length — you're set." : `${6 - password.length} more character${6 - password.length === 1 ? "" : "s"} needed.`) : "At least 6 characters."}
          </p>
        </div>
        <button type="submit" className="btn-primary auth-submit" disabled={loading || googleLoading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Sign up
        </button>
      </form>
      <div className="auth-or"><span>OR</span></div>
      <button onClick={handleGoogle} disabled={googleLoading || loading} className="auth-google">
        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />} Continue with Google
      </button>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
