import { FormEvent, useState } from 'react'
import { quiz, type QuestionId } from './content'
import type { EvaluationRequest, EvaluationResult } from './types'

type View = 'quiz' | 'result'
type ResponseState = Record<QuestionId, string>

function emptyResponses(): ResponseState {
  return Object.fromEntries(quiz.questions.map((question) => [question.id, ''])) as ResponseState
}

function App() {
  const [responses, setResponses] = useState<ResponseState>(emptyResponses)
  const [view, setView] = useState<View>('quiz')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const question = quiz.questions[0]
  const selectedAnswer = responses[question.id]

  function chooseAnswer(questionId: QuestionId, answerId: string) {
    setResponses((current) => ({ ...current, [questionId]: answerId }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedAnswer) return

    setSubmitting(true)

    const payload: EvaluationRequest = {
      passage: quiz.referenceText,
      question: question.prompt,
      answerChoices: question.choices.map(({ id, label }) => ({ id, label })),
      expectedCorrectAnswer: question.correctAnswerId,
      selectedAnswer,
      explanation: '',
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
      const answerCorrect = selectedAnswer === question.correctAnswerId
      setResult({
        answerCorrect,
        comprehension: answerCorrect ? 'strong' : 'weak',
        reason: answerCorrect
          ? 'You recognized that careful work and preparation kept the pigs safe from the wolf.'
          : 'The brick house shows that hard work and preparation can protect you from trouble.',
        source: 'demo',
      })
      setView('result')
    } finally {
      setSubmitting(false)
    }
  }

  function startOver() {
    setResponses(emptyResponses())
    setResult(null)
    setView('quiz')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <span className="product-name">ClearRead</span>
        </div>
      </header>

      <main className="page">
        {view === 'quiz' ? (
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
            </section>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={!selectedAnswer || submitting}>
                {submitting ? 'Checking…' : 'Submit answer'}
              </button>
            </div>
          </form>
        ) : (
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

            <div className="question-result__details">
              <p>{result?.reason}</p>
            </div>

            <div className="result-actions">
              <button className="primary-button" type="button" onClick={startOver}>Try again</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
