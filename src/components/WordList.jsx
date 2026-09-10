import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Trash2, Loader2, RefreshCw, Pencil, Check, X, Search, Layers, Backpack, Music2 } from 'lucide-react';

export default function WordList() {
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();
  const [editingId, setEditingId] = useState(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editGerman, setEditGerman] = useState('');
  const [search, setSearch] = useState('');
  const [groupDropdownWordId, setGroupDropdownWordId] = useState(null);
  const [audioLoadingId, setAudioLoadingId] = useState(null);

  const { data: words = [], isLoading, isFetching, error: queryError, refetch } = useQuery({
    queryKey: ['words'],
    queryFn: api.getWords,
    staleTime: 60_000,
  });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: api.getGroups, staleTime: 60_000 });

  const error = queryError?.message || null;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateWord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
      setEditingId(null);
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: ({ wordId, groupId, isInGroup }) => isInGroup ? api.removeWordFromGroup(groupId, wordId) : api.addWordsToGroup(groupId, [wordId]),
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
    return words.filter(w => w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q));
  }, [words, search]);

  const handleDelete = (id) => deleteMutation.mutate(id, { onError: (err) => alert('Failed to delete: ' + err.message) });
  const startEdit = (word) => { setEditingId(word.id); setEditEnglish(word.english_word); setEditGerman(word.german_word); };
  const cancelEdit = () => { setEditingId(null); setEditEnglish(''); setEditGerman(''); };
  const saveEdit = (id) => {
    if (!editEnglish.trim() || !editGerman.trim()) return;
    updateMutation.mutate({ id, data: { english_word: editEnglish.trim(), german_word: editGerman.trim() } }, { onError: (err) => alert('Failed to update: ' + err.message) });
  };

  React.useEffect(() => {
    if (!groupDropdownWordId) return;
    const close = () => setGroupDropdownWordId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [groupDropdownWordId]);

  const toggleGroup = (wordId, groupId) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    const isInGroup = word.groups.some(g => g.id === groupId);
    toggleGroupMutation.mutate({ wordId, groupId, isInGroup }, { onError: (err) => alert('Failed: ' + err.message) });
  };

  const handlePlay = async (url, id) => {
    if (!url || audioLoadingId) return;
    setAudioLoadingId(id);
    try { await playAudioWithBuffer(url); } catch (e) { console.warn('Audio play failed', e); } finally { setAudioLoadingId(null); }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div style={{ height: 18, width: 160, marginBottom: 16 }} className="skeleton" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-text" style={{ maxWidth: '30%' }} />
            <div className="skeleton skeleton-text" style={{ maxWidth: '30%' }} />
            <div className="skeleton skeleton-icon" />
            <div className="skeleton skeleton-icon" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          My Words <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>({words.length})</span>
          {isFetching && !isLoading && <span className="pending-pill" style={{ background: 'var(--color-surface-raised)', borderStyle: 'dashed' }}><Loader2 size={12} className="animate-spin" /> updating…</span>}
        </h2>
        <button onClick={() => refetch()} className="btn-icon" title="Refresh"><RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} /></button>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      {words.length > 0 && (
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input type="text" className="search-input" placeholder="Search — Großüber or house…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {words.length === 0 && !isLoading && (
        <div className="empty-state">
          <div className="empty-backpack"><Backpack size={32} /></div>
          <h3>Noch leer — let's pack it!</h3>
          <p>Your suitcase is waiting. Add your first word to start the streak.</p>
          <p className="hint">Try “Fernweh”, “Feierabend”, or “Moin” — ä ö ü ß fully supported.</p>
        </div>
      )}

      {filtered.length === 0 && words.length > 0 && (
        <div className="empty-state">
          <div className="empty-backpack"><Search size={28} /></div>
          <p>No matches for "{search}"</p>
          <p className="hint">Try a different spelling — we search both languages.</p>
        </div>
      )}

      <div className="word-list">
        {filtered.map((word, idx) => {
          const pending = !word.audio_url;
          return (
            <motion.div
              key={word.id}
              className="word-item"
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.12) }}
            >
              {editingId === word.id ? (
                <>
                  <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
                    <input type="text" className="text-input" value={editEnglish} onChange={e => setEditEnglish(e.target.value)} style={{ flex: '1 1 90px', padding: '0.5rem 0.6rem', fontSize: '0.9rem' }} autoFocus disabled={updateMutation.isPending} />
                    <span className="word-separator">↔</span>
                    <input type="text" className="text-input" value={editGerman} onChange={e => setEditGerman(e.target.value)} style={{ flex: '1 1 90px', padding: '0.5rem 0.6rem', fontSize: '0.9rem' }} disabled={updateMutation.isPending} />
                  </div>
                  <div className="word-actions">
                    <button className="btn-icon" onClick={() => saveEdit(word.id)} disabled={(updateMutation.isPending && updateMutation.variables?.id === word.id) || !editEnglish.trim() || !editGerman.trim()} style={{ color: 'var(--color-success)' }}>
                      {(updateMutation.isPending && updateMutation.variables?.id === word.id) ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button className="btn-icon" onClick={cancelEdit} disabled={updateMutation.isPending && updateMutation.variables?.id === word.id}><X size={16} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="word-item-content">
                    <span className="word-lang">{word.english_word}</span>
                    <span className="word-separator">↔</span>
                    <span className="word-lang german">{word.german_word}</span>
                    {pending && <span className="pending-pill"><Music2 size={12} /> audio pending</span>}
                  </div>
                  {word.groups?.length > 0 && (
                    <div className="word-group-badges">
                      {word.groups.map(g => <span key={g.id} className="group-badge">{g.name}</span>)}
                    </div>
                  )}
                  <div className="word-actions">
                    <div className="group-dropdown-wrapper">
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setGroupDropdownWordId(groupDropdownWordId === word.id ? null : word.id); }} title="Manage groups" disabled={toggleGroupMutation.isPending}><Layers size={16} /></button>
                      {groupDropdownWordId === word.id && (
                        <div className="group-dropdown" onClick={e => e.stopPropagation()}>
                          {groups.map(g => {
                            const inGroup = word.groups?.some(wg => wg.id === g.id);
                            const toggling = toggleGroupMutation.isPending && toggleGroupMutation.variables?.wordId === word.id && toggleGroupMutation.variables?.groupId === g.id;
                            return (
                              <label key={g.id} className="group-dropdown-item">
                                <input type="checkbox" checked={inGroup} onChange={() => toggleGroup(word.id, g.id)} disabled={toggleGroupMutation.isPending} />
                                <span>{g.name}</span>
                                {toggling && <Loader2 size={12} className="animate-spin" style={{ marginLeft: 'auto' }} />}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {pending ? (
                      <span className="pending-pill" title="Audio is generating — will appear shortly"><Loader2 size={12} className="animate-spin" /> generating…</span>
                    ) : audioLoadingId === word.id ? (
                      <button className="btn-icon" disabled title="Loading audio"><Loader2 size={16} className="animate-spin" /></button>
                    ) : (
                      <button className="btn-icon" onClick={() => handlePlay(word.audio_url, word.id)} title="Play audio"><Volume2 size={16} /></button>
                    )}
                    <button className="btn-icon" onClick={() => startEdit(word)} title="Edit" disabled={deleteMutation.isPending || updateMutation.isPending || audioLoadingId !== null}><Pencil size={16} /></button>
                    <button className="btn-icon danger" onClick={() => handleDelete(word.id)} title="Delete" disabled={deleteMutation.isPending || audioLoadingId !== null}>{(deleteMutation.isPending && deleteMutation.variables === word.id) ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
