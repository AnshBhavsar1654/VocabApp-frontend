import { supabase } from "./lib/supabase";

// Backend base URL selected by VITE_MODE ("dev" for localhost, otherwise production).
// Safeguard: when served from a non-localhost host, never target localhost even if
// the build was produced with development defaults (e.g. a production deployment
// built with VITE_MODE=dev).
const MODE = (import.meta.env.VITE_MODE || import.meta.env.MODE || "dev").toLowerCase();
const PROD_URL = import.meta.env.VITE_API_URL_PROD || "https://vocabapp-backend.onrender.com";
const DEV_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
let API_URL = MODE === "dev" ? DEV_URL : (import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL || PROD_URL);
try {
  const host = window.location.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const pointsToLocalhost = /localhost|127\.0\.0\.1/.test(API_URL);
  if (!isLocalHost && pointsToLocalhost) API_URL = PROD_URL;
} catch { /* SSR-safe: keep MODE resolution */ }

async function authHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {};
}

async function authFetch(url, options = {}) {
  const headers = await authHeaders();
  const mergedHeaders = { ...(options.headers || {}), ...headers };
  const res = await fetch(url, { ...options, headers: mergedHeaders });
  // Authentication failures are surfaced to the caller. Automatic sign-out is
  // intentionally disabled here to avoid redirect loops during token refresh.
  return res;
}

export const api = {
  addWord: async (text, source_lang, entry_type = "word", pos = null) => {
    const res = await authFetch(`${API_URL}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang, entry_type, pos }),
    });
    if (!res.ok) {
      if (res.status === 409) {
        throw new Error("Word already exists in your vocabulary list.");
      }
      const d = await res.json().catch(()=>({}));
      throw new Error(d.detail || "Failed to add word.");
    }
    return res.json();
  },

  getWords: async () => {
    const res = await authFetch(`${API_URL}/words`);
    if (!res.ok) throw new Error("Failed to fetch words");
    return res.json();
  },

  updateWord: async (id, data) => {
    const res = await authFetch(`${API_URL}/words/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update word");
    return res.json();
  },

  deleteWord: async (id) => {
    const res = await authFetch(`${API_URL}/words/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete word");
  },

  getQuizNext: async () => {
    const res = await authFetch(`${API_URL}/quiz/next`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("No words available for quiz");
      throw new Error("Failed to fetch quiz");
    }
    return res.json();
  },

  getQuizSession: async (size = 10) => {
    const res = await authFetch(`${API_URL}/quiz/session?size=${size}`);
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      throw new Error(d.detail || "Failed to fetch quiz session");
    }
    return res.json();
  },

  recordQuizResult: async ({ word_id, is_correct, self_assessment, typed_answer, prompt_lang }) => {
    const res = await authFetch(`${API_URL}/quiz/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_id, is_correct, self_assessment, typed_answer, prompt_lang }),
    });
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      throw new Error(d.detail || "Failed to record result");
    }
    return res.json().catch(()=>({}));
  },

  checkQuiz: async (id, prompt_lang, user_answer) => {
    const res = await authFetch(`${API_URL}/quiz/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, prompt_lang, user_answer }),
    });
    if (!res.ok) throw new Error("Failed to check answer");
    return res.json();
  },

  getGroups: async () => {
    const res = await authFetch(`${API_URL}/groups`);
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  },

  createGroup: async (name) => {
    const res = await authFetch(`${API_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      if (res.status === 409) throw new Error("Group with this name already exists.");
      throw new Error("Failed to create group.");
    }
    return res.json();
  },

  renameGroup: async (id, name) => {
    const res = await authFetch(`${API_URL}/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to rename group");
    return res.json();
  },

  deleteGroup: async (id) => {
    const res = await authFetch(`${API_URL}/groups/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete group");
  },

  getGroupWords: async (id) => {
    const res = await authFetch(`${API_URL}/groups/${id}/words`);
    if (!res.ok) throw new Error("Failed to fetch group words");
    return res.json();
  },

  addWordsToGroup: async (groupId, wordIds) => {
    const res = await authFetch(`${API_URL}/groups/${groupId}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_ids: wordIds }),
    });
    if (!res.ok) throw new Error("Failed to add words to group");
    return res.json();
  },

  removeWordFromGroup: async (groupId, wordId) => {
    const res = await authFetch(`${API_URL}/groups/${groupId}/words/${wordId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove word from group");
  },

  setGroupWordOrder: async (groupId, wordIds) => {
    const res = await authFetch(`${API_URL}/groups/${groupId}/order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_ids: wordIds }),
    });
    if (!res.ok) throw new Error("Failed to save order");
    return res.json().catch(() => ({}));
  },

  getMe: async () => {
    const res = await authFetch(`${API_URL}/auth/me`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },
};

export const playAudioWithBuffer = (url) => {
  if (!url) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const doPlay = () => {
      const audio = new Audio(url);
      let settled = false;
      const done = () => { if (!settled) { settled = true; resolve(); } };
      const fail = (e) => { if (!settled) { settled = true; reject(e); } };
      audio.addEventListener('playing', done, { once: true });
      audio.addEventListener('error', fail, { once: true });
      // Safety net: resolve even if the browser omits playback events.
      setTimeout(done, 3000);
      audio.play().catch(fail);
    };
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(doPlay, 500);
        return;
      }
    } catch (e) {
      console.warn("AudioContext wakeup failed", e);
    }
    doPlay();
  });
};
