import React, { useState } from 'react';
import { api, playAudioWithBuffer } from '../api';
import { Plus, Volume2, Loader2, Languages } from 'lucide-react';

export default function AddWordForm({ onWordAdded }) {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    setStatus(null);
    setLastAdded(null);
    
    try {
      const word = await api.addWord(text, sourceLang);
      setStatus({ type: 'success', msg: `Added successfully!` });
      setLastAdded(word);
      setText('');
      if (onWordAdded) onWordAdded(word);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Add a new word</h2>
      
      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.msg}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label" htmlFor="word-input">
              Word
            </label>
            <input
              id="word-input"
              type="text"
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Haus or House"
              disabled={loading}
            />
          </div>
          
          <div style={{ width: '150px' }}>
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
                style={{ appearance: 'none', paddingLeft: '2.5rem' }}
              >
                <option value="en">English</option>
                <option value="de">German</option>
              </select>
              <Languages size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Plus />}
          {loading ? 'Translating & Generating Audio...' : 'Add Word'}
        </button>
      </form>

      {lastAdded && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Recently Added:</h3>
          <div className="word-item-content">
            <span className="word-lang">{lastAdded.english_word}</span>
            <span className="word-separator">↔</span>
            <span className="word-lang german">{lastAdded.german_word}</span>
            <button className="btn-icon" onClick={() => playAudio(lastAdded.audio_url)} title="Play Audio">
              <Volume2 size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
