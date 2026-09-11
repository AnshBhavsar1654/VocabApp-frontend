import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { api } from "../api";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let done = false;
    const finish = (path) => {
      if (done) return;
      done = true;
      navigate(path, { replace: true });
    };

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    // Surface identity-provider errors immediately (e.g. a redirect URI that is
    // not allowlisted in the Supabase dashboard) instead of retrying silently.
    const decodeDeep = (s) => {
      let prev = s;
      for (let i = 0; i < 3; i++) {
        try {
          const next = decodeURIComponent(prev.replace(/\+/g, " "));
          if (next === prev) return next;
          prev = next;
        } catch {
          return prev;
        }
      }
      return prev;
    };
    const providerError =
      params.get("error_description") || params.get("error") || hashParams.get("error_description") || hashParams.get("error");
    if (params.get("error") || params.get("error_description") || hashParams.get("error") || hashParams.get("error_description")) {
      const raw = decodeDeep(providerError || "Sign-in failed");
      // The Supabase-to-Google token exchange failed server-side, which can only
      // be resolved through dashboard configuration. Present actionable guidance.
      if (/exchange.*external.*code/i.test(raw)) {
        setError(
          "Google login failed at token exchange (Supabase could not trade the Google code for tokens). " +
          "Fix in dashboards: 1) Google Cloud client must be type Web application with redirect URI " +
          "https://txpypojpsqbayeiyalvw.supabase.co/auth/v1/callback, " +
          "2) re-paste the exact Client ID + Secret into Supabase Auth > Providers > Google, " +
          "3) add your email as Test user or Publish the consent screen. Then start fresh from /login."
        );
      } else {
        setError(raw);
      }
      return undefined;
    }

    // The client exchanges the authorization code automatically on load
    // (detectSessionInUrl). A manual exchangeCodeForSession call must not be
    // added here: it would consume the single-use PKCE verifier a second time
    // and fail, which previously presented as a login loop.
    const finishAuthed = () => {
      // Best-effort backend synchronization: ensures the profile and default
      // group exist so the account is present in Supabase immediately after login.
      api.getMe().catch(() => {}).finally(() => finish("/"));
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) finishAuthed();
    });

    let attempts = 0;
    const poll = async () => {
      if (!mounted || done) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        finishAuthed();
        return;
      }
      attempts += 1;
      if (attempts >= 10) {
        if (!mounted || done) return;
        setError("We couldn't complete the sign-in. Returning to the login page…");
        setTimeout(() => finish("/login?error=no_session"), 1200);
        return;
      }
      setTimeout(poll, 300);
    };
    poll();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-(--color-bg) grid place-items-center px-4">
      <div className="card text-center max-w-sm w-full">
        {error ? (
          <>
            <div className="status-msg error">{error}</div>
            <button className="btn-primary" style={{ marginTop: "0.75rem" }} onClick={() => navigate("/login", { replace: true })}>
              Back to login — try again
            </button>
            <p style={{ color: "var(--color-text-faint)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Note: authorization codes are single-use. Return to the login page to start a new sign-in attempt.
            </p>
          </>
        ) : (
          <>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Finishing sign-in…</p>
            <p style={{ color: "var(--color-text-faint)", fontSize: "0.78rem", marginTop: "0.4rem" }}>Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  );
}
