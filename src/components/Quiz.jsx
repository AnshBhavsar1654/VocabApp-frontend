import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, playAudioWithBuffer } from '../api';
import { friendlyError } from '../lib/errors';
import { Volume2, Loader2, ArrowRight, CheckCircle, XCircle, Sparkles, Keyboard, RotateCcw, BookOpen, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WordBadge from './WordBadge';

function burstColors() { return ['#F5A623', '#15946A', '#2EDB8F', '#FFC84A']; }

export default function Quiz({ onExit, onNeedWords }) {
  const { user } = useAuth();
  const shouldReduce = useReducedMotion();
  const [sessionSize, setSessionSize] = useState(10);
  const [session, setSession] = useState(null); // Shape: { questions: [], size: number }.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]); // Per-question outcomes: { correct: boolean, typed: string }.
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [feedbackAnim, setFeedbackAnim] = useState(null); // Feedback state: "correct" | "incorrect".
  const [sessionError, setSessionError] = useState(null);
  const inputRef = useRef(null);

  // Word count for the minimum-size guard (served from the shared words cache).
  const { data: words = [] } = useQuery({ queryKey: ['words', user?.id], queryFn: api.getWords, staleTime: 60_000, enabled: !!user });
  const wordsCount = words.length;
  const colors = burstColors();

  const currentQuestion = session?.questions?.[currentIndex] || null;
  const isLast = session ? currentIndex === session.size - 1 : false;
  const progress = session ? ((currentIndex + (result ? 1 : 0)) / session.size) * 100 : 0;

  const bumpStreak = (correct) => {
    try {
      const raw = JSON.parse(localStorage.getItem('vocabapp-quiz-stats') || '{"correct":0,"streak":0,"total":0}');
      const next = { correct: raw.correct + (correct ? 1 : 0), total: raw.total + 1, streak: correct ? (raw.streak || 0) + 1 : 0 };
      localStorage.setItem('vocabapp-quiz-stats', JSON.stringify(next));
    } catch {}
  };

  const checkMutation = useMutation({
    mutationFn: ({ id, prompt_lang, user_answer }) => api.checkQuiz(id, prompt_lang, user_answer),
    onSuccess: async (res) => {
      setResult(res);
      setFlipped(true);
      const isCorrect = res.correct;
      setFeedbackAnim(isCorrect ? 'correct' : 'incorrect');
      setTimeout(() => setFeedbackAnim(null), 600);
      bumpStreak(isCorrect);
      // Record the typed answer immediately; self-assessment follows separately.
      try { await api.recordQuizResult({ word_id: currentQuestion.id, is_correct: isCorrect, self_assessment: null, typed_answer: answer, prompt_lang: currentQuestion.prompt_lang }); } catch {}
      if (isCorrect && res.audio_url) {
        setAudioLoading(true);
        try { await playAudioWithBuffer(res.audio_url); } catch {} finally { setAudioLoading(false); }
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 900);
      }
    },
  });

  const startSession = async () => {
    const size = Math.min(20, Math.max(1, parseInt(sessionSize, 10) || 10));
    if (size > 20) return;
    if (wordsCount < 10) return;
    setSessionLoading(true);
    setSessionError(null);
    try {
      const data = await api.getQuizSession(size);
      setSession(data);
      setCurrentIndex(0);
      setResults([]);
      setResult(null);
      setFlipped(false);
      setAnswer('');
      setFeedbackAnim(null);
    } catch (e) {
      setSessionError(friendlyError(e, "Couldn't start the quiz session. Please try again."));
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!answer.trim() || !currentQuestion || checkMutation.isPending) return;
    checkMutation.mutate({ id: currentQuestion.id, prompt_lang: currentQuestion.prompt_lang, user_answer: answer });
  };

  const handleNextFromResult = () => {
    if (!results[currentIndex]) {
      const isCorrect = result?.correct;
      const nextResults = [...results];
      nextResults[currentIndex] = { correct: isCorrect, typed: answer };
      setResults(nextResults);
      if (isLast) return;
    }
    if (isLast) return;
    setCurrentIndex(i => i + 1);
    setResult(null);
    setFlipped(false);
    setAnswer('');
    setFeedbackAnim(null);
  };

  const handlePlay = async (url) => {
    if (!url || audioLoading) return;
    setAudioLoading(true);
    try { await playAudioWithBuffer(url); } catch {} finally { setAudioLoading(false); }
  };

  const handleFlip = useCallback(() => {
    if (!currentQuestion || checkMutation.isPending) return;
    // Space input while typing is preserved by the keydown guard below.
    setFlipped(v => !v);
  }, [currentQuestion, checkMutation.isPending]);

  // Keyboard shortcuts: Space reveals the card or replays audio, Enter submits
  // the answer or advances. The visible hint below reflects these bindings.
  useEffect(() => {
    const onKey = (e) => {
      if (!session) return;
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.code === 'Space') {
        if (isTyping && !result && !flipped) return;
        e.preventDefault();
        if (!flipped && !result) handleFlip();
        else if (currentQuestion?.audio_url) handlePlay(currentQuestion.audio_url);
      }
      if (e.key === 'Enter') {
        if (!result && answer.trim()) { e.preventDefault(); handleCheck(e); }
        else if (result) { e.preventDefault(); handleNextFromResult(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, flipped, result, answer, currentQuestion]);

  const sessionDone = session && results.length === session.size && results.every(r => r !== undefined);
  const correctCount = results.filter(r => r?.correct).length;

  // Guard: a session requires a minimum vocabulary of 10 words.
  if (wordsCount < 10) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="empty-backpack" style={{ marginBottom: '0.75rem' }}><BookOpen size={28} /></div>
        <h3 style={{ fontFamily: 'var(--font-display)' }}>Build your deck first</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1rem' }}>
          Flashcard practice needs at least <strong>10 cards</strong> for a proper round. You have <strong>{wordsCount}</strong>.
        </p>
        <p className="hint" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Add {10 - wordsCount} more to unlock flip practice.</p>
        {onNeedWords ? (
          <button onClick={onNeedWords} className="btn-primary" style={{ maxWidth: 240, margin: '0 auto' }}><Sparkles size={16} /> Add words</button>
        ) : (
          <p className="hint">Add a few flashcards first.</p>
        )}
      </div>
    );
  }

  // Setup screen: session-size selection.
  if (!session) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="empty-backpack" style={{ marginBottom: '0.75rem' }}><Sparkles size={28} /></div>
        <h3 style={{ fontFamily: 'var(--font-display)' }}>Start practicing</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1rem' }}>Choose how many flashcards — max 20. You have {wordsCount} cards.</p>
        <div style={{ display:'flex', gap:'0.4rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'1rem' }}>
          {[5,10,15,20].map(n => (
            <button key={n} onClick={()=>setSessionSize(n)} className={`filter-chip ${sessionSize===n?'active':''}`} style={{ cursor:'pointer' }}>{n}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', alignItems:'center', marginBottom:'1rem' }}>
          <label className="input-label" style={{ margin:0 }}>Custom</label>
          <input type="number" min={1} max={20} value={sessionSize} onChange={e=>setSessionSize(Math.min(20, Math.max(1, parseInt(e.target.value)||1)))} className="text-input" style={{ width:80, padding:'0.5rem' }} />
          <span className="hint" style={{ fontSize:'0.78rem' }}>max 20</span>
        </div>
        {sessionError && <div className="status-msg error">{sessionError}</div>}
        <button onClick={startSession} disabled={sessionLoading} className="btn-primary" style={{ maxWidth: 240, margin: '0 auto' }}>
          {sessionLoading ? <Loader2 size={18} className="animate-spin" /> : <span>Start — {sessionSize} cards</span>}
        </button>
        <div className="hint" style={{ marginTop:'0.75rem', display:'flex', gap:'0.4rem', justifyContent:'center', alignItems:'center' }}><Keyboard size={14} /> Space to flip · Enter to check</div>
      </div>
    );
  }

  // Summary screen: session results.
  if (sessionDone) {
    return (
      <div className="card" style={{ textAlign: 'center', position:'relative', overflow:'hidden' }}>
        <div className="empty-backpack" style={{ marginBottom:'0.75rem', background:'var(--color-primary-soft)', borderColor:'var(--color-primary)' }}><Trophy size={28} color="var(--color-primary)" /></div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem' }}>Practice complete!</h3>
        <p style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2rem', margin:'0.5rem 0', color:'var(--color-primary-strong)' }}>{correctCount} / {session.size}</p>
        <p style={{ color:'var(--color-text-muted)', fontSize:'0.9rem', marginBottom:'1rem' }}>correct · {session.size - correctCount} to review</p>
        <div style={{ display:'flex', gap:'0.6rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>{ setSession(null); setResults([]); }} className="btn-primary" style={{ width:'auto', padding:'0.6rem 1.25rem' }}><RotateCcw size={16}/> New round</button>
          {onExit && <button onClick={onExit} className="btn-primary-style" style={{ background:'var(--color-surface)', color:'var(--color-text)', borderColor:'var(--color-border)' }}>Exit practice</button>}
        </div>
        <div style={{ marginTop:'1rem', display:'flex', gap:'0.4rem', justifyContent:'center', flexWrap:'wrap' }}>
          {results.map((r,i)=>(
            <span key={i} className="group-badge" style={{ background: r?.correct ? 'var(--color-success-soft)' : 'var(--color-danger-soft)', borderColor: r?.correct ? 'var(--color-primary)' : 'var(--color-danger)' }}>{i+1}</span>
          ))}
        </div>
      </div>
    );
  }

  const pendingAudio = currentQuestion && !currentQuestion.audio_url;

  return (
    <div className={`card quiz-immersive ${feedbackAnim ? `feedback-${feedbackAnim}` : ''}`} style={{ position:'relative', overflow: showConfetti ? 'visible' : 'hidden' }}>
      {/* Session progress indicator */}
      <div className="quiz-progress-slim" aria-label={`Card ${currentIndex+1} of ${session.size}`}>
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem', fontSize:'0.78rem', color:'var(--color-text-muted)', fontWeight:700 }}>
        <span>Card {currentIndex+1} of {session.size}</span>
        <span style={{ display:'inline-flex', gap:'0.4rem', alignItems:'center' }}>{correctCount} correct <Trophy size={12} /></span>
      </div>

      {/* Celebration effect for correct answers */}
      <AnimatePresence>
        {showConfetti && !shouldReduce && (
          <motion.div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:5 }} initial={{opacity:1}} exit={{opacity:0}}>
            {[...Array(8)].map((_,i)=>(
              <motion.span key={i} style={{ position:'absolute', left:'50%', top:'42%', width:8, height:8, borderRadius:999, background: colors[i%colors.length] }}
                initial={{x:0,y:0,scale:0}} animate={{x:(Math.cos((i/8)*Math.PI*2)*80), y:(Math.sin((i/8)*Math.PI*2)*70-20), scale:1, opacity:0}} transition={{duration:0.7, ease:[0.22,1,0.36,1], delay:i*0.015}} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive flashcard */}
      <div className="flip-card" style={{ perspective: 1100 }} onClick={handleFlip} role="button" tabIndex={0} aria-label="Flip card" onKeyDown={e=>{ if(e.code==='Space'){ e.preventDefault(); handleFlip(); }}}>
        <motion.div
          className="flip-inner"
          animate={shouldReduce ? {} : { rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
          style={{ transformStyle:'preserve-3d', position:'relative', minHeight: 160 }}
        >
          {/* Card front: translation prompt */}
          <div className="flip-face front" style={{ backfaceVisibility:'hidden', position:'absolute', inset:0, display:'grid', placeItems:'center', background:'var(--color-surface-raised)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:'1.25rem' }}>
            <div style={{ textAlign:'center' }}>
              <p style={{ color:'var(--color-text-muted)', fontWeight:700, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Translate to {currentQuestion.prompt_lang==='de' ? 'English' : 'German'}</p>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800, margin:'0.6rem 0', color: currentQuestion.prompt_lang==='de' ? 'var(--color-primary-strong)' : 'var(--color-text)', display:'inline-flex', alignItems:'center', gap:'0.4rem', wordBreak:'break-word' }}>
                <span className="flag" aria-hidden="true">{currentQuestion.prompt_lang==='de' ? <svg viewBox="0 0 5 3" width="22" height="13" style={{borderRadius:2, border:'1px solid var(--color-border)'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg> : <svg viewBox="0 0 60 30" width="22" height="13" style={{borderRadius:2, border:'1px solid var(--color-border)'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg>}</span>
                <span>{currentQuestion.prompt_word}</span>
              </div>
              {currentQuestion.pos && (
                <div style={{ display:'flex', justifyContent:'center', marginTop:'0.3rem' }}>
                  <WordBadge pos={currentQuestion.pos} />
                </div>
              )}
              <p style={{ fontSize:'0.72rem', color:'var(--color-text-faint)', marginTop:'0.4rem' }}>{flipped ? '' : 'Tap card or press Space to reveal'}</p>
            </div>
          </div>
          {/* Card back: correct answer */}
          <div className="flip-face back" style={{ backfaceVisibility:'hidden', position:'absolute', inset:0, transform:'rotateY(180deg)', display:'grid', placeItems:'center', background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:'1.25rem' }}>
            <div style={{ textAlign:'center' }}>
              <p style={{ color:'var(--color-text-muted)', fontWeight:700, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Answer</p>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.9rem', fontWeight:800, margin:'0.4rem 0', color:'var(--color-primary-strong)', display:'inline-flex', alignItems:'center', gap:'0.4rem' }}>
                <span className="flag" aria-hidden="true">{currentQuestion.prompt_lang==='de' ? <svg viewBox="0 0 60 30" width="22" height="13" style={{borderRadius:2, border:'1px solid var(--color-border)'}}><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="white" strokeWidth="6"/><path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/><path d="M30 0 V30 M0 15 H60" stroke="white" strokeWidth="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6"/></svg> : <svg viewBox="0 0 5 3" width="22" height="13" style={{borderRadius:2, border:'1px solid var(--color-border)'}}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>}</span>
                <span>{result ? result.correct_answer : '—'}</span>
              </div>
              <p style={{ fontSize:'0.78rem', color:'var(--color-text-muted)' }}>{currentQuestion.prompt_lang==='de' ? 'English' : 'German'} translation</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display:'flex', justifyContent:'center', margin:'0.9rem 0 0.6rem' }}>
        {pendingAudio ? <span className="pending-pill"><Loader2 size={12} className="animate-spin" /> audio generating…</span>
          : audioLoading ? <button className="play-large-btn" disabled><Loader2 size={16} className="animate-spin" /> Loading…</button>
          : <button className="play-large-btn" onClick={(e)=>{e.stopPropagation(); handlePlay(currentQuestion.audio_url);}}><Volume2 size={16} /> Listen <span className="hint" style={{ fontSize:'0.68rem', fontWeight:600 }}>(Space)</span></button>}
      </div>

      {checkMutation.error && !result && <div className="status-msg error" style={{ marginBottom:'0.75rem' }}>{friendlyError(checkMutation.error, "Couldn't check that answer. Please try again.")}</div>}

      {!result ? (
        <form onSubmit={handleCheck}>
          <div className="input-group">
            <input ref={inputRef} type="text" className="text-input" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type your translation… ä ö ü ß" autoFocus disabled={checkMutation.isPending} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <motion.button type="submit" className="btn-primary" style={{ flex:1 }} disabled={checkMutation.isPending || !answer.trim()} whileTap={shouldReduce?{}:{scale:0.98}}>
              {checkMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>} Check
            </motion.button>
            <button type="button" className="btn-primary-style" style={{ background:'var(--color-surface)', color:'var(--color-text)', borderColor:'var(--color-border)' }} onClick={handleFlip}>Flip to reveal</button>
          </div>
          <p style={{ fontSize:'0.72rem', color:'var(--color-text-faint)', textAlign:'center', marginTop:'0.5rem' }}>Flip just shows the answer — your score comes from <strong>Check</strong>.</p>
        </form>
      ) : (
        <motion.div role="status" className={`quiz-result ${result.correct ? 'correct' : 'incorrect'}`} initial={shouldReduce?false:{scale:0.96, opacity:0}} animate={{scale:1, opacity:1}} transition={{duration:0.22, ease:[0.34,1.56,0.64,1]}}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.5rem' }}>
            {result.correct ? <CheckCircle size={40} color="var(--color-primary)"/> : <XCircle size={40} color="var(--color-danger)"/>}
          </div>
          <h3>{result.correct ? 'Richtig! 🎉' : 'Fast — not quite'}</h3>
          {!result.correct && <p>The answer was: <strong>{result.correct_answer}</strong></p>}
          <p style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', marginTop:'0.4rem' }}>{result.correct ? 'Correct — great recall!' : 'Incorrect — will appear again soon.'}</p>
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', marginTop:'0.9rem' }}>
            <button className="btn-primary" style={{ width:'auto', padding:'0.6rem 1.25rem' }} onClick={handleNextFromResult}>Next <ArrowRight size={16}/></button>
          </div>
        </motion.div>
      )}

      <div className="quiz-hint" style={{ display:'flex', gap:'0.6rem', justifyContent:'center', alignItems:'center', marginTop:'1rem', fontSize:'0.68rem', color:'var(--color-text-faint)', flexWrap:'wrap' }}>
        <span><kbd>Space</kbd> flip / listen</span>
        <span>·</span>
        <span><kbd>Enter</kbd> check / next</span>
        <Keyboard size={12} />
      </div>
    </div>
  );
}
