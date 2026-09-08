import React, { useEffect, useState, useMemo } from 'react';
import { api, playAudioWithBuffer } from '../api';
import {
  Layers, Plus, Trash2, Pencil, Check, X, Volume2,
  Search, Loader2, FolderOpen, Users
} from 'lucide-react';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupWords, setGroupWords] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [showAddWords, setShowAddWords] = useState(false);
  const [addWordsSearch, setAddWordsSearch] = useState('');
  const [addingWords, setAddingWords] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getGroups();
      setGroups(data);
      if (!selectedGroupId && data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupWords = async (groupId) => {
    if (!groupId) return;
    setGroupLoading(true);
    try {
      const data = await api.getGroupWords(groupId);
      setGroupWords(data.words || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setGroupLoading(false);
    }
  };

  const fetchAllWords = async () => {
    try {
      const data = await api.getWords();
      setAllWords(data);
    } catch (err) {
      console.error('Failed to fetch words', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchAllWords();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupWords(selectedGroupId);
    }
  }, [selectedGroupId]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const wordsNotInGroup = useMemo(() => {
    const inGroupIds = new Set(groupWords.map(w => w.id));
    if (!addWordsSearch.trim()) return allWords.filter(w => !inGroupIds.has(w.id));
    const q = addWordsSearch.toLowerCase();
    return allWords.filter(w =>
      !inGroupIds.has(w.id) &&
      (w.english_word.toLowerCase().includes(q) || w.german_word.toLowerCase().includes(q))
    );
  }, [allWords, groupWords, addWordsSearch]);

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      alert('Please enter a group name.');
      return;
    }
    setCreating(true);
    try {
      const group = await api.createGroup(name);
      setGroups(prev => [...prev, group]);
      setNewGroupName('');
      setSelectedGroupId(group.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRenameGroup = async (groupId) => {
    const name = editingName.trim();
    if (!name) return;
    setRenaming(true);
    try {
      const updated = await api.renameGroup(groupId, name);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: updated.name } : g));
      setEditingGroupId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this group? Words will be moved to Ungrouped.')) return;
    try {
      await api.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroupId === groupId) {
        const defaultGroup = groups.find(g => g.is_default);
        setSelectedGroupId(defaultGroup ? defaultGroup.id : null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddWords = async (wordIds) => {
    if (!selectedGroupId || wordIds.length === 0) return;
    setAddingWords(true);
    try {
      await api.addWordsToGroup(selectedGroupId, wordIds);
      await fetchGroupWords(selectedGroupId);
      await fetchGroups();
      setShowAddWords(false);
      setAddWordsSearch('');
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingWords(false);
    }
  };

  const handleRemoveWord = async (wordId) => {
    if (!selectedGroupId) return;
    try {
      await api.removeWordFromGroup(selectedGroupId, wordId);
      setGroupWords(prev => prev.filter(w => w.id !== wordId));
      await fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  if (loading) {
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
          <h2>Groups</h2>
        </div>

        <div className="group-create">
          <input
            type="text"
            className="text-input"
            placeholder="New group name..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
            disabled={creating}
            style={{ fontSize: '0.85rem', padding: '0.6rem 0.75rem' }}
          />
          <button
            className="btn-icon"
            onClick={handleCreateGroup}
            disabled={creating}
            title="Create group"
            style={{ color: 'var(--success-color)', minWidth: 36, minHeight: 36 }}
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
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
                    disabled={renaming}
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem', flex: 1 }}
                  />
                  <button
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); handleRenameGroup(group.id); }}
                    disabled={renaming}
                    style={{ color: 'var(--success-color)', minWidth: 28, minHeight: 28 }}
                  >
                    {renaming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }}
                    disabled={renaming}
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
              </h2>
              <button
                className="btn-primary-style btn-sm"
                onClick={() => { setShowAddWords(true); fetchAllWords(); }}
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

      {/* Add Words Modal */}
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
                      disabled={addingWords}
                      title="Add to group"
                      style={{ color: 'var(--success-color)' }}
                    >
                      {addingWords ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    </button>
                  </div>
                ))
              )}
            </div>

            {wordsNotInGroup.length > 1 && (
              <button
                className="btn-primary-style"
                onClick={() => handleAddWords(wordsNotInGroup.map(w => w.id))}
                disabled={addingWords}
                style={{ marginTop: '1rem' }}
              >
                {addingWords ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add All ({wordsNotInGroup.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
