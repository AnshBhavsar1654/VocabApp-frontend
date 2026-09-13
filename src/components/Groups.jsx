import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useSensors, useSensor, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, arrayMove,
  sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api, playAudioWithBuffer } from '../api';
import { friendlyError } from '../lib/errors';
import { Layers, Plus, Trash2, Pencil, Check, X, Volume2, Search, Loader2, FolderOpen, Users, Backpack, MoreHorizontal, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// A single draggable word card. The dnd-kit `listeners` live only on the grip
// handle, so speaker / remove / menu buttons keep working and page scroll
// stays usable on touch devices. Enter animation is opacity-only on purpose:
// dnd-kit owns the transform, and a transform animation would fight it.
function SortableWordCard({
  word, pending,
  audioLoading, audioDisabled, onPlay,
  showRemove, removing, removeDisabled, onRemove,
  actionsOpen, onToggleActions,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: word.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`word-tile${isDragging ? ' is-dragging' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isDragging ? 0.35 : 1 }}
      transition={{ duration: 0.16 }}
    >
      <div className="tile-top">
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          aria-label={`Drag ${word.english_word} to reorder`}
        >
          <GripVertical size={15} />
        </button>
        <div className="tile-pair">
          <span className="word-lang"><span className="flag" aria-hidden="true" title="English"><svg viewBox="0 0 60 30" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg></span> {word.english_word}</span>
          <span className="word-separator">↔</span>
          <span className="word-lang german"><span className="flag" aria-hidden="true" title="Deutsch"><svg viewBox="0 0 5 3" width="18" height="11" style={{borderRadius:2, flexShrink:0, border:'1px solid var(--color-border)', display:'inline-block', verticalAlign:'middle'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg></span> {word.german_word}</span>
        </div>
        {pending ? <span className="pending-pill small" title="Audio generating"><Loader2 size={11} className="animate-spin" /></span> : audioLoading ? <button className="speaker-btn" disabled aria-label="Loading audio"><Loader2 size={16} className="animate-spin" /></button> : <button className="speaker-btn" onClick={onPlay} aria-label="Play audio" disabled={audioDisabled}><Volume2 size={16} /></button>}
      </div>
      {pending && <div className="tile-meta"><span className="pending-pill"><Loader2 size={11} className="animate-spin" /> no audio</span></div>}
      <div className={`tile-actions ${actionsOpen ? 'open' : ''}`}>
        {showRemove && <button className="btn-icon small danger" onClick={onRemove} title="Remove from group" disabled={removeDisabled}>{removing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}</button>}
      </div>
      <button className="more-btn" onClick={(e)=>{e.stopPropagation(); onToggleActions();}} aria-label="More actions" aria-expanded={actionsOpen}><MoreHorizontal size={16} /></button>
    </motion.div>
  );
}

export default function Groups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showAddWords, setShowAddWords] = useState(false);
  const [addWordsSearch, setAddWordsSearch] = useState('');

  // Dialog visibility state.
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: groups = [], isLoading, isFetching: groupsFetching, error: groupsError } = useQuery({ queryKey: ['groups', user?.id], queryFn: api.getGroups, staleTime: 60_000, enabled: !!user });
  const { data: allWords = [] } = useQuery({ queryKey: ['words', user?.id], queryFn: api.getWords, staleTime: 60_000, enabled: !!user });
  const { data: groupWordsData, isLoading: groupLoading, isFetching: groupFetching } = useQuery({
    queryKey: ['groupWords', user?.id, selectedGroupId],
    queryFn: () => api.getGroupWords(selectedGroupId),
    enabled: !!selectedGroupId && !!user,
    staleTime: 60_000,
  });
  const groupWords = useMemo(() => groupWordsData?.words ?? [], [groupWordsData]);

  React.useEffect(() => { if (!selectedGroupId && groups.length > 0) setSelectedGroupId(groups[0].id); }, [groups, selectedGroupId]);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const error = groupsError ? friendlyError(groupsError, "Couldn't load your groups. Please check your connection and try again.") : null;

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

  // Manual card order (drag-to-reorder). The override holds the latest
  // drag result per group; it wins over the server list until the group
  // changes or a save fails (then we roll back to server order).
  const [orderOverride, setOrderOverride] = useState(null); // { groupId, ids }
  const [activeId, setActiveId] = useState(null);
  const saveTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(saveTimer.current), []);
  // No reset effect needed: orderedWords ignores overrides whose groupId
  // doesn't match the selected group, and the next drag overwrites them.

  const orderedWords = useMemo(() => {
    if (!orderOverride || orderOverride.groupId !== selectedGroupId) return groupWords;
    const byId = new Map(groupWords.map(w => [w.id, w]));
    const seen = new Set();
    const ordered = [];
    for (const id of orderOverride.ids) {
      const w = byId.get(id);
      if (w) { ordered.push(w); seen.add(id); }
    }
    // Words added since the last reorder go at the end, in server order.
    for (const w of groupWords) if (!seen.has(w.id)) ordered.push(w);
    return ordered;
  }, [groupWords, orderOverride, selectedGroupId]);

  const orderMutation = useMutation({
    mutationFn: ({ groupId, wordIds }) => api.setGroupWordOrder(groupId, wordIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groupWords', user?.id, groupId] });
    },
    onError: (err) => {
      setOrderOverride(null);
      setActionError(friendlyError(err, "Couldn't save the new order. Please try again."));
    },
  });

  const handleReorder = (newIds) => {
    if (!selectedGroupId) return;
    setOrderOverride({ groupId: selectedGroupId, ids: newIds });
    // Debounced autosave — one PATCH per completed drag, not per movement.
    clearTimeout(saveTimer.current);
    const gid = selectedGroupId;
    saveTimer.current = setTimeout(() => {
      orderMutation.mutate({ groupId: gid, wordIds: newIds });
    }, 600);
  };

  // Grid-aware drag sensors: mouse drags start after a small movement (so
  // button clicks still work), touch drags after a long-press (so page
  // scroll still works), plus full keyboard support.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !selectedGroupId || active.id === over.id) return;
    const ids = orderedWords.map(w => w.id);
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from < 0 || to < 0) return;
    handleReorder(arrayMove(ids, from, to));
  };

  const handleCreate = () => { const n = newGroupName.trim(); if (!n) return; setActionError(null); createGroupMutation.mutate(n, { onError: e => setActionError(friendlyError(e, "Couldn't create that group. Please try again.")) }); };
  const handleRename = () => { const n = editingName.trim(); if (!n || !editTarget) return; setActionError(null); renameGroupMutation.mutate({ groupId: editTarget.id, name: n }, { onError: e => setActionError(friendlyError(e, "Couldn't rename that group. Please try again.")) }); };
  const handleDelete = () => {
    if (!editTarget) return;
    if (!confirmingDelete) {
      // Two-step confirmation: first click arms, second click executes.
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    setActionError(null);
    deleteGroupMutation.mutate(editTarget.id, { onError: e => setActionError(friendlyError(e, "Couldn't delete that group. Please try again.")) });
  };
  const handleAdd = (ids) => { if (!selectedGroupId || !ids.length) return; setActionError(null); addWordsMutation.mutate({ groupId: selectedGroupId, wordIds: ids }, { onError: e => setActionError(friendlyError(e, "Couldn't add those words. Please try again.")) }); };
  const handleRemove = (wid) => { if (!selectedGroupId) return; setActionError(null); removeWordMutation.mutate({ groupId: selectedGroupId, wordId: wid }, { onError: e => setActionError(friendlyError(e, "Couldn't remove that word. Please try again.")) }); };
  const handlePlay = async (url, id) => { if (!url || audioLoadingId) return; setAudioLoadingId(id); try { await playAudioWithBuffer(url); } catch (e) { console.warn('Audio failed', e); } finally { setAudioLoadingId(null); } };

  React.useEffect(() => {
    if (showEdit) return;
    setConfirmingDelete(false);
  }, [showEdit]);

  React.useEffect(() => {
    if (!showAddWords) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowAddWords(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showAddWords]);

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
    // Selection feedback is handled by the motion animation. The edit dialog
    // opens only on a second click for custom groups (handled above); the
    // first click selects without opening a dialog.
    if (g.is_default) return;
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
      {/* Group selection strip */}
      <div className="groups-strip-wrapper card">
        <div className="groups-strip-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Groups {groupsFetching && !isLoading && <Loader2 size={14} className="animate-spin" />}</h2>
          <button className="btn-primary-style btn-sm" onClick={() => { setNewGroupName(''); setShowCreate(true); }}><Plus size={14} /> New group</button>
        </div>
        {error && <div className="status-msg error" style={{ fontSize: '0.82rem', marginBottom: '0.6rem' }}>{error}</div>}
        {actionError && (
          <div className="status-msg error" style={{ fontSize: '0.82rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ flex: 1 }}>{actionError}</span>
            <button className="btn-icon small" onClick={() => setActionError(null)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}
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
        <p className="groups-strip-hint">Tap a group to open its cards · Tap again on a custom group to edit</p>
      </div>

      <div className="groups-panel card">
        {selectedGroup ? (
          <>
            <div className="groups-panel-header">
              <h2>{selectedGroup.is_default ? <FolderOpen size={18} /> : <Layers size={18} />}{selectedGroup.name}<span className="groups-panel-count">({groupWords.length})</span>{(groupFetching && !groupLoading) || orderMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}</h2>
              <button className="btn-primary-style btn-sm" onClick={() => setShowAddWords(true)}><Plus size={14} /> Add Words</button>
            </div>
            <p className="groups-reorder-hint"><GripVertical size={12} /> Drag the grip to reorder — saved automatically</p>
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
                <p>No flashcards here yet — add a few to build this pile.</p>
                <p className="hint">Cards live in Ungrouped until you sort them.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(e) => setActiveId(e.active.id)}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
              >
                <SortableContext items={orderedWords.map(w => w.id)} strategy={rectSortingStrategy}>
                  <div className="word-grid" aria-label={`${selectedGroup.name} words, drag the grip to reorder`}>
                    {orderedWords.map((word) => {
                      const pending = !word.audio_url;
                      const isOpen = openActionsId === word.id;
                      return (
                        <SortableWordCard
                          key={word.id}
                          word={word}
                          pending={pending}
                          audioLoading={audioLoadingId === word.id}
                          audioDisabled={audioLoadingId !== null}
                          onPlay={() => handlePlay(word.audio_url, word.id)}
                          showRemove={!selectedGroup.is_default}
                          removing={removeWordMutation.isPending && removeWordMutation.variables?.wordId === word.id}
                          removeDisabled={removeWordMutation.isPending || audioLoadingId !== null}
                          onRemove={() => handleRemove(word.id)}
                          actionsOpen={isOpen}
                          onToggleActions={() => setOpenActionsId(isOpen ? null : word.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId ? (() => {
                    const word = orderedWords.find(w => w.id === activeId);
                    if (!word) return null;
                    return (
                      <div className="word-tile is-dragging" aria-hidden="true">
                        <div className="tile-top">
                          <span className="drag-handle"><GripVertical size={15} /></span>
                          <div className="tile-pair">
                            <span className="word-lang">{word.english_word}</span>
                            <span className="word-separator">↔</span>
                            <span className="word-lang german">{word.german_word}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })() : null}
                </DragOverlay>
              </DndContext>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="empty-backpack"><Backpack size={28} /></div><h3>Wähle eine Gruppe</h3><p>Select a group above to see its words.</p></div>
        )}
      </div>

      {/* Create-group dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" onClick={() => setShowCreate(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card modal-narrow" role="dialog" aria-modal="true" aria-label="Create new group" onClick={e => e.stopPropagation()} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
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

      {/* Edit-group dialog */}
      <AnimatePresence>
        {showEdit && editTarget && (
          <motion.div className="modal-overlay" onClick={() => setShowEdit(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card modal-narrow" role="dialog" aria-modal="true" aria-label={`Edit group ${editTarget.name}`} onClick={e => e.stopPropagation()} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="modal-header"><h2>Edit group</h2><button className="btn-icon" onClick={() => setShowEdit(false)}><X size={18} /></button></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}><Layers size={14} /> {editTarget.name} · {editTarget.word_count} words</div>
              <div className="input-group">
                <label className="input-label" htmlFor="edit-group-input">Group name</label>
                <input id="edit-group-input" type="text" className="text-input" value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleRename(); if (e.key==='Escape') setShowEdit(false); }} autoFocus disabled={renameGroupMutation.isPending} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', flexWrap:'wrap' }}>
                <button className={`btn-icon danger ${confirmingDelete ? 'btn-danger-armed' : ''}`} style={{ width:'auto', padding:'0 0.9rem', borderRadius:'var(--radius-md)', borderColor:'var(--color-danger)' }} onClick={handleDelete} disabled={deleteGroupMutation.isPending} title={confirmingDelete ? 'Click again to permanently delete this group' : 'Delete this group'}>{deleteGroupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {confirmingDelete ? 'Confirm delete' : 'Delete group'}</button>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button className="btn-icon" style={{ width:'auto', padding:'0 0.9rem', borderRadius:'var(--radius-md)' }} onClick={() => setShowEdit(false)}>Cancel</button>
                  <button className="btn-primary-style" onClick={handleRename} disabled={renameGroupMutation.isPending || !editingName.trim()}>{renameGroupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {showAddWords && (
        <motion.div className="modal-overlay" onClick={() => setShowAddWords(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content card" role="dialog" aria-modal="true" aria-label={`Add words to ${selectedGroup?.name || 'group'}`} onClick={e => e.stopPropagation()} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="modal-header"><h2>Add to {selectedGroup?.name}</h2><button className="btn-icon" onClick={() => setShowAddWords(false)} aria-label="Close"><X size={18} /></button></div>
            <div className="search-wrapper" style={{ marginBottom: '0.75rem' }}><Search size={14} className="search-icon" /><input type="text" className="search-input" placeholder="Search…" aria-label="Search words to add" value={addWordsSearch} onChange={e => setAddWordsSearch(e.target.value)} autoFocus /></div>
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
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
