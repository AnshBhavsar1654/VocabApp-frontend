import React, { useEffect, useState, useMemo } from 'react';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Trash2, Loader2, RefreshCw, Pencil, Check, X, Search, Layers } from 'lucide-react';

export default function WordList() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editGerman, setEditGerman] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupDropdownWordId, setGroupDropdownWordId] = useState(null);

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

  const fetchGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  useEffect(() => {
    fetchWords();
    fetchGroups();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return words;
    const q = search.toLowerCase();
    return words.filter(
      w => w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q)
    );
  }, [words, search]);

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

  useEffect(() => {
    const handleClickOutside = () => setGroupDropdownWordId(null);
    if (groupDropdownWordId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [groupDropdownWordId]);

  const toggleGroup = async (wordId, groupId) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    const isInGroup = word.groups.some(g => g.id === groupId);
    try {
      if (isInGroup) {
        await api.removeWordFromGroup(groupId, wordId);
      } else {
        await api.addWordsToGroup(groupId, [wordId]);
      }
      setWords(prev => prev.map(w => {
        if (w.id !== wordId) return w;
        if (isInGroup) {
          return { ...w, groups: w.groups.filter(g => g.id !== groupId) };
        } else {
          const group = groups.find(g => g.id === groupId);
          return { ...w, groups: [...w.groups, { id: groupId, name: group.name }] };
        }
      }));
    } catch (err) {
      alert('Failed to update groups: ' + err.message);
    }
  };

  if (loading && words.length === 0) {
    return (
      <div className="card">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-text" style={{ maxWidth: '35%' }} />
            <div className="skeleton skeleton-text" style={{ maxWidth: '35%' }} />
            <div className="skeleton skeleton-icon" />
            <div className="skeleton skeleton-icon" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2>Your Vocabulary ({words.length})</h2>
        <button onClick={fetchWords} className="btn-icon" title="Refresh">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      {words.length > 0 && (
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search words or phrases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {words.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Volume2 size={48} />
          </div>
          <p>No words added yet.</p>
          <p className="hint">Go to 'Add Word' to get started!</p>
        </div>
      )}

      {filtered.length === 0 && words.length > 0 && (
        <div className="empty-state">
          <p>No matches for "{search}"</p>
        </div>
      )}

      <div className="word-list">
        {filtered.map(word => (
          <div key={word.id} className="word-item">
            {editingId === word.id ? (
              <>
                <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
                  <input
                    type="text"
                    className="text-input"
                    value={editEnglish}
                    onChange={(e) => setEditEnglish(e.target.value)}
                    style={{ flex: '1 1 100px', padding: '0.45rem 0.65rem', fontSize: '0.9rem' }}
                    autoFocus
                    disabled={saving}
                  />
                  <span className="word-separator">↔</span>
                  <input
                    type="text"
                    className="text-input"
                    value={editGerman}
                    onChange={(e) => setEditGerman(e.target.value)}
                    style={{ flex: '1 1 100px', padding: '0.45rem 0.65rem', fontSize: '0.9rem', color: '#a78bfa' }}
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
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  </button>
                  <button className="btn-icon" onClick={cancelEdit} title="Cancel" disabled={saving}>
                    <X size={18} />
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
                {word.groups && word.groups.length > 0 && (
                  <div className="word-group-badges">
                    {word.groups.map(g => (
                      <span key={g.id} className="group-badge">{g.name}</span>
                    ))}
                  </div>
                )}
                <div className="word-actions">
                  <div className="group-dropdown-wrapper">
                    <button
                      className="btn-icon"
                      onClick={() => setGroupDropdownWordId(groupDropdownWordId === word.id ? null : word.id)}
                      title="Manage groups"
                    >
                      <Layers size={18} />
                    </button>
                    {groupDropdownWordId === word.id && (
                      <div className="group-dropdown" onClick={(e) => e.stopPropagation()}>
                        {groups.map(g => {
                          const inGroup = word.groups?.some(wg => wg.id === g.id);
                          return (
                            <label key={g.id} className="group-dropdown-item">
                              <input
                                type="checkbox"
                                checked={inGroup}
                                onChange={() => toggleGroup(word.id, g.id)}
                              />
                              <span>{g.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button className="btn-icon" onClick={() => playAudio(word.audio_url)} title="Play Audio">
                    <Volume2 size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => startEdit(word)} title="Edit">
                    <Pencil size={18} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(word.id)} title="Delete">
                    <Trash2 size={18} />
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
