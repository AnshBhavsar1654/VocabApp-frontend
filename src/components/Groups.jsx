import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { Layers, Plus, Trash2, Pencil, Check, X, Volume2, Search, Loader2, FolderOpen, Users, Backpack, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Groups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showAddWords, setShowAddWords] = useState(false);
  const [addWordsSearch, setAddWordsSearch] = useState('');

  // popups
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [openActionsId, setOpenActionsId] = useState(null);

  const { data: groups = [], isLoading, isFetching: groupsFetching, error: groupsError } = useQuery({ queryKey: ['groups', user?.id], queryFn: api.getGroups, staleTime: 60_000, enabled: !!user });
  const { data: allWords = [] } = useQuery({ queryKey: ['words', user?.id], queryFn: api.getWords, staleTime: 60_000, enabled: !!user });
  const { data: groupWordsData, isLoading: groupLoading, isFetching: groupFetching } = useQuery({
    queryKey: ['groupWords', user?.id, selectedGroupId],
    queryFn: () => api.getGroupWords(selectedGroupId),
    enabled: !!selectedGroupId && !!user,
    staleTime: 60_000,
  });
  const groupWords = groupWordsData?.words || [];

  React.useEffect(() => { if (!selectedGroupId && groups.length > 0) setSelectedGroupId(groups[0].id); }, [groups, selectedGroupId]);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const error = groupsError?.message || null;

  const wordsNotInGroup = useMemo(() => {
    const ids = new Set(groupWords.map(w => w.id));
    if (!addWordsSearch.trim()) return allWords.filter(w => !ids.has(w.id));
    const q = addWordsSearch.toLowerCase();
    return allWords.filter(w => !ids.has(w.id) && (w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q)));
  }, [allWords, groupWords, addWordsSearch]);

  const createGroupMutation = useMutation({ mutationFn: (name) => api.createGroup(name), onSuccess: (g) => { queryClient.invalidateQueries({ queryKey: ['groups', user?.id] }); setNewGroupName(''); setShowCreate(false); setSelectedGroupId(g.id); } });
  const renameGroupMutation = useMutation({ mutationFn: ({ groupId, name }) => api.renameGroup(groupId, name), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups', user?.id] }); setShowEdit(false); setEditTarget(null); } });
  const deleteGroupMutation = useMutation({
    mutationFn: (id) => api.deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] }); queryClient.invalidateQueries({ queryKey: ['groupWords'] });
      setShowEdit(false); setEditTarget(null);
      if (selectedGroupId === id) { const d = groups.find(g => g.is_default); setSelectedGroupId(d ? d.id : null); }
    },
  });
  const addWordsMutation = useMutation({ mutationFn: ({ groupId, wordIds }) => api.addWordsToGroup(groupId, wordIds), onSuccess: (_, { groupId }) => { queryClient.invalidateQueries({ queryKey: ['groupWords', user?.id, groupId] }); queryClient.invalidateQueries({ queryKey: ['groups', user?.id] }); queryClient.invalidateQueries({ queryKey: ['words', user?.id] }); setShowAddWords(false); setAddWordsSearch(''); } });
  const removeWordMutation = useMutation({ mutationFn: ({ groupId, wordId }) => api.removeWordFromGroup(groupId, wordId), onSuccess: (_, { groupId }) => { queryClient.invalidateQueries({ queryKey: ['groupWords', user?.id, groupId] }); queryClient.invalidateQueries({ queryKey: ['groups', user?.id] }); } });

  const handleCreate = () => { const n = newGroupName.trim(); if (!n) return; createGroupMutation.mutate(n, { onError: e => alert(e.message) }); };
  const handleRename = () => { const n = editingName.trim(); if (!n || !editTarget) return; renameGroupMutation.mutate({ groupId: editTarget.id, name: n }, { onError: e => alert(e.message) }); };
  const handleDelete = () => { if (!editTarget) return; if (!confirm('Delete group? Words move to Ungrouped.')) return; deleteGroupMutation.mutate(editTarget.id, { onError: e => alert(e.message) }); };
  const handleAdd = (ids) => { if (!selectedGroupId || !ids.length) return; addWordsMutation.mutate({ groupId: selectedGroupId, wordIds: ids }, { onError: e => alert(e.message) }); };
  const handleRemove = (wid) => { if (!selectedGroupId) return; removeWordMutation.mutate({ groupId: selectedGroupId, wordId: wid }, { onError: e => alert(e.message) }); };
  const handlePlay = async (url, id) => { if (!url || audioLoadingId) return; setAudioLoadingId(id); try { await playAudioWithBuffer(url); } catch (e) { console.warn('Audio failed', e); } finally { setAudioLoadingId(null); } };

  React.useEffect(() => {
    if (openActionsId === null) return;
    const close = (e) => { if (e.target.closest('.word-tile')) return; setOpenActionsId(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openActionsId]);

  const handleGroupClick = (g) => {
    if (selectedGroupId === g.id && !g.is_default) {
      setEditTarget(g);
      setEditingName(g.name);
      setShowEdit(true);
      return;
    }
    setSelectedGroupId(g.id);
    // animate feedback already via motion; open edit only on second click for non-default
    if (g.is_default) return;
    // first click just selects; second click opens edit (handled above). No auto-popup on first.
  };

  const openEditFor = (g) => {
    if (g.is_default) return;
    setEditTarget(g);
    setEditingName(g.name);
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="card">
        {[1, 2, 3].map(i => <div key={i} className="skeleton-row"><div className="skeleton skeleton-text" /><div className="skeleton skeleton-icon" /></div>)}
      </div>
    );
  }

  return (
    <div className="groups-page">
      {/* Top strip — between navbar/stat and words */}
      <div className="groups-strip-wrapper card">
        <div className="groups-strip-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Groups {groupsFetching && !isLoading && <Loader2 size={14} className="animate-spin" />}</h2>
          <button className="btn-primary-style btn-sm" onClick={() => { setNewGroupName(''); setShowCreate(true); }}><Plus size={14} /> New group</button>
        </div>
        {error && <div className="status-msg error" style={{ fontSize: '0.82rem', marginBottom: '0.6rem' }}>{error}</div>}
        <div className="groups-strip" role="tablist" aria-label="Groups">
          {[...groups].sort((a,b)=> Number(a.is_default) - Number(b.is_default) || a.name.localeCompare(b.name)).map(g => {
            const active = selectedGroupId === g.id;
            return (
              <motion.button
                key={g.id}
                role="tab"
                aria-selected={active}
                onClick={() => handleGroupClick(g)}
                onDoubleClick={() => openEditFor(g)}
                className={`group-pill ${active ? 'active' : ''} ${g.is_default ? 'is-default' : ''}`}
                whileTap={shouldReduce ? {} : { scale: 0.97 }}
                initial={false}
                animate={{ scale: active ? 1.02 : 1 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                title={g.is_default ? 'System group — words not in other groups' : 'Click to select — click again to edit'}
              >
                <span className="group-pill-icon">{g.is_default ? <FolderOpen size={14} /> : <Layers size={14} />}</span>
                <span className="group-pill-name">{g.name}</span>
                <span className="group-pill-count">{g.word_count}</span>
                {!g.is_default && active && <Pencil size={12} className="group-pill-edit-hint" />}
              </motion.button>
            );
          })}
        </div>
        <p className="groups-strip-hint">Tap a group to filter · Tap again on a custom group to edit</p>
      </div>

      <div className="groups-panel card">
        {selectedGroup ? (
          <>
            <div className="groups-panel-header">
              <h2>{selectedGroup.is_default ? <FolderOpen size={18} /> : <Layers size={18} />}{selectedGroup.name}<span className="groups-panel-count">({groupWords.length})</span>{groupFetching && !groupLoading && <Loader2 size={14} className="animate-spin" />}</h2>
              <button className="btn-primary-style btn-sm" onClick={() => setShowAddWords(true)}><Plus size={14} /> Add Words</button>
            </div>
            {groupLoading ? (
              <div className="word-grid" aria-busy="true" aria-label="Loading words">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="skeleton" style={{ height: 118, borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : groupWords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-backpack"><Users size={28} /></div>
                <h3>Noch keine Wörter</h3>
                <p>This group is still empty — add a few to organize your trip.</p>
                <p className="hint">Words live in Ungrouped until you sort them.</p>
              </div>
            ) : (
              <div className="word-grid">
                {groupWords.map((word, i) => {
                  const pending = !word.audio_url;
                  const isOpen = openActionsId === word.id;
                  return (
                    <motion.div key={word.id} className="word-tile" initial={shouldReduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: Math.min(i * 0.02, 0.1) }}>
                      <div className="tile-top">
                        <div className="tile-pair">
                          <span className="word-lang"><span className="flag" aria-hidden="true" title="English"><svg viewBox="0 0 60 30" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg></span> {word.english_word}</span>
                          <span className="word-separator">↔</span>
                          <span className="word-lang german"><span className="flag" aria-hidden="true" title="Deutsch"><svg viewBox="0 0 5 3" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg></span> {word.german_word}</span>
                        </div>
                        {pending ? <span className="pending-pill small" title="Audio generating"><Loader2 size={11} className="animate-spin" /></span> : audioLoadingId === word.id ? <button className="speaker-btn" disabled aria-label="Loading audio"><Loader2 size={16} className="animate-spin" /></button> : <button className="speaker-btn" onClick={() => handlePlay(word.audio_url, word.id)} aria-label="Play audio"><Volume2 size={16} /></button>}
                      </div>
                      {pending && <div className="tile-meta"><span className="pending-pill"><Loader2 size={11} className="animate-spin" /> no audio</span></div>}
                      <div className={`tile-actions ${isOpen ? 'open' : ''}`}>
                        {!selectedGroup.is_default && <button className="btn-icon small danger" onClick={() => handleRemove(word.id)} title="Remove from group" disabled={removeWordMutation.isPending || audioLoadingId !== null}>{(removeWordMutation.isPending && removeWordMutation.variables?.wordId === word.id) ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}</button>}
                      </div>
                      <button className="more-btn" onClick={(e)=>{e.stopPropagation(); setOpenActionsId(isOpen?null:word.id);}} aria-label="More actions" aria-expanded={isOpen}><MoreHorizontal size={16} /></button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="empty-backpack"><Backpack size={28} /></div><h3>Wähle eine Gruppe</h3><p>Select a group above to see its words.</p></div>
        )}
      </div>

      {/* Create popup */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" onClick={() => setShowCreate(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card modal-narrow" onClick={e => e.stopPropagation()} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="modal-header"><h2>New group</h2><button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button></div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Create a new collection — z.B. “Uni Köln”, “Reise”.</p>
              <div className="input-group">
                <label className="input-label" htmlFor="new-group-input">Group name</label>
                <input id="new-group-input" type="text" className="text-input" placeholder="e.g. Numbers" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleCreate(); if (e.key==='Escape') setShowCreate(false); }} autoFocus disabled={createGroupMutation.isPending} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn-icon" style={{ width:'auto', padding:'0 0.9rem', borderRadius:'var(--radius-md)' }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-primary-style" onClick={handleCreate} disabled={createGroupMutation.isPending || !newGroupName.trim()}>{createGroupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {showEdit && editTarget && (
          <motion.div className="modal-overlay" onClick={() => setShowEdit(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card modal-narrow" onClick={e => e.stopPropagation()} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="modal-header"><h2>Edit group</h2><button className="btn-icon" onClick={() => setShowEdit(false)}><X size={18} /></button></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}><Layers size={14} /> {editTarget.name} · {editTarget.word_count} words</div>
              <div className="input-group">
                <label className="input-label" htmlFor="edit-group-input">Group name</label>
                <input id="edit-group-input" type="text" className="text-input" value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleRename(); if (e.key==='Escape') setShowEdit(false); }} autoFocus disabled={renameGroupMutation.isPending} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', flexWrap:'wrap' }}>
                <button className="btn-icon danger" style={{ width:'auto', padding:'0 0.9rem', borderRadius:'var(--radius-md)', borderColor:'var(--color-danger)' }} onClick={handleDelete} disabled={deleteGroupMutation.isPending}><Trash2 size={14} /> Delete group</button>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button className="btn-icon" style={{ width:'auto', padding:'0 0.9rem', borderRadius:'var(--radius-md)' }} onClick={() => setShowEdit(false)}>Cancel</button>
                  <button className="btn-primary-style" onClick={handleRename} disabled={renameGroupMutation.isPending || !editingName.trim()}>{renameGroupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAddWords && (
        <div className="modal-overlay" onClick={() => setShowAddWords(false)}>
          <motion.div className="modal-content card" onClick={e => e.stopPropagation()} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="modal-header"><h2>Add to {selectedGroup?.name}</h2><button className="btn-icon" onClick={() => setShowAddWords(false)}><X size={18} /></button></div>
            <div className="search-wrapper" style={{ marginBottom: '0.75rem' }}><Search size={14} className="search-icon" /><input type="text" className="search-input" placeholder="Search…" value={addWordsSearch} onChange={e => setAddWordsSearch(e.target.value)} autoFocus /></div>
            <div className="add-words-list">
              {wordsNotInGroup.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.2rem' }}><p>All words already in this group.</p><p className="hint">Nice — group is complete!</p></div>
              ) : wordsNotInGroup.map(w => (
                <div key={w.id} className="add-word-item">
                  <span style={{ fontSize: '0.9rem' }}><span className="flag" aria-hidden="true" title="English"><svg viewBox="0 0 60 30" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg></span> <strong>{w.english_word}</strong> <span style={{ color: 'var(--color-text-muted)' }}>↔ <span className="flag" aria-hidden="true" title="Deutsch"><svg viewBox="0 0 5 3" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg></span> {w.german_word}</span>{!w.audio_url && <span className="pending-pill" style={{ marginLeft: 6 }}><Loader2 size={10} className="animate-spin" /> pending</span>}</span>
                  <button className="btn-icon" onClick={() => handleAdd([w.id])} disabled={addWordsMutation.isPending} style={{ minWidth: 36 }}>{(addWordsMutation.isPending && JSON.stringify(addWordsMutation.variables?.wordIds) === JSON.stringify([w.id])) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}</button>
                </div>
              ))}
            </div>
            {wordsNotInGroup.length > 1 && <button className="btn-primary-style" onClick={() => handleAdd(wordsNotInGroup.map(w => w.id))} disabled={addWordsMutation.isPending} style={{ marginTop: '0.75rem' }}>{addWordsMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add All ({wordsNotInGroup.length})</button>}
          </motion.div>
        </div>
      )}
    </div>
  );
}
