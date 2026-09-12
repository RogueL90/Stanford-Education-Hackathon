import { FormEvent, useState } from 'react'
import { quiz, type QuestionId } from './content'
import type { EvaluationRequest, EvaluationResult } from './types'

type View = 'quiz' | 'result'
type ResponseState = Record<QuestionId, { selectedAnswer: string; explanation: string }>
type QuestionResult = { questionId: QuestionId; evaluation: EvaluationResult }

function emptyResponses(): ResponseState {
  return Object.fromEntries(
    quiz.questions.map((question) => [question.id, { selectedAnswer: '', explanation: '' }]),
  ) as ResponseState
}

function App() {
  const [responses, setResponses] = useState<ResponseState>(emptyResponses)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [view, setView] = useState<View>('quiz')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = quiz.questions.every((question) => {
    const response = responses[question.id]
    const explanationComplete = !question.explanationPrompt || response.explanation.trim().length > 0
    return response.selectedAnswer !== '' && explanationComplete
  })

  function chooseAnswer(questionId: QuestionId, selectedAnswer: string) {
    setResponses((current) => ({
      ...current,
      [questionId]: { ...current[questionId], selectedAnswer },
    }))
  }

  function writeExplanation(questionId: QuestionId, explanation: string) {
    setResponses((current) => ({
      ...current,
      [questionId]: { ...current[questionId], explanation },
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      const evaluated = await Promise.all(
        quiz.questions.map(async (question) => {
          const studentResponse = responses[question.id]
          const payload: EvaluationRequest = {
            passage: quiz.referenceText,
            question: question.prompt,
            answerChoices: question.choices.map(({ id, label }) => ({ id, label })),
            expectedCorrectAnswer: question.correctAnswerId,
            selectedAnswer: studentResponse.selectedAnswer,
            explanation: studentResponse.explanation.trim(),
          }

          const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!response.ok) throw new Error('Evaluation failed')
          return {
            questionId: question.id,
            evaluation: (await response.json()) as EvaluationResult,
          }
        }),
      )

      setResults(evaluated)
      setView('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('We could not check these responses. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function startOver() {
    setView('quiz')
    setResults([])
    setResponses(emptyResponses())
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
              <p className="eyebrow">Story quiz · 7 questions</p>
              <h1 id="page-title">{quiz.title}</h1>
              <p>{quiz.instructions}</p>
            </section>

            {quiz.questions.map((question, index) => {
              const studentResponse = responses[question.id]
              const helpId = `${question.id}-help`

              return (
                <section className="form-section question-section" aria-labelledby={`${question.id}-title`} key={question.id}>
                  <fieldset>
                    <legend id={`${question.id}-title`}>
                      <span className="question-number">{index + 1}.</span> {question.prompt}
                      <span className="required-mark" aria-label="required">*</span>
                    </legend>

                    <div className="choices">
                      {question.choices.map((choice) => (
                        <label className="choice" key={choice.id}>
                          <input
                            type="radio"
                            name={`answer-${question.id}`}
                            value={choice.id}
                            checked={studentResponse.selectedAnswer === choice.id}
                            onChange={() => chooseAnswer(question.id, choice.id)}
                          />
                          <span>{choice.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {question.explanationPrompt && (
                    <div className="explanation-field">
                      <label htmlFor={`${question.id}-explanation`}>
                        Explain your thinking
                        <span className="required-mark" aria-label="required">*</span>
                      </label>
                      <p id={helpId}>{question.explanationPrompt}</p>
                      <textarea
                        id={`${question.id}-explanation`}
                        rows={4}
                        value={studentResponse.explanation}
                        onChange={(event) => writeExplanation(question.id, event.target.value)}
                        aria-describedby={helpId}
                        placeholder="Write what you remember"
                        required
                      />
                    </div>
                  )}
                </section>
              )
            })}

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={!canSubmit || submitting}>
                {submitting ? 'Checking responses…' : 'Submit quiz'}
              </button>
              <span className="completion-note">Answer all 7 questions and explain 5</span>
            </div>
          </form>
        ) : (
          <section className="results" aria-labelledby="results-title">
            <div className="result-heading">
              <p className="eyebrow">Quiz submitted</p>
              <h1 id="results-title">Here’s what your responses show</h1>
              <p>
                {results.filter(({ evaluation }) => evaluation.answerCorrect).length} of 7 answers correct ·{' '}
                {results.filter(({ questionId, evaluation }) =>
                  quiz.questions.find((question) => question.id === questionId)?.explanationPrompt &&
                  evaluation.comprehension === 'strong',
                ).length} strong explanations
              </p>
            </div>

            <div className="question-results">
              {results.map(({ questionId, evaluation }, index) => {
                const question = quiz.questions.find((item) => item.id === questionId)!
                const studentResponse = responses[questionId]
                const selectedChoice = question.choices.find((choice) => choice.id === studentResponse.selectedAnswer)

                return (
                  <article className="question-result" key={questionId}>
                    <h2><span>{index + 1}.</span> {question.prompt}</h2>
                    <div
                      className={`result-comparison${question.explanationPrompt ? '' : ' result-comparison--answer-only'}`}
                      aria-label={`Results for question ${index + 1}`}
                    >
                      <div className="result-item">
                        <span className="result-label">Multiple-choice answer</span>
                        <strong className={evaluation.answerCorrect ? 'status-correct' : 'status-incorrect'}>
                          <span className="status-icon" aria-hidden="true">{evaluation.answerCorrect ? '✓' : '×'}</span>
                          {evaluation.answerCorrect ? 'Correct' : 'Incorrect'}
                        </strong>
                      </div>
                      {question.explanationPrompt && (
                        <div className="result-item result-item--emphasis">
                          <span className="result-label">Understanding shown</span>
                          <strong className={`status-${evaluation.comprehension}`}>
                            <span className="status-icon" aria-hidden="true">{evaluation.comprehension === 'strong' ? '✓' : '—'}</span>
                            {evaluation.comprehension[0].toUpperCase() + evaluation.comprehension.slice(1)}
                          </strong>
                        </div>
                      )}
                    </div>
                    <div className="question-result__details">
                      {question.explanationPrompt && <p>{evaluation.reason}</p>}
                      <dl>
                        <div><dt>Answer selected</dt><dd>{selectedChoice?.label}</dd></div>
                        {question.explanationPrompt && (
                          <div><dt>Your explanation</dt><dd>“{studentResponse.explanation}”</dd></div>
                        )}
                      </dl>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="result-actions">
              <button className="primary-button" type="button" onClick={startOver}>Try the quiz again</button>
              <span className="evaluation-note">
                {results.some(({ evaluation }) => evaluation.source === 'ai')
                  ? 'Explanations reviewed automatically'
                  : 'Using built-in demo evaluation'}
              </span>
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>This check looks for evidence of understanding—not writing style.</p>
      </footer>
    </div>
  )
}

export default App
