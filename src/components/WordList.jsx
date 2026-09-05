import React, { useEffect, useState } from 'react';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Trash2, Loader2, RefreshCw, Pencil, Check, X } from 'lucide-react';

export default function WordList() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editGerman, setEditGerman] = useState('');
  const [saving, setSaving] = useState(false);

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

  const startEdit = (word) => {
    setEditingId(word.id);
    setEditEnglish(word.english_word);
    setEditGerman(word.german_word);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEnglish('');
    setEditGerman('');
  };

  const saveEdit = async (id) => {
    if (!editEnglish.trim() || !editGerman.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateWord(id, {
        english_word: editEnglish.trim(),
        german_word: editGerman.trim(),
      });
      setWords(words.map(w => w.id === id ? updated : w));
      setEditingId(null);
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setSaving(false);
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
            {editingId === word.id ? (
              <>
                <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="text-input"
                    value={editEnglish}
                    onChange={(e) => setEditEnglish(e.target.value)}
                    style={{ flex: 1, minWidth: '120px', padding: '0.5rem 0.75rem', fontSize: '1rem' }}
                    autoFocus
                    disabled={saving}
                  />
                  <span className="word-separator">↔</span>
                  <input
                    type="text"
                    className="text-input"
                    value={editGerman}
                    onChange={(e) => setEditGerman(e.target.value)}
                    style={{ flex: 1, minWidth: '120px', padding: '0.5rem 0.75rem', fontSize: '1rem', color: '#a78bfa' }}
                    disabled={saving}
                  />
                </div>
                <div className="word-actions">
                  <button
                    className="btn-icon"
                    onClick={() => saveEdit(word.id)}
                    title="Save"
                    disabled={saving || !editEnglish.trim() || !editGerman.trim()}
                    style={{ color: 'var(--success-color)' }}
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                  </button>
                  <button className="btn-icon" onClick={cancelEdit} title="Cancel" disabled={saving}>
                    <X size={20} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="word-item-content">
                  <span className="word-lang">{word.english_word}</span>
                  <span className="word-separator">↔</span>
                  <span className="word-lang german">{word.german_word}</span>
                </div>
                <div className="word-actions">
                  <button className="btn-icon" onClick={() => playAudio(word.audio_url)} title="Play Audio">
                    <Volume2 size={20} />
                  </button>
                  <button className="btn-icon" onClick={() => startEdit(word)} title="Edit">
                    <Pencil size={20} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(word.id)} title="Delete">
                    <Trash2 size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
