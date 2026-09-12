import { FormEvent, useCallback, useEffect, useState } from 'react'
import { quiz, type QuestionId } from './content'
import type { EvaluationResult, EvaluationSubmission, StudentResult } from './types'

type View = 'signin' | 'quiz' | 'result'
type ResponseState = Record<QuestionId, { selectedAnswer: string; explanation: string }>

function emptyResponses(): ResponseState {
  return Object.fromEntries(
    quiz.questions.map((question) => [question.id, { selectedAnswer: '', explanation: '' }]),
  ) as ResponseState
}

function TeacherDashboard() {
  const [results, setResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadResults = useCallback(async () => {
    try {
      const response = await fetch('/api/results')
      if (!response.ok) throw new Error('Could not load results')
      const data = (await response.json()) as { results: StudentResult[] }
      setResults(data.results)
      setError('')
    } catch {
      setError('Could not load student results.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadResults()
    const refreshTimer = window.setInterval(() => void loadResults(), 5000)
    return () => window.clearInterval(refreshTimer)
  }, [loadResults])

  const totalResponses = results.length
  const percentage = (count: number) => totalResponses ? Math.round((count / totalResponses) * 100) : 0
  const strongCount = results.filter(({ comprehension }) => comprehension === 'strong').length
  const correctCount = results.filter(({ answerCorrect }) => answerCorrect).length
  const supportCount = results.filter(({ comprehension }) => comprehension !== 'strong').length
  const skillSummary = [
    {
      label: 'Used story evidence',
      count: results.filter((item) => item.skills?.usesStoryEvidence).length,
    },
    {
      label: 'Connected cause and effect',
      count: results.filter((item) => item.skills?.connectsCauseAndEffect).length,
    },
    {
      label: 'Identified the central lesson',
      count: results.filter((item) => item.skills?.identifiesCentralLesson).length,
    },
  ]

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner site-header__inner--wide">
          <a className="product-name" href="/">Better MCQ</a>
          <span className="header-context">Teacher dashboard</span>
        </div>
      </header>

      <main className="page page--wide">
        <section className="results dashboard" aria-labelledby="dashboard-title">
          <div className="dashboard-heading">
            <h1 id="dashboard-title">Student results</h1>
            <button className="secondary-button" type="button" onClick={() => void loadResults()}>
              Refresh
            </button>
          </div>

          {error ? (
            <p className="dashboard-message" role="alert">{error}</p>
          ) : loading ? (
            <p className="dashboard-message">Loading…</p>
          ) : results.length === 0 ? (
            <p className="dashboard-message">No responses yet.</p>
          ) : (
            <>
              <section className="class-overview" aria-labelledby="class-overview-title">
                <h2 id="class-overview-title">Class overview</h2>
                <div className="summary-cards">
                  <div className="summary-card">
                    <strong>{totalResponses}</strong>
                    <span>Responses</span>
                  </div>
                  <div className="summary-card">
                    <strong>{percentage(strongCount)}%</strong>
                    <span>Strong understanding</span>
                  </div>
                  <div className="summary-card">
                    <strong>{percentage(correctCount)}%</strong>
                    <span>Correct answer</span>
                  </div>
                  <div className="summary-card">
                    <strong>{supportCount}</strong>
                    <span>Need support</span>
                  </div>
                </div>

                <div className="skill-breakdown">
                  {skillSummary.map((skill) => {
                    const skillPercentage = percentage(skill.count)
                    return (
                      <div className="skill-row" key={skill.label}>
                        <div className="skill-row__label">
                          <span>{skill.label}</span>
                          <strong>{skillPercentage}%</strong>
                        </div>
                        <div className="skill-track" aria-hidden="true">
                          <span style={{ width: `${skillPercentage}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Understanding</th>
                      <th>Answer</th>
                      <th>AI analysis</th>
                      <th>Student explanation</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((studentResult) => (
                      <tr key={studentResult.id}>
                        <td><strong>{studentResult.studentName}</strong></td>
                        <td>
                          <span className={`result-pill result-pill--${studentResult.comprehension}`}>
                            {studentResult.comprehension === 'strong'
                              ? 'Understood'
                              : studentResult.comprehension === 'partial'
                                ? 'Almost there'
                                : 'Needs review'}
                          </span>
                        </td>
                        <td>{studentResult.selectedAnswerLabel}</td>
                        <td className="analysis-cell">
                          <p>{studentResult.reason}</p>
                          {studentResult.nextStep && <small>Next: {studentResult.nextStep}</small>}
                        </td>
                        <td className="explanation-cell">{studentResult.explanation || '—'}</td>
                        <td>{new Date(studentResult.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function StudentQuiz() {
  const [studentName, setStudentName] = useState('')
  const [responses, setResponses] = useState<ResponseState>(emptyResponses)
  const [view, setView] = useState<View>('signin')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const question = quiz.questions[0]
  const studentResponse = responses[question.id]
  const selectedAnswer = studentResponse.selectedAnswer
  const explanation = studentResponse.explanation

  function continueToQuiz(event: FormEvent) {
    event.preventDefault()
    if (!studentName.trim()) return
    setStudentName(studentName.trim())
    setView('quiz')
  }

  function chooseAnswer(questionId: QuestionId, answerId: string) {
    setResponses((current) => ({
      ...current,
      [questionId]: { ...current[questionId], selectedAnswer: answerId },
    }))
  }

  function writeExplanation(questionId: QuestionId, value: string) {
    setResponses((current) => ({
      ...current,
      [questionId]: { ...current[questionId], explanation: value },
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedAnswer || !explanation.trim() || !studentName) return

    setSubmitting(true)
    setError('')

    const payload: EvaluationSubmission = {
      studentName,
      passage: quiz.referenceText,
      question: question.prompt,
      answerChoices: question.choices.map(({ id, label }) => ({ id, label })),
      expectedCorrectAnswer: question.correctAnswerId,
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
      setResult((await response.json()) as EvaluationResult)
      setView('result')
    } catch {
      setError('We could not save your answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function startOver() {
    setStudentName('')
    setResponses(emptyResponses())
    setResult(null)
    setError('')
    setView('signin')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <span className="product-name">Better MCQ</span>
          {view !== 'signin' && <span className="header-context">{studentName}</span>}
        </div>
      </header>

      <main className="page">
        {view === 'signin' && (
          <form className="assessment" onSubmit={continueToQuiz}>
            <section className="title-block" aria-labelledby="page-title">
              <h1 id="page-title">What’s your name?</h1>
            </section>
            <div className="form-section name-field">
              <label htmlFor="student-name">Name</label>
              <input
                id="student-name"
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                maxLength={80}
                autoComplete="name"
                autoFocus
                placeholder="First name and last initial"
                required
              />
            </div>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={!studentName.trim()}>
                Continue
              </button>
            </div>
          </form>
        )}

        {view === 'quiz' && (
          <form className="assessment" onSubmit={submit}>
            <section className="title-block" aria-labelledby="page-title">
              <h1 id="page-title">{quiz.title}</h1>
            </section>

            <section className="form-section question-section" aria-labelledby={`${question.id}-title`}>
              <fieldset>
                <legend id={`${question.id}-title`}>{question.prompt}</legend>

                <div className="choices">
                  {question.choices.map((choice, index) => (
                    <label className="choice" key={choice.id}>
                      <input
                        type="radio"
                        name={`answer-${question.id}`}
                        value={choice.id}
                        checked={selectedAnswer === choice.id}
                        onChange={() => chooseAnswer(question.id, choice.id)}
                      />
                      <span><strong>{String.fromCharCode(65 + index)}.</strong> {choice.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="explanation-field">
                <label htmlFor={`${question.id}-explanation`}>Explain your thinking</label>
                <p id={`${question.id}-explanation-help`}>{question.explanationPrompt}</p>
                <textarea
                  id={`${question.id}-explanation`}
                  rows={4}
                  value={explanation}
                  onChange={(event) => writeExplanation(question.id, event.target.value)}
                  aria-describedby={`${question.id}-explanation-help`}
                  placeholder="Write what happened in the story"
                  required
                />
              </div>
            </section>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={!selectedAnswer || !explanation.trim() || submitting}
              >
                {submitting ? 'Checking…' : 'Submit answer'}
              </button>
            </div>
          </form>
        )}

        {view === 'result' && (
          <section className="results" aria-labelledby="results-title">
            <div className="result-heading">
              <h1 id="results-title">
                {result?.comprehension === 'strong'
                  ? 'You understood it'
                  : result?.comprehension === 'partial'
                    ? 'You’re almost there'
                    : 'Take another look'}
              </h1>
            </div>

            {result && (
              <>
                <div className="result-comparison">
                  <div className="result-item">
                    <span className="result-label">Answer choice</span>
                    <strong className={result.answerCorrect ? 'status-correct' : 'status-incorrect'}>
                      <span className="status-icon" aria-hidden="true">
                        {result.answerCorrect ? '✓' : '×'}
                      </span>
                      {result.answerCorrect ? 'Correct' : 'Not quite'}
                    </strong>
                  </div>
                  <div className="result-item result-item--emphasis">
                    <span className="result-label">Understanding</span>
                    <strong className={`status-${result.comprehension}`}>
                      {result.comprehension === 'strong'
                        ? 'Strong'
                        : result.comprehension === 'partial'
                          ? 'Developing'
                          : 'Needs support'}
                    </strong>
                  </div>
                </div>

                <div className="reason-section">
                  <h2>Your analysis</h2>
                  <p>{result.reason}</p>

                  {result.strengths.length > 0 && (
                    <div className="feedback-block">
                      <h3>What you showed</h3>
                      <ul>
                        {result.strengths.map((strength) => <li key={strength}>{strength}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="next-step">
                    <strong>Try next</strong>
                    <span>{result.nextStep}</span>
                  </div>
                </div>
              </>
            )}

            <div className="result-actions">
              <button className="primary-button" type="button" onClick={startOver}>Next student</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function App() {
  return window.location.pathname === '/teacher' ? <TeacherDashboard /> : <StudentQuiz />
}

export default App
