import 'dotenv/config'
import express from 'express'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateDemo, evaluationSubmissionSchema, evaluateWithAI, usesPioneer } from './evaluate.js'
import type { Evaluation } from './evaluate.js'
import { listResults, saveResult } from './result-store.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const host = '0.0.0.0'
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const staticDirectory = path.resolve(currentDirectory, '../dist')

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', analysis: usesPioneer() ? 'pioneer' : 'demo' })
})

app.get('/api/results', (_request, response) => {
  response.json({ results: listResults() })
})

app.post('/api/evaluate', async (request, response) => {
  const parsed = evaluationSubmissionSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: 'Please provide a name and answer.' })
    return
  }

  const { studentName, ...evaluationInput } = parsed.data
  let evaluation: Evaluation
  let source: 'pioneer' | 'demo'

  try {
    evaluation = await evaluateWithAI(evaluationInput)
    source = usesPioneer() ? 'pioneer' : 'demo'
  } catch (error) {
    console.error('Pioneer evaluation failed; using demo evaluator.', error)
    evaluation = evaluateDemo(evaluationInput)
    source = 'demo'
  }

  const selectedChoice = evaluationInput.answerChoices.find(
    (choice) => choice.id === evaluationInput.selectedAnswer,
  )

  saveResult({
    id: randomUUID(),
    studentName,
    selectedAnswer: evaluationInput.selectedAnswer,
    selectedAnswerLabel: selectedChoice?.label || evaluationInput.selectedAnswer,
    explanation: evaluationInput.explanation,
    createdAt: new Date().toISOString(),
    source,
    ...evaluation,
  })

  response.json({ ...evaluation, source })
})

app.use(express.static(staticDirectory))
app.get('*path', (_request, response) => {
  response.sendFile(path.join(staticDirectory, 'index.html'))
})

app.listen(port, host, () => {
  console.log(`ClearRead is running on http://localhost:${port}`)
})
