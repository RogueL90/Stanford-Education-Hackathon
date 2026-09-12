import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateDemo, evaluateWithAI, evaluationRequestSchema, usesAI } from './evaluate.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const host = '0.0.0.0'
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const staticDirectory = path.resolve(currentDirectory, '../dist')

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.post('/api/evaluate', async (request, response) => {
  const parsed = evaluationRequestSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: 'Please provide an answer and explanation.' })
    return
  }

  try {
    const evaluation = await evaluateWithAI(parsed.data)
    response.json({ ...evaluation, source: usesAI() ? 'ai' : 'demo' })
  } catch (error) {
    console.error('AI evaluation failed; using demo evaluator.', error)
    response.json({ ...evaluateDemo(parsed.data), source: 'demo' })
  }
})

app.use(express.static(staticDirectory))
app.get('*path', (_request, response) => {
  response.sendFile(path.join(staticDirectory, 'index.html'))
})

app.listen(port, host, () => {
  console.log(`ClearRead is running on http://localhost:${port}`)
})
