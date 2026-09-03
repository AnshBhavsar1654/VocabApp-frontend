import React, { useEffect, useState } from 'react';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Trash2, Loader2, RefreshCw } from 'lucide-react';

export default function WordList() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const data = await api.getWords();
      setWords(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.deleteWord(id);
      setWords(words.filter(w => w.id !== id));
    } catch (err) {
      alert("Failed to delete word: " + err.message);
    }
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  if (loading && words.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Your Vocabulary ({words.length})</h2>
        <button onClick={fetchWords} className="btn-icon" title="Refresh">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      {words.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <p>No words added yet.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Go to 'Add Word' to get started!</p>
        </div>
      )}

      <div className="word-list">
        {words.map(word => (
          <div key={word.id} className="word-item">
            <div className="word-item-content">
              <span className="word-lang">{word.english_word}</span>
              <span className="word-separator">↔</span>
              <span className="word-lang german">{word.german_word}</span>
            </div>
            <div className="word-actions">
              <button className="btn-icon" onClick={() => playAudio(word.audio_url)} title="Play Audio">
                <Volume2 size={20} />
              </button>
              <button className="btn-icon danger" onClick={() => handleDelete(word.id)} title="Delete">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
