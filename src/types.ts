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

export interface EvaluationSubmission extends EvaluationRequest {
  studentName: string
}

export interface StudentResult extends EvaluationResult {
  id: string
  studentName: string
  selectedAnswer: string
  selectedAnswerLabel: string
  explanation: string
  createdAt: string
}
