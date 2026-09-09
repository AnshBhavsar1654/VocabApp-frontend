import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export default function Quiz() {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);

  // Quiz is random — staleTime:0 so it always refetches a fresh question when needed.
  // But we still benefit from caching the *current* question on tab switch (data stays visible).
  const {
    data: question,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quizNext'],
    queryFn: api.getQuizNext,
    staleTime: 0,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const checkMutation = useMutation({
    mutationFn: ({ id, prompt_lang, user_answer }) => api.checkQuiz(id, prompt_lang, user_answer),
    onSuccess: (res) => {
      setResult(res);
      if (res.correct) {
        playAudioWithBuffer(res.audio_url);
      }
    },
  });

  const loadNext = async () => {
    setResult(null);
    setAnswer('');
    await refetch();
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !question) return;
    checkMutation.mutate(
      { id: question.id, prompt_lang: question.prompt_lang, user_answer: answer }
    );
  };

  const playAudio = (url) => {
    playAudioWithBuffer(url);
  };

  // isLoading = true only on first load (no cache) → full skeleton
  if (isLoading) {
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
        <div className="status-msg error">{error.message}</div>
        <button onClick={loadNext} className="btn-primary" style={{ marginTop: '1rem' }}>Try Again</button>
      </div>
    );
  }

  // isFetching with cached data → keep question visible + small indicator
  const showUpdating = isFetching && !!question && !isLoading;

  return (
    <div className="card">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {showUpdating && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <Loader2 size={12} className="animate-spin" /> updating…
          </span>
        )}
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

      {checkMutation.error && !result && (
        <div className="status-msg error" style={{ marginBottom: '1rem' }}>{checkMutation.error.message}</div>
      )}

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
              disabled={checkMutation.isPending}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={checkMutation.isPending || !answer.trim()}>
            {checkMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
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
