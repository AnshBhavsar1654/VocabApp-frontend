const API_URL = "http://localhost:8000/api";

export const api = {
  addWord: async (text, source_lang) => {
    const res = await fetch(`${API_URL}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang }),
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
  }
};

export const playAudioWithBuffer = (url) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0; // completely silent
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      
      setTimeout(() => {
        new Audio(`http://localhost:8000${url}`).play();
      }, 500);
      return;
    }
  } catch (e) {
    console.warn("AudioContext wakeup failed", e);
  }
  new Audio(`http://localhost:8000${url}`).play();
};
