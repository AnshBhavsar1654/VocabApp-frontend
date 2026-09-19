import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { friendlyError } from '../lib/errors';
import { Plus, Volume2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WordBadge from './WordBadge';

export default function AddWordForm() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [pos, setPos] = useState(''); // '' = auto-suggest
  const [lastAdded, setLastAdded] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();

  const handlePlay = async (url) => {
    if (!url || audioLoading || isPlaying) return;
    setAudioLoading(true);
    try {
      setIsPlaying(true);
      setAudioLoading(false);
      await playAudioWithBuffer(url);
    } catch {} finally {
      setAudioLoading(false);
      setIsPlaying(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: ({ text: t, sourceLang: sl, entryType, pos: p }) => api.addWord(t, sl, entryType, p),
    onSuccess: (word) => {
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
      setLastAdded(word);
      setText('');
      setPos('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const entryType = text.trim().includes(' ') ? 'phrase' : 'word';
    addMutation.mutate({
      text,
      sourceLang,
      entryType,
      pos: pos || null,
    });
  };

  const loading = addMutation.isPending;
  const status = addMutation.isError
    ? { type: 'error', msg: friendlyError(addMutation.error, "Couldn't add that entry. Please try again.") }
    : lastAdded
      ? { type: 'success', msg: 'Added to your vocabulary.' }
      : null;

  const pendingAudio = lastAdded && !lastAdded.audio_url;

  return (
    <motion.div className="card" initial={shouldReduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> Add a flashcard</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: '1.25rem' }}>
        Type in English or German — ä ö ü ß supported. We&apos;ll translate it, speak it, and file it in your deck.
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
          <div style={{ flex: '0 0 150px' }}>
            <span className="input-label" id="lang-label">Language</span>
            <div className="seg-control" role="group" aria-labelledby="lang-label">
              <button type="button" className={`seg-btn ${sourceLang==='en' ? 'active' : ''}`} onClick={() => setSourceLang('en')} disabled={loading} aria-pressed={sourceLang==='en'}>English</button>
              <button type="button" className={`seg-btn ${sourceLang==='de' ? 'active' : ''}`} onClick={() => setSourceLang('de')} disabled={loading} aria-pressed={sourceLang==='de'}>German</button>
            </div>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '0.6rem' }}>
          <label className="input-label" htmlFor="pos-select">Part of speech (optional)</label>
          <select
            id="pos-select"
            className="text-input"
            value={pos}
            onChange={(e) => setPos(e.target.value)}
            disabled={loading}
          >
            <option value="">Auto-detect</option>
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adjective">Adjective</option>
            <option value="adverb">Adverb</option>
            <option value="phrase">Phrase</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {loading ? 'Translating…' : 'Add Entry'}
        </button>
      </form>

      <AnimatePresence>
        {lastAdded && (
          <motion.div
            className="recently-added"
            initial={shouldReduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduce ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <h3>Recently Added</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}><span className="flag" aria-hidden="true" title="English"><svg viewBox="0 0 60 30" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg></span> {lastAdded.english_word}</span>
              <span className="word-separator">↔</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary-strong)' }}><span className="flag" aria-hidden="true" title="Deutsch"><svg viewBox="0 0 5 3" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg></span> {lastAdded.german_word}</span>
              <WordBadge pos={lastAdded.pos} />
              {pendingAudio ? (
                <span className="pending-pill"><Loader2 size={12} className="animate-spin" /> generating audio…</span>
              ) : audioLoading ? (
                <button className="btn-icon" disabled style={{ width: 36, height: 36 }} title="Loading audio"><Loader2 size={18} className="animate-spin" /></button>
              ) : (
                <button
                  className={`btn-icon ${isPlaying ? 'is-playing text-(--color-accent-strong) bg-(--color-accent-soft) border-(--color-accent)' : ''}`}
                  onClick={() => handlePlay(lastAdded.audio_url)}
                  title={isPlaying ? "Playing pronunciation…" : "Play audio"}
                  style={{ width: 36, height: 36 }}
                >
                  <Volume2 size={18} className={isPlaying ? 'animate-pulse' : ''} />
                </button>
              )}
            </div>
            {pendingAudio && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Audio will appear in My Words shortly — polling every few seconds.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
