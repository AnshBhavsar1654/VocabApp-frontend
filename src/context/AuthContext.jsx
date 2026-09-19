import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "anshbhavsar164@gmail.com";

export function getUserDisplayName(user) {
  if (!user) return "";
  const meta = user.user_metadata || {};
  const identityMeta = user.identities?.[0]?.identity_data || {};
  let name =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    identityMeta.full_name ||
    identityMeta.name ||
    "";

  if (!name && meta.given_name) {
    name = `${meta.given_name} ${meta.family_name || ""}`.trim();
  }

  if (!name && user.id) {
    try {
      name = localStorage.getItem(`vocabapp_name_${user.id}`) || "";
    } catch {}
  }

  // Convenience default for the admin account if metadata was created prior to name collection
  if (!name && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    name = "Ansh Bhavsar";
  }

  return (name || "").trim();
}

export function getUserInitials(user) {
  const name = getUserDisplayName(user);
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      // First letter of first name + first letter of surname / last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      // Surname isn't available, so just initial of name
      return parts[0][0].toUpperCase();
    }
  }

  // Fallback if no name is available yet: first character of email
  const email = user?.email || "";
  if (email) {
    return email[0].toUpperCase();
  }
  return "??";
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password, fullName = "") => {
    const trimmedName = (fullName || "").trim();
    const options = trimmedName
      ? {
          data: {
            full_name: trimmedName,
            name: trimmedName,
          },
        }
      : undefined;
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) throw error;
    if (trimmedName && data?.user?.id) {
      try {
        localStorage.setItem(`vocabapp_name_${data.user.id}`, trimmedName);
      } catch {}
    }
    return data;
  }, []);

  const updateProfile = useCallback(async ({ fullName }) => {
    const trimmedName = (fullName || "").trim();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        name: trimmedName,
      },
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      if (data.user.id && trimmedName) {
        try {
          localStorage.setItem(`vocabapp_name_${data.user.id}`, trimmedName);
        } catch {}
      }
    }
    return data;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const initials = useMemo(() => getUserInitials(user), [user]);

  const value = useMemo(() => ({
    session,
    user,
    displayName,
    initials,
    loading,
    isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    isAuthenticated: !!user,
    signUp,
    updateProfile,
    signIn,
    signInWithGoogle,
    signOut,
    accessToken: session?.access_token || null,
  }), [session, user, displayName, initials, loading, signUp, updateProfile, signIn, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
