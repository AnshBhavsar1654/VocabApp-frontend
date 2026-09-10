import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Trash2, Loader2, RefreshCw, Pencil, Check, X, Search, Layers, Backpack, Music2, MoreHorizontal, Filter } from 'lucide-react';

export default function WordList() {
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();
  const [editingId, setEditingId] = useState(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editGerman, setEditGerman] = useState('');
  const [search, setSearch] = useState('');
  const [groupDropdownWordId, setGroupDropdownWordId] = useState(null);
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [activeGroupFilter, setActiveGroupFilter] = useState('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [openActionsId, setOpenActionsId] = useState(null);

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

  // derived counts (from words, not server word_count)
  const pendingCount = useMemo(() => words.filter(w => !w.audio_url).length, [words]);
  const chipCounts = useMemo(() => {
    const m = new Map();
    groups.forEach(g => {
      const c = words.filter(w => w.groups?.some(x => x.id === g.id)).length;
      m.set(g.id, c);
    });
    return m;
  }, [words, groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return words.filter(w => {
      const matchesSearch = !q || w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q);
      const matchesGroup = activeGroupFilter === 'all' || w.groups?.some(g => g.id === activeGroupFilter);
      const matchesPending = !showPendingOnly || !w.audio_url;
      return matchesSearch && matchesGroup && matchesPending;
    });
  }, [words, search, activeGroupFilter, showPendingOnly]);

  const hasActiveFilter = activeGroupFilter !== 'all' || showPendingOnly || search.trim() !== '';
  const clearFilters = () => { setActiveGroupFilter('all'); setShowPendingOnly(false); setSearch(''); };

  const handleDelete = (id) => deleteMutation.mutate(id, { onError: (err) => alert('Failed to delete: ' + err.message) });
  const startEdit = (word) => { setEditingId(word.id); setEditEnglish(word.english_word); setEditGerman(word.german_word); setOpenActionsId(null); };
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

  React.useEffect(() => {
    if (openActionsId === null) return;
    const close = (e) => {
      if (e.target.closest('.word-tile')) return;
      setOpenActionsId(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openActionsId]);

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
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 118, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          My Words <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>({filtered.length}/{words.length})</span>
          {isFetching && !isLoading && <span className="pending-pill" style={{ background: 'var(--color-surface-raised)', borderStyle: 'dashed' }}><Loader2 size={12} className="animate-spin" /> updating…</span>}
        </h2>
        <button onClick={() => refetch()} className="btn-icon" title="Refresh"><RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} /></button>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      {words.length > 0 && (
        <>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input" placeholder="Search — Großüber or house…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="filter-chips" role="group" aria-label="Filter words">
            <button
              className={`filter-chip ${activeGroupFilter==='all' && !showPendingOnly ? 'active' : ''}`}
              onClick={() => { setActiveGroupFilter('all'); setShowPendingOnly(false); }}
              aria-pressed={activeGroupFilter==='all' && !showPendingOnly}
            >
              All <span className="chip-count">{words.length}</span>
            </button>
            {groups.map(g => {
              const c = chipCounts.get(g.id) ?? 0;
              const active = activeGroupFilter===g.id && !showPendingOnly;
              return (
                <button key={g.id} className={`filter-chip ${active ? 'active' : ''}`} onClick={() => { setActiveGroupFilter(g.id); setShowPendingOnly(false); }} aria-pressed={active}>
                  {g.name} <span className="chip-count">{c}</span>
                </button>
              );
            })}
            <button
              className={`filter-chip ${showPendingOnly ? 'active' : ''}`}
              onClick={() => setShowPendingOnly(v=>!v)}
              aria-pressed={showPendingOnly}
              title="Words where audio not yet ready"
            >
              <Music2 size={12} /> No audio yet <span className="chip-count">{pendingCount}</span>
            </button>
            {hasActiveFilter && (
              <button className="filter-chip clear" onClick={clearFilters}><X size={12} /> Clear</button>
            )}
          </div>
        </>
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
          <h3>No results</h3>
          <p>No matches for “{search}”{activeGroupFilter!=='all' ? ` in ${groups.find(g=>g.id===activeGroupFilter)?.name}` : ''}{showPendingOnly ? ' · no audio' : ''}</p>
          <p className="hint">Try a different spelling — we search both languages, or clear filters.</p>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', marginTop:'0.75rem' }}>
            <button className="btn-primary-style btn-sm" onClick={()=>setSearch('')}><X size={14}/> Clear search</button>
            {hasActiveFilter && <button className="btn-primary-style btn-sm" style={{background:'var(--color-surface)', color:'var(--color-text)', borderColor:'var(--color-border)'}} onClick={clearFilters}><Filter size={14}/> Clear filters</button>}
          </div>
        </div>
      )}

      <div className="word-grid">
        {filtered.map((word, idx) => {
          const pending = !word.audio_url;
          const isEditing = editingId === word.id;
          const isOpen = openActionsId === word.id;
          return (
            <motion.div
              key={word.id}
              className={`word-tile ${isEditing ? 'editing' : ''}`}
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.12) }}
            >
              {isEditing ? (
                <>
                  <div className="tile-edit-fields">
                    <input type="text" className="text-input" value={editEnglish} onChange={e => setEditEnglish(e.target.value)} placeholder="English" autoFocus disabled={updateMutation.isPending} />
                    <span className="word-separator">↔</span>
                    <input type="text" className="text-input" value={editGerman} onChange={e => setEditGerman(e.target.value)} placeholder="Deutsch" disabled={updateMutation.isPending} />
                  </div>
                  <div className="tile-actions editing-actions" style={{ opacity:1, pointerEvents:'auto' }}>
                    <button className="btn-icon" onClick={() => saveEdit(word.id)} disabled={(updateMutation.isPending && updateMutation.variables?.id === word.id) || !editEnglish.trim() || !editGerman.trim()} style={{ color: 'var(--color-success)' }}>
                      {(updateMutation.isPending && updateMutation.variables?.id === word.id) ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button className="btn-icon" onClick={cancelEdit} disabled={updateMutation.isPending && updateMutation.variables?.id === word.id}><X size={16} /></button>
                  </div>
                </>
              ) : (
                <>
                  {/* top-right speaker */}
                  <div className="tile-top">
                    <div className="tile-pair">
                      <span className="word-lang"><span className="flag" aria-hidden="true" title="English"><svg viewBox="0 0 60 30" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg></span> {word.english_word}</span>
                      <span className="word-separator">↔</span>
                      <span className="word-lang german"><span className="flag" aria-hidden="true" title="Deutsch"><svg viewBox="0 0 5 3" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg></span> {word.german_word}</span>
                    </div>
                    {pending ? (
                      <span className="pending-pill small" title="Audio generating"><Loader2 size={12} className="animate-spin" /></span>
                    ) : audioLoadingId === word.id ? (
                      <button className="speaker-btn" disabled aria-label="Loading audio"><Loader2 size={16} className="animate-spin" /></button>
                    ) : (
                      <button className="speaker-btn" onClick={() => handlePlay(word.audio_url, word.id)} aria-label="Play audio"><Volume2 size={16} /></button>
                    )}
                  </div>

                  {(word.groups?.length > 0 || pending) && (
                    <div className="tile-meta">
                      {word.groups?.length > 0 && (
                        <div className="word-group-badges">
                          {word.groups.map(g => <span key={g.id} className="group-badge">{g.name}</span>)}
                        </div>
                      )}
                      {pending && <span className="pending-pill"><Music2 size={12} /> no audio</span>}
                    </div>
                  )}

                  {/* hover/focus actions — pointer devices */}
                  <div className={`tile-actions ${isOpen ? 'open' : ''}`}>
                    <div className="group-dropdown-wrapper">
                      <button className="btn-icon small" onClick={(e) => { e.stopPropagation(); setGroupDropdownWordId(groupDropdownWordId === word.id ? null : word.id); }} title="Manage groups" disabled={toggleGroupMutation.isPending}><Layers size={14} /></button>
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
                    <button className="btn-icon small" onClick={() => startEdit(word)} title="Edit" disabled={deleteMutation.isPending || updateMutation.isPending || audioLoadingId !== null}><Pencil size={14} /></button>
                    <button className="btn-icon small danger" onClick={() => handleDelete(word.id)} title="Delete" disabled={deleteMutation.isPending || audioLoadingId !== null}>{(deleteMutation.isPending && deleteMutation.variables === word.id) ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                  </div>

                  {/* touch: always-visible ... button */}
                  <button
                    className="more-btn"
                    onClick={(e) => { e.stopPropagation(); setOpenActionsId(isOpen ? null : word.id); }}
                    aria-label="More actions"
                    aria-expanded={isOpen}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
