import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Shield, Mail, User, Check, X, Loader2, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../lib/errors";

export default function OAuthConsentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signInWithGoogle, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Optional generic OAuth parameters (?client_id, ?scope, ?redirect_uri); defaults target WortSchatz Google sign-in.
  const clientName = searchParams.get("client_name") || "WortSchatz";
  const scope = searchParams.get("scope") || "email profile openid";
  const redirectUri = searchParams.get("redirect_uri") || searchParams.get("redirect_to");
  const scopes = scope.split(/[\s,]+/).filter(Boolean);

  const scopeLabels = {
    email: "View your email address",
    profile: "View your basic profile info (name, avatar)",
    openid: "Authenticate your identity",
  };

  const handleAllow = async () => {
    setError("");
    setLoading(true);
    try {
      if (isAuthenticated && user) {
        // An existing session requires no further authorization; redirect directly.
        if (redirectUri) {
          window.location.href = redirectUri;
        } else {
          navigate("/", { replace: true });
        }
        return;
      }
      // No active session: initiate Supabase Google OAuth, which redirects away
      // from this page (the loading state is retained until navigation occurs).
      await signInWithGoogle();
    } catch (e) {
      setError(friendlyError(e, "Authorization didn't go through. Please try again."));
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      // Return an OAuth-compliant access_denied error to the requesting client.
      const sep = redirectUri.includes("?") ? "&" : "?";
      window.location.href = `${redirectUri}${sep}error=access_denied&error_description=User+denied+access`;
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-dvh bg-(--color-bg) flex flex-col">
      {/* Brand header */}
      <div className="border-b border-(--color-border) bg-(--color-surface) px-4 py-3">
        <div className="max-w-215 mx-auto flex items-center gap-2">
          <Link to="/" className="font-(--font-display) text-[1.15rem] font-extrabold tracking-[-0.02em] text-(--color-text) no-underline">
            Wort<span className="text-(--color-primary)">Schatz</span>
          </Link>
          <span className="text-[0.72rem] text-(--color-text-muted) ml-2 hidden sm:inline">OAuth Authorization</span>
        </div>
      </div>

      <div className="flex-1 grid place-items-center px-4 py-8">
        <div className="card w-full max-w-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-(--radius-md) bg-(--color-primary-soft) border border-(--color-primary) grid place-items-center text-(--color-primary)">
              <Shield size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Authorize {clientName}</h2>
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: 0 }}>
                {clientName} wants to access your WortSchatz account
              </p>
            </div>
          </div>

          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0.75rem 0 1rem" }}>
            You are signing in with Google via Supabase Auth. Review the permissions below and choose to allow or deny.
          </p>

          {isAuthenticated && user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-(--radius-md) bg-(--color-surface-raised) border border-(--color-border) mb-3">
              <span className="w-8 h-8 rounded-full bg-(--color-primary) text-(--color-primary-contrast) grid place-items-center text-[0.7rem] font-extrabold">
                {user.email?.slice(0, 2).toUpperCase()}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>{user.email}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>· signed in</span>
            </div>
          )}

          <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-raised) p-3 mb-3">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
              This app will be able to:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {scopes.map((s) => (
                <li key={s} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", color: "var(--color-text)" }}>
                  {s === "email" ? <Mail size={14} style={{ color: "var(--color-text-muted)" }} /> : s === "profile" ? <User size={14} style={{ color: "var(--color-text-muted)" }} /> : <Globe size={14} style={{ color: "var(--color-text-muted)" }} />}
                  <span>{scopeLabels[s] || s}</span>
                </li>
              ))}
              {/* Default permissions shown when no scope is requested. */}
              {scopes.length === 0 && (
                <>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem" }}><Mail size={14} /> View your email address</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem" }}><User size={14} /> View your profile info</li>
                </>
              )}
            </ul>
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-faint)", marginTop: "0.6rem", marginBottom: 0 }}>
              WortSchatz will not post on your behalf or access your contacts. You can revoke access anytime in your Google Account.
            </p>
          </div>

          {error && <div className="status-msg error">{error}</div>}

          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button onClick={handleDeny} disabled={loading} className="btn-primary-style" style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)", width: "auto" }}>
              <X size={14} /> Deny
            </button>
            <button onClick={handleAllow} disabled={loading} className="btn-primary" style={{ width: "auto", padding: "0.6rem 1.25rem" }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Allow
            </button>
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--color-text-faint)", textAlign: "center", marginTop: "0.9rem" }}>
            By clicking Allow, you authorize WortSchatz to use your Google account per its{" "}
            <Link to="/" style={{ color: "var(--color-primary)" }}>Terms</Link> and Privacy Policy.
          </div>

          {redirectUri && (
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-faint)", textAlign: "center", marginTop: "0.4rem", wordBreak: "break-all" }}>
              Will redirect to: {redirectUri}
            </p>
          )}
        </div>

        {/* Guidance for Google Cloud OAuth domain verification. */}
        <p style={{ fontSize: "0.72rem", color: "var(--color-text-faint)", marginTop: "0.75rem", textAlign: "center", maxWidth: 520 }}>
          This is the OAuth consent screen for <strong>vocab-app-frontend-rosy.vercel.app/oauth/consent</strong>. If you’re configuring Google Cloud OAuth, set this as your Authorized domain’s authorization path.
        </p>
      </div>
    </div>
  );
}
