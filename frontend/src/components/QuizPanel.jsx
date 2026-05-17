import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { generateQuiz, getNextQuiz, getQuizPerformance, submitQuizAnswer } from '../api/client';

const initialFeedback = {
  type: 'idle',
  message: 'Generate a smart quiz from the current video, then answer one question at a time.',
};

export default function QuizPanel({ videoId, isProcessing = false }) {
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [feedback, setFeedback] = useState(initialFeedback);
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const questionType = quizQuestion?.type || 'mcq';
  const options = useMemo(() => Array.isArray(quizQuestion?.options) ? quizQuestion.options : [], [quizQuestion]);

  const loadPerformance = async () => {
    if (!videoId) return;
    try {
      const data = await getQuizPerformance(videoId);
      setPerformance(data);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const loadNextQuestion = async (shouldGenerate = false) => {
    if (!videoId) return;
    setIsLoading(true);
    setFeedback({ type: 'info', message: shouldGenerate ? 'Generating a fresh quiz...' : 'Fetching the next question...' });

    try {
      if (shouldGenerate) {
        const generated = await generateQuiz(videoId, 5);
        setGeneratedCount(generated?.question_count || 0);
      }

      const next = await getNextQuiz(videoId);
      if (next?.question) {
        setQuizQuestion(next.question);
        setSelectedAnswer('');
        setFreeTextAnswer('');
        setFeedback({ type: 'info', message: 'Answer the question below. The app will grade it instantly.' });
      } else {
        setQuizQuestion(null);
        setFeedback({ type: 'info', message: next?.message || 'No quiz questions available yet.' });
      }

      await loadPerformance();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!videoId) return;
    const timer = window.setTimeout(() => {
      void loadNextQuestion(false);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const handleSubmit = async () => {
    if (!quizQuestion || isSubmitting) return;

    const answer = questionType === 'mcq' ? selectedAnswer : freeTextAnswer;
    if (!String(answer || '').trim()) {
      setFeedback({ type: 'error', message: 'Please provide an answer first.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuizAnswer(quizQuestion.id, answer);
      setFeedback({
        type: result.is_correct ? 'success' : 'error',
        message: result.is_correct
          ? `Correct. ${result.explanation || 'Good work.'}`
          : `Not quite. Correct answer: ${result.correct_answer}. ${result.explanation || ''}`,
      });
      await loadPerformance();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAnswer = !!quizQuestion && !isSubmitting && !isLoading;

  return (
    <section className="glass-panel atmospheric-glow" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            <Sparkles size={14} /> Practice
          </div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Literata, serif', color: 'var(--primary)', fontSize: '1.15rem', marginBottom: '0.25rem' }}>
            <Sparkles size={18} /> Smart Quiz
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '62ch', lineHeight: 1.6 }}>Practice the key ideas with active recall. The layout keeps the same theme but breaks the workflow into cleaner, easier-to-scan sections.</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{generatedCount || performance?.attempts || 0}</div>
          <div>questions generated</div>
        </div>
      </div>

      {!videoId ? (
        <div className="quiz-empty" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Ingest a video first, then generate a quiz from its ideas.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="ghost" type="button" onClick={() => loadNextQuestion(true)} disabled={isLoading || isProcessing}>
              {isLoading ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />} Generate Quiz
            </button>
            <button className="ghost" type="button" onClick={() => loadNextQuestion(false)} disabled={isLoading || isProcessing}>
              Next Question
            </button>
          </div>

          {feedback.message && (
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '0.9rem',
              background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : feedback.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.12)',
              color: feedback.type === 'success' ? '#15803d' : feedback.type === 'error' ? '#b91c1c' : 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.08)',
              lineHeight: 1.5,
            }}>
              {feedback.message}
            </div>
          )}

          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)', fontFamily: 'Literata, serif' }}>Current Smart Question</h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Answer one question at a time and let the app grade it instantly.</p>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{performance?.accuracy ?? 0}%</div>
                <div>accuracy</div>
              </div>
            </div>

            {quizQuestion ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  {quizQuestion.type || 'mcq'} • {quizQuestion.concept || 'Key concept'}
                </div>
                <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--on-surface)' }}>
                  {quizQuestion.question}
                </div>

                {questionType === 'mcq' && options.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {options.map((option) => (
                      <button
                        key={option}
                        className="ghost"
                        type="button"
                        onClick={() => setSelectedAnswer(option)}
                        disabled={!canAnswer}
                        style={{
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          borderColor: selectedAnswer === option ? 'var(--primary)' : 'var(--outline-variant)',
                          background: selectedAnswer === option ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                        }}
                      >
                        {selectedAnswer === option ? <CheckCircle2 size={14} /> : <span style={{ width: 14 }} />} {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={freeTextAnswer}
                    onChange={(event) => setFreeTextAnswer(event.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', borderRadius: '1rem', padding: '0.9rem', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}
                    disabled={!canAnswer}
                  />
                )}

                <button className="hero-cta" type="button" onClick={handleSubmit} disabled={!canAnswer} style={{ width: '100%' }}>
                  {isSubmitting ? 'Checking answer...' : 'Submit Answer'}
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                No quiz question is active yet. Generate one to begin.
              </div>
            )}
          </div>

          {performance && (
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>
                <Trophy size={16} /> Progress
              </div>
              <div className="quiz-progress-grid">
                <div><div style={{ color: 'var(--text-secondary)' }}>Accuracy</div><strong>{performance.accuracy ?? 0}%</strong></div>
                <div><div style={{ color: 'var(--text-secondary)' }}>Avg score</div><strong>{performance.average_score ?? 0}</strong></div>
                <div><div style={{ color: 'var(--text-secondary)' }}>Attempts</div><strong>{performance.attempts ?? 0}</strong></div>
              </div>
              {performance.next_review_at && (
                <div style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Next review: {new Date(performance.next_review_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
