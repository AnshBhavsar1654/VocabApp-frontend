import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { Layers, Plus, Trash2, Pencil, Check, X, Volume2, Search, Loader2, FolderOpen, Users, Backpack } from 'lucide-react';

export default function Groups() {
  const queryClient = useQueryClient();
  const shouldReduce = useReducedMotion();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showAddWords, setShowAddWords] = useState(false);
  const [addWordsSearch, setAddWordsSearch] = useState('');

  const { data: groups = [], isLoading, isFetching: groupsFetching, error: groupsError } = useQuery({ queryKey: ['groups'], queryFn: api.getGroups, staleTime: 60_000 });
  const { data: allWords = [] } = useQuery({ queryKey: ['words'], queryFn: api.getWords, staleTime: 60_000 });
  const { data: groupWordsData, isLoading: groupLoading, isFetching: groupFetching } = useQuery({
    queryKey: ['groupWords', selectedGroupId],
    queryFn: () => api.getGroupWords(selectedGroupId),
    enabled: !!selectedGroupId,
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

  const createGroupMutation = useMutation({ mutationFn: (name) => api.createGroup(name), onSuccess: (g) => { queryClient.invalidateQueries({ queryKey: ['groups'] }); setNewGroupName(''); setSelectedGroupId(g.id); } });
  const renameGroupMutation = useMutation({ mutationFn: ({ groupId, name }) => api.renameGroup(groupId, name), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); setEditingGroupId(null); } });
  const deleteGroupMutation = useMutation({
    mutationFn: (id) => api.deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] }); queryClient.invalidateQueries({ queryKey: ['groupWords'] });
      if (selectedGroupId === id) { const d = groups.find(g => g.is_default); setSelectedGroupId(d ? d.id : null); }
    },
  });
  const addWordsMutation = useMutation({ mutationFn: ({ groupId, wordIds }) => api.addWordsToGroup(groupId, wordIds), onSuccess: (_, { groupId }) => { queryClient.invalidateQueries({ queryKey: ['groupWords', groupId] }); queryClient.invalidateQueries({ queryKey: ['groups'] }); queryClient.invalidateQueries({ queryKey: ['words'] }); setShowAddWords(false); setAddWordsSearch(''); } });
  const removeWordMutation = useMutation({ mutationFn: ({ groupId, wordId }) => api.removeWordFromGroup(groupId, wordId), onSuccess: (_, { groupId }) => { queryClient.invalidateQueries({ queryKey: ['groupWords', groupId] }); queryClient.invalidateQueries({ queryKey: ['groups'] }); } });

  const handleCreate = () => { const n = newGroupName.trim(); if (!n) return alert('Enter a name'); createGroupMutation.mutate(n, { onError: e => alert(e.message) }); };
  const handleRename = (id) => { const n = editingName.trim(); if (!n) return; renameGroupMutation.mutate({ groupId: id, name: n }, { onError: e => alert(e.message) }); };
  const handleDelete = (id) => { if (!confirm('Delete group? Words move to Ungrouped.')) return; deleteGroupMutation.mutate(id, { onError: e => alert(e.message) }); };
  const handleAdd = (ids) => { if (!selectedGroupId || !ids.length) return; addWordsMutation.mutate({ groupId: selectedGroupId, wordIds: ids }, { onError: e => alert(e.message) }); };
  const handleRemove = (wid) => { if (!selectedGroupId) return; removeWordMutation.mutate({ groupId: selectedGroupId, wordId: wid }, { onError: e => alert(e.message) }); };

  if (isLoading) {
    return (
      <div className="card">
        {[1, 2, 3].map(i => <div key={i} className="skeleton-row"><div className="skeleton skeleton-text" /><div className="skeleton skeleton-icon" /></div>)}
      </div>
    );
  }

  return (
    <div className="groups-layout">
      <div className="groups-sidebar card">
        <div className="groups-sidebar-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Groups {groupsFetching && !isLoading && <Loader2 size={14} className="animate-spin" />}</h2>
        </div>
        <div className="group-create">
          <input type="text" className="text-input" placeholder="New group — z.B. Uni Köln" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} disabled={createGroupMutation.isPending} style={{ fontSize: '0.85rem', padding: '0.55rem 0.7rem' }} />
          <button className="btn-icon" onClick={handleCreate} disabled={createGroupMutation.isPending} style={{ minWidth: 38 }}>{createGroupMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}</button>
        </div>
        {error && <div className="status-msg error" style={{ fontSize: '0.82rem' }}>{error}</div>}
        <div className="group-list">
          {groups.map(g => (
            <div key={g.id} className={`group-item ${selectedGroupId === g.id ? 'active' : ''}`} onClick={() => !editingGroupId && setSelectedGroupId(g.id)}>
              {editingGroupId === g.id ? (
                <div className="group-item-edit">
                  <input type="text" className="text-input" value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRename(g.id); if (e.key === 'Escape') setEditingGroupId(null); }} autoFocus disabled={renameGroupMutation.isPending} style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem', flex: 1 }} />
                  <button className="btn-icon" onClick={() => handleRename(g.id)} disabled={renameGroupMutation.isPending} style={{ minWidth: 32, minHeight: 32 }}>{renameGroupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
                  <button className="btn-icon" onClick={() => setEditingGroupId(null)} style={{ minWidth: 32, minHeight: 32 }}><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div className="group-item-info">{g.is_default ? <FolderOpen size={14} /> : <Layers size={14} />}<span className="group-item-name">{g.name}</span><span className="group-item-count">{g.word_count}</span></div>
                  {!g.is_default && (
                    <div className="group-item-actions">
                      <button className="btn-icon" onClick={e => { e.stopPropagation(); setEditingGroupId(g.id); setEditingName(g.name); }} style={{ minWidth: 30, minHeight: 30 }}><Pencil size={13} /></button>
                      <button className="btn-icon danger" onClick={e => { e.stopPropagation(); handleDelete(g.id); }} style={{ minWidth: 30, minHeight: 30 }}><Trash2 size={13} /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="groups-panel card">
        {selectedGroup ? (
          <>
            <div className="groups-panel-header">
              <h2>{selectedGroup.is_default ? <FolderOpen size={18} /> : <Layers size={18} />}{selectedGroup.name}<span className="groups-panel-count">({groupWords.length})</span>{groupFetching && !groupLoading && <Loader2 size={14} className="animate-spin" />}</h2>
              <button className="btn-primary-style btn-sm" onClick={() => setShowAddWords(true)}><Plus size={14} /> Add Words</button>
            </div>
            {groupLoading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}><Loader2 size={22} className="animate-spin" /></div>
            ) : groupWords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-backpack"><Users size={28} /></div>
                <h3>Noch keine Wörter</h3>
                <p>This group is still empty — add a few to organize your trip.</p>
                <p className="hint">Words live in Ungrouped until you sort them.</p>
              </div>
            ) : (
              <div className="word-list">
                {groupWords.map((word, i) => {
                  const pending = !word.audio_url;
                  return (
                    <motion.div key={word.id} className="word-item" initial={shouldReduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: Math.min(i * 0.02, 0.1) }}>
                      <div className="word-item-content">
                        <span className="word-lang">{word.english_word}</span><span className="word-separator">↔</span><span className="word-lang german">{word.german_word}</span>
                        {pending && <span className="pending-pill"><Loader2 size={11} className="animate-spin" /> audio pending</span>}
                      </div>
                      <div className="word-actions">
                        {pending ? <span className="pending-pill" title="Audio generating"><Loader2 size={11} className="animate-spin" /> generating…</span> : <button className="btn-icon" onClick={() => playAudioWithBuffer(word.audio_url)} title="Play"><Volume2 size={16} /></button>}
                        {!selectedGroup.is_default && <button className="btn-icon danger" onClick={() => handleRemove(word.id)} title="Remove" disabled={removeWordMutation.isPending}><X size={16} /></button>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="empty-backpack"><Backpack size={28} /></div><h3>Wähle eine Gruppe</h3><p>Select a group on the left to see its words.</p></div>
        )}
      </div>

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
                  <span style={{ fontSize: '0.9rem' }}><strong>{w.english_word}</strong> <span style={{ color: 'var(--color-text-muted)' }}>↔ {w.german_word}</span>{!w.audio_url && <span className="pending-pill" style={{ marginLeft: 6 }}><Loader2 size={10} className="animate-spin" /> pending</span>}</span>
                  <button className="btn-icon" onClick={() => handleAdd([w.id])} disabled={addWordsMutation.isPending} style={{ minWidth: 36 }}>{addWordsMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}</button>
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
