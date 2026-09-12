export type ComprehensionLevel = 'strong' | 'partial' | 'weak'

export interface EvaluationResult {
  answerCorrect: boolean
  comprehension: ComprehensionLevel
  reason: string
  source: 'ai' | 'demo'
}

export interface EvaluationRequest {
  passage: string
  question: string
  answerChoices: Array<{ id: string; label: string }>
  expectedCorrectAnswer: string
  selectedAnswer: string
  explanation: string
}
