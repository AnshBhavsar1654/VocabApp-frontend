const API_URL = import.meta.env.API_URL || "http://localhost:8000";

export const api = {
  addWord: async (text, source_lang, entry_type = "word") => {
    const res = await fetch(`${API_URL}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang, entry_type }),
    });
    if (!res.ok) {
      if (res.status === 409) {
        throw new Error("Word already exists in your vocabulary list.");
      }
      throw new Error("Failed to add word.");
    }
    return res.json();
  },

  getWords: async () => {
    const res = await fetch(`${API_URL}/words`);
    if (!res.ok) throw new Error("Failed to fetch words");
    return res.json();
  },

  updateWord: async (id, data) => {
    const res = await fetch(`${API_URL}/words/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update word");
    return res.json();
  },

  deleteWord: async (id) => {
    const res = await fetch(`${API_URL}/words/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete word");
  },

  getQuizNext: async () => {
    const res = await fetch(`${API_URL}/quiz/next`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("No words available for quiz");
      throw new Error("Failed to fetch quiz");
    }
    return res.json();
  },

  checkQuiz: async (id, prompt_lang, user_answer) => {
    const res = await fetch(`${API_URL}/quiz/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, prompt_lang, user_answer }),
    });
    if (!res.ok) throw new Error("Failed to check answer");
    return res.json();
  },

  getGroups: async () => {
    const res = await fetch(`${API_URL}/groups`);
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  },

  createGroup: async (name) => {
    const res = await fetch(`${API_URL}/groups`, {
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
    const res = await fetch(`${API_URL}/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to rename group");
    return res.json();
  },

  deleteGroup: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete group");
  },

  getGroupWords: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}/words`);
    if (!res.ok) throw new Error("Failed to fetch group words");
    return res.json();
  },

  addWordsToGroup: async (groupId, wordIds) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_ids: wordIds }),
    });
    if (!res.ok) throw new Error("Failed to add words to group");
    return res.json();
  },

  removeWordFromGroup: async (groupId, wordId) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/words/${wordId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove word from group");
  },
};

export const playAudioWithBuffer = (url) => {
  if (!url) return;
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

      setTimeout(() => {
        new Audio(url).play();
      }, 500);
      return;
    }
  } catch (e) {
    console.warn("AudioContext wakeup failed", e);
  }
  new Audio(url).play();
};
