import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { friendlyError } from '../lib/errors';
import { Volume2, Trash2, Loader2, RefreshCw, Pencil, Check, X, Search, Layers, Backpack, Music2, MoreHorizontal, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WordBadge from './WordBadge';

const POS_OPTIONS = ['', 'noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'];

export default function WordList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();
  const [editingId, setEditingId] = useState(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editGerman, setEditGerman] = useState('');
  const [editPos, setEditPos] = useState('');
  const [search, setSearch] = useState('');
  const [groupDropdownWordId, setGroupDropdownWordId] = useState(null);
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [activeGroupFilter, setActiveGroupFilter] = useState('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: words = [], isLoading, isFetching, error: queryError, refetch } = useQuery({
    queryKey: ['words', user?.id],
    queryFn: api.getWords,
    staleTime: 60_000,
    enabled: !!user,
  });
  const { data: groups = [] } = useQuery({ queryKey: ['groups', user?.id], queryFn: api.getGroups, staleTime: 60_000, enabled: !!user });

  const error = queryError ? friendlyError(queryError, "Couldn't load your words. Please check your connection and try again.") : null;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWord(id),
    onMutate: async (id) => {
      // Optimistic removal so the card vanishes instantly (with its exit
      // animation) instead of waiting for the background refetch.
      await queryClient.cancelQueries({ queryKey: ['words'] });
      const previousWords = queryClient.getQueryData(['words', user?.id]);
      queryClient.setQueryData(['words', user?.id], (old) =>
        Array.isArray(old) ? old.filter((w) => w.id !== id) : old
      );
      return { previousWords };
    },
    onError: (err, _vars, context) => {
      if (context?.previousWords) queryClient.setQueryData(['words', user?.id], context.previousWords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateWord(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update so the edited card shows the new text instantly,
      // without waiting for the background refetch.
      await queryClient.cancelQueries({ queryKey: ['words'] });
      const previousWords = queryClient.getQueryData(['words', user?.id]);
      queryClient.setQueryData(['words', user?.id], (old) =>
        Array.isArray(old) ? old.map((w) => (w.id === id ? { ...w, ...data } : w)) : old
      );
      return { previousWords };
    },
    onError: (err, _vars, context) => {
      if (context?.previousWords) queryClient.setQueryData(['words', user?.id], context.previousWords);
    },
    onSuccess: (updated) => {
      // Reconcile with server truth (e.g. regenerated audio_url), then
      // revalidate in the background.
      if (updated?.id) {
        queryClient.setQueryData(['words', user?.id], (old) =>
          Array.isArray(old) ? old.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)) : old
        );
      }
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
      setEditingId(null);
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: ({ wordId, groupId, isInGroup }) => isInGroup ? api.removeWordFromGroup(groupId, wordId) : api.addWordsToGroup(groupId, [wordId]),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['groupWords', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
    },
  });

  // Filter-chip counts derived from the loaded words (rather than the server
  // word_count). "Ungrouped" counts words assigned to no group (groups.length === 0).
  const pendingCount = useMemo(() => words.filter(w => !w.audio_url).length, [words]);
  const chipCounts = useMemo(() => {
    const m = new Map();
    groups.forEach(g => {
      const c = g.is_default
        ? words.filter(w => (w.groups?.length ?? 0) === 0).length
        : words.filter(w => w.groups?.some(x => x.id === g.id)).length;
      m.set(g.id, c);
    });
    return m;
  }, [words, groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ungroupedId = groups.find(g => g.is_default)?.id;
    return words.filter(w => {
      const matchesSearch = !q || w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q);
      let matchesGroup;
      if (activeGroupFilter === 'all') matchesGroup = true;
      else if (activeGroupFilter === ungroupedId) matchesGroup = (w.groups?.length ?? 0) === 0;
      else matchesGroup = w.groups?.some(g => g.id === activeGroupFilter);
      const matchesPending = !showPendingOnly || !w.audio_url;
      return matchesSearch && matchesGroup && matchesPending;
    });
  }, [words, search, activeGroupFilter, showPendingOnly, groups]);

  const hasActiveFilter = activeGroupFilter !== 'all' || showPendingOnly || search.trim() !== '';
  const clearFilters = () => { setActiveGroupFilter('all'); setShowPendingOnly(false); setSearch(''); };

  const handleDelete = (id) => { setActionError(null); deleteMutation.mutate(id, { onError: (err) => setActionError(friendlyError(err, "Couldn't delete that word. Please try again.")) }); };
  const startEdit = (word) => { setEditingId(word.id); setEditEnglish(word.english_word); setEditGerman(word.german_word); setEditPos(word.pos || ''); setOpenActionsId(null); };
  const cancelEdit = () => { setEditingId(null); setEditEnglish(''); setEditGerman(''); setEditPos(''); };
  const saveEdit = (id) => {
    if (!editEnglish.trim() || !editGerman.trim()) return;
    updateMutation.mutate({ id, data: {
      english_word: editEnglish.trim(),
      german_word: editGerman.trim(),
      pos: editPos || null,
    } }, { onError: (err) => setActionError(friendlyError(err, "Couldn't save your changes. Please try again.")) });
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
    toggleGroupMutation.mutate({ wordId, groupId, isInGroup }, { onError: (err) => setActionError(friendlyError(err, "Couldn't update the group assignment. Please try again.")) });
  };

  const handlePlay = async (url, id) => {
    if (!url || audioLoadingId || playingAudioId) return;
    setAudioLoadingId(id);
    try {
      setPlayingAudioId(id);
      setAudioLoadingId(null);
      await playAudioWithBuffer(url);
    } catch (e) {
      console.warn('Audio play failed', e);
    } finally {
      setAudioLoadingId(null);
      setPlayingAudioId(null);
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          My Words
          <span className="chip-count" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }} aria-label={`${filtered.length} of ${words.length} words shown`}>{filtered.length}/{words.length}</span>
          {isFetching && !isLoading && <span className="pending-pill" style={{ background: 'var(--color-surface-raised)', borderStyle: 'dashed' }}><Loader2 size={12} className="animate-spin" /> updating…</span>}
        </h2>
        <button onClick={() => refetch()} className="btn-icon" title="Refresh list" aria-label="Refresh word list"><RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} /></button>
      </div>
      {words.length > 0 && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.84rem', margin: '-0.5rem 0 1rem' }}>
          Your flashcard deck — tap the speaker to hear a card, hover for actions.
        </p>
      )}

      {error && <div className="status-msg error">{error}</div>}
      {actionError && (
        <div className="status-msg error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ flex: 1 }}>{actionError}</span>
          <button className="btn-icon small" onClick={() => setActionError(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {words.length > 0 && (
        <>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input" placeholder="Search — Großüber or house…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search words" style={search ? { paddingRight: '2.4rem' } : undefined} />
            <AnimatePresence>
              {search && (
                <motion.button
                  className="search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  title="Clear search"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
                >
                  <X size={15} />
                </motion.button>
              )}
            </AnimatePresence>
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
          <h3>No flashcards yet</h3>
          <p>Your deck is waiting. Add your first card to start the streak.</p>
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

      <motion.div className="word-grid">
        <AnimatePresence mode="popLayout">
        {filtered.map((word) => {
          const pending = !word.audio_url;
          const isEditing = editingId === word.id;
          const isOpen = openActionsId === word.id;
          return (
            <motion.div
              key={word.id}
              layout="position"
              className={`word-tile ${isEditing ? 'editing' : ''} ${pending && !isEditing ? 'tile-pending' : ''}`}
              initial={shouldReduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduce ? undefined : { opacity: 0, scale: 0.97, transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] } }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], layout: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
            >
              {isEditing ? (
                <>
                  <div className="tile-edit-fields">
                    <input type="text" className="text-input" value={editEnglish} onChange={e => setEditEnglish(e.target.value)} placeholder="English" autoFocus disabled={updateMutation.isPending} />
                    <span className="word-separator">↔</span>
                    <input type="text" className="text-input" value={editGerman} onChange={e => setEditGerman(e.target.value)} placeholder="Deutsch" disabled={updateMutation.isPending} />
                  </div>
                  <div className="tile-edit-fields" style={{ marginTop: '0.4rem' }}>
                    <select className="text-input" value={editPos} onChange={e => setEditPos(e.target.value)} disabled={updateMutation.isPending} aria-label="Part of speech">
                      <option value="">POS: auto</option>
                      {POS_OPTIONS.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
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
                  {/* Pronunciation control */}
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
                      <button
                        className={`speaker-btn ${playingAudioId === word.id ? 'is-playing' : ''}`}
                        onClick={() => handlePlay(word.audio_url, word.id)}
                        aria-label="Play audio"
                        title={playingAudioId === word.id ? "Playing pronunciation…" : "Listen to pronunciation"}
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>

                  {(word.groups?.length > 0 || pending || word.pos) && (
                    <div className="tile-meta">
                      {word.pos && (
                        <WordBadge pos={word.pos} />
                      )}
                      {word.groups?.length > 0 && (
                        <div className="word-group-badges">
                          {word.groups.map(g => <span key={g.id} className="group-badge">{g.name}</span>)}
                        </div>
                      )}
                      {pending && <span className="pending-pill"><Music2 size={12} /> no audio</span>}
                    </div>
                  )}

                  {/* Card actions for pointer devices (hover/focus) */}
                  <div className={`tile-actions ${isOpen ? 'open' : ''}`}>
                    <div className="group-dropdown-wrapper">
                      <button className="btn-icon small" onClick={(e) => { e.stopPropagation(); setGroupDropdownWordId(groupDropdownWordId === word.id ? null : word.id); }} title="Manage groups" disabled={toggleGroupMutation.isPending}><Layers size={14} /></button>
                      <AnimatePresence>
                        {groupDropdownWordId === word.id && (
                          <motion.div
                            className="group-dropdown"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                            style={{ transformOrigin: 'top right' }}
                          >
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button className="btn-icon small" onClick={() => startEdit(word)} title="Edit" disabled={deleteMutation.isPending || updateMutation.isPending || audioLoadingId !== null}><Pencil size={14} /></button>
                    <button className="btn-icon small danger" onClick={() => handleDelete(word.id)} title="Delete" disabled={deleteMutation.isPending || audioLoadingId !== null}>{(deleteMutation.isPending && deleteMutation.variables === word.id) ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                  </div>

                  {/* Overflow menu for touch devices */}
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
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
