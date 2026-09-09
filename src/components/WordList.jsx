import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Trash2, Loader2, RefreshCw, Pencil, Check, X, Search, Layers } from 'lucide-react';

export default function WordList() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editGerman, setEditGerman] = useState('');
  const [search, setSearch] = useState('');
  const [groupDropdownWordId, setGroupDropdownWordId] = useState(null);

  // Stable keys: ['words'] and ['groups'] with 60s staleTime => instant cache on tab switch, quiet revalidation.
  const {
    data: words = [],
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['words'],
    queryFn: api.getWords,
    staleTime: 60_000,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: api.getGroups,
    staleTime: 60_000,
  });

  const error = queryError?.message || null;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWord(id),
    onSuccess: (_, id) => {
      // Production default: invalidateQueries so Supabase is source of truth.
      // Optimistic alternative: remove from cache immediately in onMutate, rollback onError.
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateWord(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      // Also keep groupWords fresh if the word appears in any group detail
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
      setEditingId(null);
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: ({ wordId, groupId, isInGroup }) => {
      if (isInGroup) return api.removeWordFromGroup(groupId, wordId);
      return api.addWordsToGroup(groupId, [wordId]);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groupWords', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return words;
    const q = search.toLowerCase();
    return words.filter(
      w => w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q)
    );
  }, [words, search]);

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onError: (err) => alert('Failed to delete word: ' + err.message),
    });
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

  const saveEdit = (id) => {
    if (!editEnglish.trim() || !editGerman.trim()) return;
    updateMutation.mutate(
      { id, data: { english_word: editEnglish.trim(), german_word: editGerman.trim() } },
      {
        onError: (err) => alert('Failed to update: ' + err.message),
      }
    );
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  React.useEffect(() => {
    const handleClickOutside = () => setGroupDropdownWordId(null);
    if (groupDropdownWordId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [groupDropdownWordId]);

  const toggleGroup = (wordId, groupId) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    const isInGroup = word.groups.some(g => g.id === groupId);
    toggleGroupMutation.mutate(
      { wordId, groupId, isInGroup },
      {
        onError: (err) => alert('Failed to update groups: ' + err.message),
      }
    );
  };

  // isLoading = true only on first load (no cache) → full skeleton
  if (isLoading) {
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
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Your Vocabulary ({words.length})
          {/* isFetching = true on every background refetch → small indicator, old data stays visible */}
          {isFetching && !isLoading && (
            <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Loader2 size={12} className="animate-spin" /> updating…
            </span>
          )}
        </h2>
        <button onClick={() => refetch()} className="btn-icon" title="Refresh">
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
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

      {words.length === 0 && !isLoading && (
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
                    disabled={updateMutation.isPending}
                  />
                  <span className="word-separator">↔</span>
                  <input
                    type="text"
                    className="text-input"
                    value={editGerman}
                    onChange={(e) => setEditGerman(e.target.value)}
                    style={{ flex: '1 1 100px', padding: '0.45rem 0.65rem', fontSize: '0.9rem', color: '#a78bfa' }}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="word-actions">
                  <button
                    className="btn-icon"
                    onClick={() => saveEdit(word.id)}
                    title="Save"
                    disabled={updateMutation.isPending || !editEnglish.trim() || !editGerman.trim()}
                    style={{ color: 'var(--success-color)' }}
                  >
                    {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  </button>
                  <button className="btn-icon" onClick={cancelEdit} title="Cancel" disabled={updateMutation.isPending}>
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
                                disabled={toggleGroupMutation.isPending}
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
                  <button className="btn-icon danger" onClick={() => handleDelete(word.id)} title="Delete" disabled={deleteMutation.isPending}>
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
