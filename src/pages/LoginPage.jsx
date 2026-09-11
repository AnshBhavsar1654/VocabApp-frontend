import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../lib/errors";
import { LogIn, Mail, Lock, Loader2, Globe } from "lucide-react";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-dvh bg-(--color-bg) grid place-items-center px-4 py-8">
      <div className="card w-full max-w-md">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><LogIn size={18} /> Welcome back</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.3rem", marginBottom: "1.25rem" }}>
          Sign in to your WortSchatz — your words are private to you.
        </p>
        {error && <div className="status-msg error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="login-email">Email</label>
            <div style={{ position: "relative" }}>
              <input id="login-email" type="email" className="text-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={{ paddingLeft: "2.2rem" }} />
              <Mail size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)" }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input id="login-password" type="password" className="text-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingLeft: "2.2rem" }} />
              <Lock size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)" }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} Sign in
          </button>
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        </div>
        <button onClick={handleGoogle} disabled={googleLoading} className="btn-primary-style" style={{ width: "100%", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
          {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />} Continue with Google
        </button>
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          No account? <Link to="/signup" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
