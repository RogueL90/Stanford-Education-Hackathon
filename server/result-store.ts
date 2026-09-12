import fs from 'node:fs'
import path from 'node:path'
import type { Evaluation } from './evaluate.js'

export interface StoredStudentResult extends Evaluation {
  id: string
  studentName: string
  selectedAnswer: string
  selectedAnswerLabel: string
  createdAt: string
  source: 'ai' | 'demo'
}

const resultsFile = process.env.RESULTS_FILE || path.join(process.cwd(), 'data', 'results.json')
let cachedResults: StoredStudentResult[] | null = null

function readResults() {
  if (cachedResults) return cachedResults

  try {
    cachedResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8')) as StoredStudentResult[]
  } catch {
    cachedResults = []
  }

  return cachedResults
}

export function listResults() {
  return [...readResults()]
}

export function saveResult(result: StoredStudentResult) {
  const results = readResults()
  results.unshift(result)
  cachedResults = results.slice(0, 500)

  fs.mkdirSync(path.dirname(resultsFile), { recursive: true })
  const temporaryFile = `${resultsFile}.tmp`
  fs.writeFileSync(temporaryFile, JSON.stringify(cachedResults, null, 2))
  fs.renameSync(temporaryFile, resultsFile)
}
