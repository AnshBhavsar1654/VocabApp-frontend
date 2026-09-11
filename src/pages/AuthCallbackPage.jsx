import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        // supabase-js with detectSessionInUrl handles code exchange automatically
        const { data: { session }, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;
        if (session) {
          navigate("/", { replace: true });
          return;
        }
        // fallback: exchange code if present
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate("/", { replace: true });
          return;
        }
        navigate("/login", { replace: true });
      } catch (e) {
        setError(e.message || "Authentication failed");
        setTimeout(()=>navigate("/login", {replace:true}), 2500);
      }
    };
    run();
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-(--color-bg) grid place-items-center px-4">
      <div className="card text-center max-w-sm w-full">
        {error ? <div className="status-msg error">{error}</div> : (
          <>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Finishing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
