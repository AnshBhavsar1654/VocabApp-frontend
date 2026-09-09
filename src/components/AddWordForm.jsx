import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, playAudioWithBuffer } from '../api';
import { Plus, Volume2, Loader2, Languages } from 'lucide-react';

export default function AddWordForm() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [lastAdded, setLastAdded] = useState(null);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: ({ text: t, sourceLang: sl, entryType }) => api.addWord(t, sl, entryType),
    onSuccess: (word) => {
      // Production pattern: invalidate so all consumers (['words'], ['groups'], ['groupWords',*]) get fresh data.
      // We invalidate ['words'] and ['groups'] — groupWords will refetch on next mount/visibility.
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setLastAdded(word);
      setText('');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const entryType = text.trim().includes(' ') ? 'phrase' : 'word';
    addMutation.mutate({ text, sourceLang, entryType });
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  const loading = addMutation.isPending;
  const status = addMutation.isError
    ? { type: 'error', msg: addMutation.error?.message || 'Failed to add word.' }
    : addMutation.isSuccess && !lastAdded
      ? { type: 'success', msg: 'Added successfully!' }
      : lastAdded
        ? { type: 'success', msg: 'Added successfully!' }
        : null;

  return (
    <div className="card">
      <h2>Add a word or phrase</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
        Type a word or sentence in English or German.
      </p>

      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="input-label" htmlFor="word-input">
              Word or Phrase
            </label>
            <input
              id="word-input"
              type="text"
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Haus, House, or Guten Morgen"
              disabled={loading}
            />
          </div>

          <div style={{ flex: '0 0 auto', minWidth: '130px' }}>
            <label className="input-label" htmlFor="lang-select">
              Language
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="lang-select"
                className="text-input"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                disabled={loading}
                style={{ appearance: 'none', paddingLeft: '2.25rem' }}
              >
                <option value="en">English</option>
                <option value="de">German</option>
              </select>
              <Languages size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {loading ? 'Translating & Generating Audio...' : 'Add Entry'}
        </button>
      </form>

      {lastAdded && (
        <div className="recently-added">
          <h3>Recently Added</h3>
          <div className="word-item-content">
            <span className="word-lang">{lastAdded.english_word}</span>
            <span className="word-separator">↔</span>
            <span className="word-lang german">{lastAdded.german_word}</span>
            <button className="btn-icon" onClick={() => playAudio(lastAdded.audio_url)} title="Play Audio">
              <Volume2 size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
