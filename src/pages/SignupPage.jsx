import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../lib/errors";
import { UserPlus, Mail, Lock, Loader2, Globe } from "lucide-react";

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) { setError("Your password must be at least 6 characters long."); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setSuccess("Account created. Check your email to confirm, then sign in.");
      setTimeout(()=>navigate("/login"), 1500);
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
    <div className="min-h-dvh bg-(--color-bg) grid place-items-center px-4 py-8">
      <div className="card w-full max-w-md">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><UserPlus size={18} /> Create account</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.3rem", marginBottom: "1.25rem" }}>
          Your words, your groups, your progress — private per account.
        </p>
        {error && <div className="status-msg error">{error}</div>}
        {success && <div className="status-msg success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-email">Email</label>
            <div style={{ position: "relative" }}>
              <input id="signup-email" type="email" className="text-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={{ paddingLeft: "2.2rem" }} />
              <Mail size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)" }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-password">Password</label>
            <div style={{ position: "relative" }}>
              <input id="signup-password" type="password" className="text-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required style={{ paddingLeft: "2.2rem" }} />
              <Lock size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)" }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Sign up
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
          Already have an account? <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
