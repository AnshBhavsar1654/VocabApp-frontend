import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, playAudioWithBuffer } from '../api';
import {
  Layers, Plus, Trash2, Pencil, Check, X, Volume2,
  Search, Loader2, FolderOpen, Users
} from 'lucide-react';

export default function Groups() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const [showAddWords, setShowAddWords] = useState(false);
  const [addWordsSearch, setAddWordsSearch] = useState('');

  // ['groups'] and ['words'] are stable keys with 60s staleTime — tab switches use cache instantly.
  const {
    data: groups = [],
    isLoading,
    isFetching: groupsFetching,
    error: groupsError,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: api.getGroups,
    staleTime: 60_000,
  });

  // Reuse already-cached ['words'] query — no separate fetch in modal.
  const { data: allWords = [] } = useQuery({
    queryKey: ['words'],
    queryFn: api.getWords,
    staleTime: 60_000,
  });

  const {
    data: groupWordsData,
    isLoading: groupLoading,
    isFetching: groupFetching,
  } = useQuery({
    queryKey: ['groupWords', selectedGroupId],
    queryFn: () => api.getGroupWords(selectedGroupId),
    enabled: !!selectedGroupId,
    staleTime: 60_000,
  });

  const groupWords = groupWordsData?.words || [];

  // Auto-select first group once groups load (mirrors old fetchGroups logic)
  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const error = groupsError?.message || null;

  const wordsNotInGroup = useMemo(() => {
    const inGroupIds = new Set(groupWords.map(w => w.id));
    if (!addWordsSearch.trim()) return allWords.filter(w => !inGroupIds.has(w.id));
    const q = addWordsSearch.toLowerCase();
    return allWords.filter(w =>
      !inGroupIds.has(w.id) &&
      (w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q))
    );
  }, [allWords, groupWords, addWordsSearch]);

  const createGroupMutation = useMutation({
    mutationFn: (name) => api.createGroup(name),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewGroupName('');
      setSelectedGroupId(group.id);
    },
  });

  const renameGroupMutation = useMutation({
    mutationFn: ({ groupId, name }) => api.renameGroup(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setEditingGroupId(null);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId) => api.deleteGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groupWords'] });
      if (selectedGroupId === groupId) {
        const defaultGroup = groups.find(g => g.is_default);
        setSelectedGroupId(defaultGroup ? defaultGroup.id : null);
      }
    },
  });

  const addWordsMutation = useMutation({
    mutationFn: ({ groupId, wordIds }) => api.addWordsToGroup(groupId, wordIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groupWords', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      setShowAddWords(false);
      setAddWordsSearch('');
    },
  });

  const removeWordMutation = useMutation({
    mutationFn: ({ groupId, wordId }) => api.removeWordFromGroup(groupId, wordId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groupWords', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
    },
  });

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) {
      alert('Please enter a group name.');
      return;
    }
    createGroupMutation.mutate(name, {
      onError: (err) => alert(err.message),
    });
  };

  const handleRenameGroup = (groupId) => {
    const name = editingName.trim();
    if (!name) return;
    renameGroupMutation.mutate(
      { groupId, name },
      { onError: (err) => alert(err.message) }
    );
  };

  const handleDeleteGroup = (groupId) => {
    if (!confirm('Delete this group? Words will be moved to Ungrouped.')) return;
    deleteGroupMutation.mutate(groupId, {
      onError: (err) => alert(err.message),
    });
  };

  const handleAddWords = (wordIds) => {
    if (!selectedGroupId || wordIds.length === 0) return;
    addWordsMutation.mutate(
      { groupId: selectedGroupId, wordIds },
      { onError: (err) => alert(err.message) }
    );
  };

  const handleRemoveWord = (wordId) => {
    if (!selectedGroupId) return;
    removeWordMutation.mutate(
      { groupId: selectedGroupId, wordId },
      { onError: (err) => alert(err.message) }
    );
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  // isLoading = true only on first load (no cache) → full skeleton
  if (isLoading) {
    return (
      <div className="card">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-text" style={{ maxWidth: '40%' }} />
            <div className="skeleton skeleton-text" style={{ maxWidth: '20%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="groups-layout">
      {/* Sidebar - Group List */}
      <div className="groups-sidebar card">
        <div className="groups-sidebar-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Groups
            {groupsFetching && !isLoading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />}
          </h2>
        </div>

        <div className="group-create">
          <input
            type="text"
            className="text-input"
            placeholder="New group name..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
            disabled={createGroupMutation.isPending}
            style={{ fontSize: '0.85rem', padding: '0.6rem 0.75rem' }}
          />
          <button
            className="btn-icon"
            onClick={handleCreateGroup}
            disabled={createGroupMutation.isPending}
            title="Create group"
            style={{ color: 'var(--success-color)', minWidth: 36, minHeight: 36 }}
          >
            {createGroupMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </div>

        {error && <div className="status-msg error" style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>{error}</div>}

        <div className="group-list">
          {groups.map(group => (
            <div
              key={group.id}
              className={`group-item ${selectedGroupId === group.id ? 'active' : ''}`}
              onClick={() => !editingGroupId && setSelectedGroupId(group.id)}
            >
              {editingGroupId === group.id ? (
                <div className="group-item-edit">
                  <input
                    type="text"
                    className="text-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameGroup(group.id);
                      if (e.key === 'Escape') setEditingGroupId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    disabled={renameGroupMutation.isPending}
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem', flex: 1 }}
                  />
                  <button
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); handleRenameGroup(group.id); }}
                    disabled={renameGroupMutation.isPending}
                    style={{ color: 'var(--success-color)', minWidth: 28, minHeight: 28 }}
                  >
                    {renameGroupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }}
                    disabled={renameGroupMutation.isPending}
                    style={{ minWidth: 28, minHeight: 28 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="group-item-info">
                    {group.is_default ? <FolderOpen size={16} /> : <Layers size={16} />}
                    <span className="group-item-name">{group.name}</span>
                    <span className="group-item-count">{group.word_count}</span>
                  </div>
                  {!group.is_default && (
                    <div className="group-item-actions">
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroupId(group.id);
                          setEditingName(group.name);
                        }}
                        title="Rename"
                        style={{ minWidth: 28, minHeight: 28 }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                        title="Delete"
                        style={{ minWidth: 28, minHeight: 28 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Group Words */}
      <div className="groups-panel card">
        {selectedGroup ? (
          <>
            <div className="groups-panel-header">
              <h2>
                {selectedGroup.is_default ? <FolderOpen size={20} /> : <Layers size={20} />}
                {selectedGroup.name}
                <span className="groups-panel-count">({groupWords.length})</span>
                {groupFetching && !groupLoading && <Loader2 size={14} className="animate-spin" style={{ marginLeft: '0.4rem', color: 'var(--text-secondary)' }} />}
              </h2>
              <button
                className="btn-primary-style btn-sm"
                onClick={() => setShowAddWords(true)}
              >
                <Plus size={16} />
                Add Words
              </button>
            </div>

            {groupLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : groupWords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Users size={40} />
                </div>
                <p>No words in this group yet.</p>
                <p className="hint">Click "Add Words" to get started.</p>
              </div>
            ) : (
              <div className="word-list">
                {groupWords.map(word => (
                  <div key={word.id} className="word-item">
                    <div className="word-item-content">
                      <span className="word-lang">{word.english_word}</span>
                      <span className="word-separator">&#8596;</span>
                      <span className="word-lang german">{word.german_word}</span>
                    </div>
                    <div className="word-actions">
                      <button className="btn-icon" onClick={() => playAudio(word.audio_url)} title="Play Audio">
                        <Volume2 size={18} />
                      </button>
                      {!selectedGroup.is_default && (
                        <button
                          className="btn-icon danger"
                          onClick={() => handleRemoveWord(word.id)}
                          title="Remove from group"
                          disabled={removeWordMutation.isPending}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Layers size={48} />
            </div>
            <p>Select a group to view its words.</p>
          </div>
        )}
      </div>

      {/* Add Words Modal — reads from already-cached ['words'], no separate fetch */}
      {showAddWords && (
        <div className="modal-overlay" onClick={() => setShowAddWords(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Words to {selectedGroup?.name}</h2>
              <button className="btn-icon" onClick={() => setShowAddWords(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="search-wrapper" style={{ marginBottom: '1rem' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search words..."
                value={addWordsSearch}
                onChange={(e) => setAddWordsSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="add-words-list">
              {wordsNotInGroup.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <p>All words are already in this group.</p>
                </div>
              ) : (
                wordsNotInGroup.map(word => (
                  <div key={word.id} className="add-word-item">
                    <div className="word-item-content">
                      <span className="word-lang">{word.english_word}</span>
                      <span className="word-separator">&#8596;</span>
                      <span className="word-lang german">{word.german_word}</span>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => handleAddWords([word.id])}
                      disabled={addWordsMutation.isPending}
                      title="Add to group"
                      style={{ color: 'var(--success-color)' }}
                    >
                      {addWordsMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    </button>
                  </div>
                ))
              )}
            </div>

            {wordsNotInGroup.length > 1 && (
              <button
                className="btn-primary-style"
                onClick={() => handleAddWords(wordsNotInGroup.map(w => w.id))}
                disabled={addWordsMutation.isPending}
                style={{ marginTop: '1rem' }}
              >
                {addWordsMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add All ({wordsNotInGroup.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
