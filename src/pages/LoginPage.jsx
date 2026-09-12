import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../lib/errors";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, Volume2, Layers, Flame } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import GoogleIcon from "../components/auth/GoogleIcon";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err, "Couldn't sign you in. Please try again."));
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
      title={<><LogIn size={20} /> Welcome back</>}
      beforeAccent="Pick up"
      accentWord="right where"
      afterAccent="you left off."
      description="Your words, groups, and streaks are waiting — private to your account, ready on any device."
      points={[
        { icon: Volume2, title: "Every word speaks", sub: "Spoken audio on each entry you saved" },
        { icon: Layers, title: "Groups stay organised", sub: "Reisen, Verben, exam chapters — as you left them" },
        { icon: Flame, title: "Streak keeps counting", sub: "One quick quiz extends today's Tag Streak" },
      ]}
    >
      <p className="auth-sub">Sign in to your WortSchatz to keep learning.</p>
      {error && <div className="status-msg error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} noValidate={false}>
        <div className="auth-field">
          <label className="input-label" htmlFor="login-email">Email</label>
          <div className="auth-input-wrap">
            <input
              id="login-email"
              type="email"
              className="text-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-invalid={error ? true : undefined}
            />
            <span className="auth-input-icon"><Mail size={16} /></span>
          </div>
        </div>
        <div className="auth-field">
          <div className="auth-field-row">
            <label className="input-label" htmlFor="login-password" style={{ marginBottom: "0.35rem" }}>Password</label>
          </div>
          <div className="auth-input-wrap">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="text-input has-right"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete="current-password"
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
        </div>
        <button type="submit" className="btn-primary auth-submit" disabled={loading || googleLoading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} Sign in
        </button>
      </form>
      <div className="auth-or"><span>OR</span></div>
      <button onClick={handleGoogle} disabled={googleLoading || loading} className="auth-google">
        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />} Continue with Google
      </button>
      <p className="auth-switch">
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
