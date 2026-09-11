import { createClient } from "@supabase/supabase-js";

// New Supabase keys: VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...) replaces legacy anon.
// We accept either name for backward compat — publishable is preferred per 2026 deprecation.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY (anon) — auth will not work. Set them in .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
