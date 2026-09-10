import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { Plus, Volume2, Loader2, Languages, Sparkles } from 'lucide-react';

export default function AddWordForm() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [lastAdded, setLastAdded] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();

  const handlePlay = async (url) => {
    if (!url || audioLoading) return;
    setAudioLoading(true);
    try { await playAudioWithBuffer(url); } catch {} finally { setAudioLoading(false); }
  };

  const addMutation = useMutation({
    mutationFn: ({ text: t, sourceLang: sl, entryType }) => api.addWord(t, sl, entryType),
    onSuccess: (word) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setLastAdded(word);
      setText('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const entryType = text.trim().includes(' ') ? 'phrase' : 'word';
    addMutation.mutate({ text, sourceLang, entryType });
  };

  const loading = addMutation.isPending;
  const status = addMutation.isError
    ? { type: 'error', msg: addMutation.error?.message || 'Failed to add word.' }
    : lastAdded
      ? { type: 'success', msg: 'Added successfully!' }
      : null;

  const pendingAudio = lastAdded && !lastAdded.audio_url;

  return (
    <motion.div className="card" initial={shouldReduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> Add a word or phrase</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: '1.25rem' }}>
        Type in English or German — ä ö ü ß supported. We'll translate and create audio.
      </p>

      {status && <div className={`status-msg ${status.type}`}>{status.msg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="input-label" htmlFor="word-input">Word or Phrase</label>
            <input
              id="word-input"
              type="text"
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Bahnhof, Gemütlichkeit"
              disabled={loading}
            />
          </div>
          <div style={{ flex: '0 0 130px' }}>
            <label className="input-label" htmlFor="lang-select">Language</label>
            <div style={{ position: 'relative' }}>
              <select
                id="lang-select"
                className="text-input"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '2.2rem' }}
              >
                <option value="en">English</option>
                <option value="de">German</option>
              </select>
              <Languages size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {loading ? 'Translating…' : 'Add Entry'}
        </button>
      </form>

      {lastAdded && (
        <motion.div className="recently-added" initial={shouldReduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Recently Added</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}><span className="flag" aria-hidden="true" title="English"><svg viewBox="0 0 60 30" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg></span> {lastAdded.english_word}</span>
            <span className="word-separator">↔</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-strong)' }}><span className="flag" aria-hidden="true" title="Deutsch"><svg viewBox="0 0 5 3" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg></span> {lastAdded.german_word}</span>
            {pendingAudio ? (
              <span className="pending-pill"><Loader2 size={12} className="animate-spin" /> generating audio…</span>
            ) : audioLoading ? (
              <button className="btn-icon" disabled style={{ width: 36, height: 36 }} title="Loading audio"><Loader2 size={18} className="animate-spin" /></button>
            ) : (
              <button className="btn-icon" onClick={() => handlePlay(lastAdded.audio_url)} title="Play audio" style={{ width: 36, height: 36 }}>
                <Volume2 size={18} />
              </button>
            )}
          </div>
          {pendingAudio && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Audio will appear in My Words shortly — polling every few seconds.</p>}
        </motion.div>
      )}
    </motion.div>
  );
}
