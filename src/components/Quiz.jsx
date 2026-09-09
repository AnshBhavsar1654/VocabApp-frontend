import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { Volume2, Loader2, ArrowRight, CheckCircle, XCircle, Sparkles } from 'lucide-react';

function burstColors() { return ['#F5A623', '#15946A', '#2EDB8F', '#FFC84A']; }

export default function Quiz() {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const shouldReduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  const { data: question, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['quizNext'],
    queryFn: api.getQuizNext,
    staleTime: 0,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Persist quiz stats for header streak
  const bumpStreak = (correct) => {
    try {
      const raw = JSON.parse(localStorage.getItem('vocabapp-quiz-stats') || '{"correct":0,"streak":0,"total":0}');
      const next = { correct: raw.correct + (correct ? 1 : 0), total: raw.total + 1, streak: correct ? (raw.streak || 0) + 1 : 0 };
      localStorage.setItem('vocabapp-quiz-stats', JSON.stringify(next));
    } catch {}
  };

  const checkMutation = useMutation({
    mutationFn: ({ id, prompt_lang, user_answer }) => api.checkQuiz(id, prompt_lang, user_answer),
    onSuccess: (res) => {
      setResult(res);
      setFlipped(true);
      bumpStreak(res.correct);
      if (res.correct) {
        playAudioWithBuffer(res.audio_url);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 900);
      }
    },
  });

  const loadNext = async () => { setResult(null); setAnswer(''); setFlipped(false); await refetch(); };
  const handleCheck = (e) => {
    e.preventDefault();
    if (!answer.trim() || !question) return;
    checkMutation.mutate({ id: question.id, prompt_lang: question.prompt_lang, user_answer: answer });
  };

  const pendingAudio = question && !question.audio_url;

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: 12, width: '40%', margin: '0 auto 1rem' }} />
        <div className="skeleton" style={{ height: 56, width: '70%', margin: '0 auto 1.25rem', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-pill)' }} />
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="empty-backpack" style={{ marginBottom: '0.75rem' }}><Sparkles size={28} /></div>
        <h3 style={{ fontFamily: 'var(--font-display)' }}>Noch keine Karten</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error.message}</p>
        <p className="hint" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Add a few words first — then quiz starts.</p>
        <button onClick={loadNext} className="btn-primary" style={{ maxWidth: 220, margin: '0 auto' }}>Try Again</button>
      </div>
    );
  }

  const colors = burstColors();

  return (
    <div className="card quiz-flip" style={{ position: 'relative', overflow: showConfetti ? 'visible' : 'hidden' }}>
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && !shouldReduce && (
          <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                style={{ position: 'absolute', left: '50%', top: '45%', width: 8, height: 8, borderRadius: 999, background: colors[i % colors.length] }}
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{ x: (Math.cos((i / 8) * Math.PI * 2) * 80), y: (Math.sin((i / 8) * Math.PI * 2) * 70 - 20), scale: 1, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.015 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        {isFetching && !!question && !isLoading && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}><Loader2 size={12} className="animate-spin" /> updating…</span>}
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.25rem' }}>
          Translate to {question.prompt_lang === 'de' ? 'English' : 'German'}
        </p>

        {/* Flip card */}
        <motion.div
          style={{ perspective: 1000 }}
          animate={shouldReduce ? {} : { rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.1rem',
              fontWeight: 800,
              margin: '0.6rem 0',
              color: question.prompt_lang === 'de' ? 'var(--color-primary-strong)' : 'var(--color-text)',
              wordBreak: 'break-word',
              minHeight: 56,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span style={{ transform: flipped && !shouldReduce ? 'rotateY(180deg)' : 'none', display: 'inline-block' }}>
              {flipped && result && !result.correct ? result.correct_answer : question.prompt_word}
            </span>
          </div>
        </motion.div>

        {pendingAudio ? (
          <span className="pending-pill"><Loader2 size={12} className="animate-spin" /> audio generating…</span>
        ) : (
          <button className="play-large-btn" onClick={() => playAudioWithBuffer(question.audio_url)}><Volume2 size={16} /> Listen</button>
        )}
      </div>

      {checkMutation.error && !result && <div className="status-msg error" style={{ marginBottom: '0.75rem' }}>{checkMutation.error.message}</div>}

      {!result ? (
        <form onSubmit={handleCheck}>
          <div className="input-group">
            <input
              type="text"
              className="text-input"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your translation… ä ö ü ß"
              autoFocus
              disabled={checkMutation.isPending}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            />
          </div>
          <motion.button type="submit" className="btn-primary" disabled={checkMutation.isPending || !answer.trim()} whileTap={shouldReduce ? {} : { scale: 0.98 }}>
            {checkMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            Check Answer
          </motion.button>
        </form>
      ) : (
        <motion.div className={`quiz-result ${result.correct ? 'correct' : 'incorrect'}`} initial={shouldReduce ? false : { scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            {result.correct ? <CheckCircle size={40} color="var(--color-primary)" /> : <XCircle size={40} color="var(--color-danger)" />}
          </div>
          <h3>{result.correct ? 'Richtig! 🎉' : 'Fast — not quite'}</h3>
          {!result.correct && <p>The answer was: <strong>{result.correct_answer}</strong></p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {!pendingAudio && result.audio_url ? (
              <button className="play-large-btn" onClick={() => playAudioWithBuffer(result.audio_url)}><Volume2 size={16} /> Play Audio</button>
            ) : pendingAudio ? (
              <span className="pending-pill"><Loader2 size={12} className="animate-spin" /> audio pending</span>
            ) : null}
            <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={loadNext}>Next <ArrowRight size={16} /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
