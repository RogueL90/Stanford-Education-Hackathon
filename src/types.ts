export type ComprehensionLevel = 'strong' | 'partial' | 'weak'

export interface ComprehensionSkills {
  usesStoryEvidence: boolean
  connectsCauseAndEffect: boolean
  identifiesCentralLesson: boolean
}

export interface EvaluationResult {
  answerCorrect: boolean
  comprehension: ComprehensionLevel
  reason: string
  strengths: string[]
  misconceptions: string[]
  nextStep: string
  skills: ComprehensionSkills
  source: 'pioneer' | 'demo'
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
