import { createClient } from "@supabase/supabase-js";

// Supabase credentials: VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...) is the
// current key and replaces the legacy anon key. Either name is accepted for
// backward compatibility, with the publishable key preferred.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase configuration is incomplete (VITE_SUPABASE_URL or key missing) — authentication will be unavailable until the .env values are provided.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
