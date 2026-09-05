import React, { useState, useEffect } from 'react';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export default function Quiz() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [answer, setAnswer] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const loadNext = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswer('');

    try {
      const data = await api.getQuizNext();
      setQuestion(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNext();
  }, []);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setChecking(true);
    try {
      const res = await api.checkQuiz(question.id, question.prompt_lang, answer);
      setResult(res);
      if (res.correct) {
        playAudioWithBuffer(res.audio_url);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: '1rem', width: '40%', margin: '0 auto 1rem' }} />
        <div className="skeleton" style={{ height: '3rem', width: '60%', margin: '0 auto 2rem', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '12px', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: '12px' }} />
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="card">
        <div className="status-msg error">{error}</div>
        <button onClick={loadNext} className="btn-primary" style={{ marginTop: '1rem' }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Translate this to {question.prompt_lang === 'de' ? 'English' : 'German'}
        </p>
        <h2 className="quiz-prompt-text" style={{ fontSize: '2.5rem', margin: '0.75rem 0', color: question.prompt_lang === 'de' ? '#a78bfa' : 'var(--text-primary)', fontWeight: 700, wordBreak: 'break-word' }}>
          {question.prompt_word}
        </h2>
        <button className="play-large-btn" onClick={() => playAudio(question.audio_url)} style={{ marginTop: '0.5rem' }}>
          <Volume2 size={18} /> Listen
        </button>
      </div>

      {!result ? (
        <form onSubmit={handleCheck}>
          <div className="input-group">
            <input
              type="text"
              className="text-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your translation..."
              autoFocus
              disabled={checking}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={checking || !answer.trim()}>
            {checking ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            Check Answer
          </button>
        </form>
      ) : (
        <div className={`quiz-result ${result.correct ? 'correct' : 'incorrect'}`}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            {result.correct ? (
              <CheckCircle size={44} color="#6ee7b7" />
            ) : (
              <XCircle size={44} color="#fca5a5" />
            )}
          </div>

          <h3>{result.correct ? 'Correct!' : 'Incorrect'}</h3>

          {!result.correct && (
            <p>
              The correct answer was: <strong>{result.correct_answer}</strong>
            </p>
          )}

          <div className="quiz-actions" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="play-large-btn" onClick={() => playAudio(result.audio_url)}>
              <Volume2 size={18} /> Play Audio
            </button>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.7rem 1.5rem' }} onClick={loadNext}>
              Next Question <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
