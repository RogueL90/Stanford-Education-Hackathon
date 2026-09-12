import { FormEvent, useRef, useState } from 'react'
import { demoResponses, quiz, type ChoiceId } from './content'
import type { EvaluationRequest, EvaluationResult } from './types'

type View = 'quiz' | 'result'

function App() {
  const [selectedAnswer, setSelectedAnswer] = useState<ChoiceId | ''>('')
  const [explanation, setExplanation] = useState('')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [view, setView] = useState<View>('quiz')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showDemos, setShowDemos] = useState(false)
  const explanationRef = useRef<HTMLTextAreaElement>(null)

  const canSubmit = selectedAnswer !== '' && explanation.trim().length > 0

  function applyDemo(index: number) {
    const demo = demoResponses[index]
    setSelectedAnswer(demo.answerId)
    setExplanation(demo.explanation)
    setShowDemos(false)
    setError('')
    window.setTimeout(() => explanationRef.current?.focus(), 0)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || !selectedAnswer) return

    setSubmitting(true)
    setError('')

    const payload: EvaluationRequest = {
      passage: quiz.passage.join('\n\n'),
      question: quiz.question,
      answerChoices: quiz.choices.map(({ id, label }) => ({ id, label })),
      expectedCorrectAnswer: quiz.correctAnswerId,
      selectedAnswer,
      explanation: explanation.trim(),
    }

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Evaluation failed')
      const evaluation = (await response.json()) as EvaluationResult
      setResult(evaluation)
      setView('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('We could not check this response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function startOver() {
    setView('quiz')
    setResult(null)
    setSelectedAnswer('')
    setExplanation('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <span className="product-name">ClearRead</span>
          <span className="header-context">Student preview</span>
        </div>
      </header>

      <main className="page">
        {view === 'quiz' ? (
          <form className="assessment" onSubmit={submit}>
            <section className="title-block" aria-labelledby="page-title">
              <p className="eyebrow">English · Grade 7</p>
              <h1 id="page-title">{quiz.title}</h1>
              <p>Read the passage, choose the best answer, and explain your thinking.</p>
            </section>

            <section className="form-section passage-section" aria-labelledby="passage-title">
              <p className="section-label">Reading passage</p>
              <h2 id="passage-title">{quiz.passageTitle}</h2>
              <div className="passage-copy">
                {quiz.passage.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="form-section question-section" aria-labelledby="question-title">
              <fieldset>
                <legend id="question-title">
                  <span className="question-number">1.</span> {quiz.question}
                  <span className="required-mark" aria-label="required">*</span>
                </legend>

                <div className="choices">
                  {quiz.choices.map((choice) => (
                    <label className="choice" key={choice.id}>
                      <input
                        type="radio"
                        name="answer"
                        value={choice.id}
                        checked={selectedAnswer === choice.id}
                        onChange={() => setSelectedAnswer(choice.id)}
                      />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="explanation-field">
                <label htmlFor="explanation">
                  Explain your thinking
                  <span className="required-mark" aria-label="required">*</span>
                </label>
                <p id="explanation-help">Explain what in the reading led you to your answer.</p>
                <textarea
                  ref={explanationRef}
                  id="explanation"
                  rows={5}
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                  aria-describedby="explanation-help"
                  placeholder="Write your explanation here"
                  required
                />
              </div>
            </section>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={!canSubmit || submitting}>
                {submitting ? 'Checking response…' : 'Submit'}
              </button>

              <div className="demo-control">
                <button
                  className="text-button"
                  type="button"
                  aria-expanded={showDemos}
                  onClick={() => setShowDemos((visible) => !visible)}
                >
                  Demo responses
                  <span aria-hidden="true">{showDemos ? '▲' : '▼'}</span>
                </button>
                {showDemos && (
                  <div className="demo-menu">
                    {demoResponses.map((demo, index) => (
                      <button type="button" key={demo.label} onClick={() => applyDemo(index)}>
                        <strong>{demo.label}</strong>
                        <span>{demo.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : result ? (
          <section className="results" aria-labelledby="results-title">
            <div className="result-heading">
              <p className="eyebrow">Response submitted</p>
              <h1 id="results-title">Here’s what your response shows</h1>
              <p>Your selected answer and your explanation are considered separately.</p>
            </div>

            <div className="result-comparison" aria-label="Response results">
              <div className="result-item">
                <span className="result-label">Multiple-choice answer</span>
                <strong className={result.answerCorrect ? 'status-correct' : 'status-incorrect'}>
                  <span className="status-icon" aria-hidden="true">{result.answerCorrect ? '✓' : '×'}</span>
                  {result.answerCorrect ? 'Correct' : 'Incorrect'}
                </strong>
              </div>
              <div className="result-item result-item--emphasis">
                <span className="result-label">Understanding shown</span>
                <strong className={`status-${result.comprehension}`}>
                  <span className="status-icon" aria-hidden="true">{result.comprehension === 'strong' ? '✓' : '—'}</span>
                  {result.comprehension[0].toUpperCase() + result.comprehension.slice(1)}
                </strong>
              </div>
            </div>

            <div className="reason-section">
              <h2>Why</h2>
              <p>{result.reason}</p>
            </div>

            <div className="response-review">
              <h2>Your response</h2>
              <dl>
                <div>
                  <dt>Answer selected</dt>
                  <dd>{quiz.choices.find((choice) => choice.id === selectedAnswer)?.label}</dd>
                </div>
                <div>
                  <dt>Explanation</dt>
                  <dd>“{explanation}”</dd>
                </div>
              </dl>
            </div>

            <div className="result-actions">
              <button className="primary-button" type="button" onClick={startOver}>Try another response</button>
              <span className="evaluation-note">
                {result.source === 'ai' ? 'Explanation reviewed automatically' : 'Using built-in demo evaluation'}
              </span>
            </div>
          </section>
        ) : null}
      </main>

      <footer>
        <p>This check looks for evidence of understanding—not writing style.</p>
      </footer>
    </div>
  )
}

export default App
