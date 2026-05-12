import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { generateCustomQuiz, generateQuiz, getNextQuiz, getQuizPerformance, submitQuizAnswer } from '../api/client';

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
  const [customStart, setCustomStart] = useState('0');
  const [customEnd, setCustomEnd] = useState('0');
  const [customCount, setCustomCount] = useState('5');
  const [customQuiz, setCustomQuiz] = useState([]);
  const [customIndex, setCustomIndex] = useState(0);
  const [customAnswer, setCustomAnswer] = useState('');
  const [customFeedback, setCustomFeedback] = useState(initialFeedback);
  const [customLoading, setCustomLoading] = useState(false);
  const [customScore, setCustomScore] = useState({ correct: 0, total: 0 });

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
    if (!videoId) {
      setQuizQuestion(null);
      setPerformance(null);
      setSelectedAnswer('');
      setFreeTextAnswer('');
      setFeedback(initialFeedback);
      return;
    }
    loadNextQuestion(false);
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

  const currentCustomQuestion = customQuiz[customIndex] || null;

  const handleGenerateCustomQuiz = async () => {
    if (!videoId) return;
    const start = Number(customStart);
    const end = Number(customEnd);
    const count = Math.max(1, Math.min(10, Number(customCount) || 5));

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < 0) {
      setCustomFeedback({ type: 'error', message: 'Enter valid start and end times in seconds.' });
      return;
    }

    if (end <= start) {
      setCustomFeedback({ type: 'error', message: 'End time must be greater than start time.' });
      return;
    }

    setCustomLoading(true);
    setCustomFeedback({ type: 'info', message: 'Generating a quiz from the selected section...' });
    try {
      const result = await generateCustomQuiz(videoId, start, end, count);
      setCustomQuiz(Array.isArray(result.questions) ? result.questions : []);
      setCustomIndex(0);
      setCustomAnswer('');
      setCustomScore({ correct: 0, total: 0 });
      setCustomFeedback({
        type: 'info',
        message: result.questions?.length
          ? 'Custom quiz ready. Answer each question from the selected time window.'
          : 'No quiz questions were generated for that section.',
      });
    } catch (error) {
      setCustomFeedback({ type: 'error', message: error.message });
      setCustomQuiz([]);
    } finally {
      setCustomLoading(false);
    }
  };

  const submitCustomAnswer = () => {
    if (!currentCustomQuestion) return;
    if (!String(customAnswer || '').trim()) {
      setCustomFeedback({ type: 'error', message: 'Please provide an answer first.' });
      return;
    }

    const expected = String(currentCustomQuestion.answer || '').trim().toLowerCase();
    const provided = String(customAnswer || '').trim().toLowerCase();
    const isCorrect = expected === provided;
    const total = customScore.total + 1;
    const correct = customScore.correct + (isCorrect ? 1 : 0);

    setCustomScore({ correct, total });
    setCustomFeedback({
      type: isCorrect ? 'success' : 'error',
      message: isCorrect
        ? `Correct. ${currentCustomQuestion.explanation || 'Good work.'}`
        : `Not quite. Correct answer: ${currentCustomQuestion.answer}. ${currentCustomQuestion.explanation || ''}`,
    });
  };

  const goToCustomQuestion = (direction) => {
    setCustomIndex((current) => {
      const nextIndex = Math.max(0, Math.min(customQuiz.length - 1, current + direction));
      return nextIndex;
    });
    setCustomAnswer('');
    setCustomFeedback(initialFeedback);
  };

  const canAnswer = !!quizQuestion && !isSubmitting && !isLoading;

  return (
    <section className="glass-panel atmospheric-glow" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Literata, serif', color: 'var(--primary)', fontSize: '1.15rem', marginBottom: '0.25rem' }}>
            <Sparkles size={18} /> Smart Quiz
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Practice the key concepts with active recall.</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{generatedCount || performance?.attempts || 0}</div>
          <div>questions generated</div>
        </div>
      </div>

      {!videoId ? (
        <div className="quiz-empty" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Ingest a video first, then generate a quiz from its concepts.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button className="ghost" onClick={() => loadNextQuestion(true)} disabled={isLoading || isProcessing}>
              {isLoading ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />} Generate Quiz
            </button>
            <button className="ghost" onClick={() => loadNextQuestion(false)} disabled={isLoading || isProcessing}>
              Next Question
            </button>
          </div>

          {feedback.message && (
            <div style={{
              marginBottom: '1rem',
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

          {quizQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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
                      onClick={() => setSelectedAnswer(option)}
                      disabled={!canAnswer}
                      style={{
                        textAlign: 'left',
                        borderColor: selectedAnswer === option ? 'var(--primary)' : 'var(--outline-variant)',
                        background: selectedAnswer === option ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                      }}
                    >

                    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--outline-variant)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)', fontFamily: 'Literata, serif' }}>Custom Time Quiz</h3>
                          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Generate questions from a selected time range in the transcript.</p>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{customScore.correct}/{customScore.total}</div>
                          <div>answered</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Start sec
                          <input type="number" min="0" value={customStart} onChange={(e) => setCustomStart(e.target.value)} disabled={customLoading} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          End sec
                          <input type="number" min="0" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} disabled={customLoading} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Questions
                          <input type="number" min="1" max="10" value={customCount} onChange={(e) => setCustomCount(e.target.value)} disabled={customLoading} />
                        </label>
                      </div>

                      <button className="hero-cta" type="button" onClick={handleGenerateCustomQuiz} disabled={customLoading || !videoId} style={{ width: '100%', marginBottom: '0.75rem' }}>
                        {customLoading ? 'Generating...' : 'Generate Custom Quiz'}
                      </button>

                      {customFeedback.message && (
                        <div style={{
                          marginBottom: '0.75rem',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '0.9rem',
                          background: customFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : customFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                          color: customFeedback.type === 'success' ? '#15803d' : customFeedback.type === 'error' ? '#b91c1c' : 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}>
                          {customFeedback.message}
                        </div>
                      )}

                      {currentCustomQuestion && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                            Question {customIndex + 1} of {customQuiz.length}
                          </div>
                          <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--on-surface)' }}>{currentCustomQuestion.question}</div>

                          {Array.isArray(currentCustomQuestion.options) && currentCustomQuestion.options.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              {currentCustomQuestion.options.map((option) => (
                                <button
                                  key={option}
                                  className="ghost"
                                  onClick={() => setCustomAnswer(option)}
                                  type="button"
                                  style={{
                                    textAlign: 'left',
                                    borderColor: customAnswer === option ? 'var(--primary)' : 'var(--outline-variant)',
                                    background: customAnswer === option ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                  }}
                                >
                                  {customAnswer === option ? <CheckCircle2 size={14} /> : <span style={{ width: 14 }} />} {option}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <textarea
                              value={customAnswer}
                              onChange={(event) => setCustomAnswer(event.target.value)}
                              placeholder="Type your answer here..."
                              rows={4}
                              style={{ width: '100%', resize: 'vertical', borderRadius: '1rem', padding: '0.9rem', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}
                              disabled={customLoading}
                            />
                          )}

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="ghost" type="button" onClick={() => goToCustomQuestion(-1)} disabled={customIndex === 0 || customLoading}>Prev</button>
                            <button className="hero-cta" type="button" onClick={submitCustomAnswer} disabled={customLoading || !currentCustomQuestion} style={{ flex: 1 }}>Submit</button>
                            <button className="ghost" type="button" onClick={() => goToCustomQuestion(1)} disabled={customIndex >= customQuiz.length - 1 || customLoading}>Next</button>
                          </div>
                        </div>
                      )}
                    </div>
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

              <button className="hero-cta" onClick={handleSubmit} disabled={!canAnswer} style={{ width: '100%' }}>
                {isSubmitting ? 'Checking answer...' : 'Submit Answer'}
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              No quiz question is active yet. Generate one to begin.
            </div>
          )}

          {performance && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>
                <Trophy size={16} /> Progress
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.9rem' }}>
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
        </>
      )}
    </section>
  );
}