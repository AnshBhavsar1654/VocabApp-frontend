import React, { useState } from 'react';
import AddWordForm from './components/AddWordForm';
import WordList from './components/WordList';
import Quiz from './components/Quiz';

function App() {
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list', 'quiz'

  return (
    <div className="app-container">
      <header className="header">
        <h1>German Vocab App</h1>
        <p>Learn German vocabulary effectively.</p>
      </header>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Word
        </button>
        <button 
          className={`nav-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          My Words
        </button>
        <button 
          className={`nav-tab ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          Quiz
        </button>
      </nav>

      <main>
        {activeTab === 'add' && <AddWordForm />}
        {activeTab === 'list' && <WordList />}
        {activeTab === 'quiz' && <Quiz />}
      </main>
    </div>
  );
}

export default App;
