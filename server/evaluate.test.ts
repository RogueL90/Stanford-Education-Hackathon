import assert from 'node:assert/strict'
import test from 'node:test'
import {
  evaluateDemo,
  evaluationRequestSchema,
  evaluationSubmissionSchema,
  type EvaluationRequest,
} from './evaluate.js'

const base: EvaluationRequest = {
  passage: 'A summary of Tikki Tikki Tembo.',
  question: 'What was the Old Man dreaming about when Chang woke him up?',
  answerChoices: [
    { id: 'treasure', label: 'Finding treasure.' },
    { id: 'purple-mist', label: 'Floating into purple mist and becoming young again.' },
  ],
  expectedCorrectAnswer: 'purple-mist',
  selectedAnswer: 'treasure',
  explanation: '',
}

test('wrong answer can still show strong recall', () => {
  const result = evaluateDemo({
    ...base,
    explanation: 'He was becoming young again in a purple mist with fancy flowers.',
  })
  assert.equal(result.answerCorrect, false)
  assert.equal(result.comprehension, 'strong')
})

test('correct answer with a vague explanation is weak', () => {
  const result = evaluateDemo({
    ...base,
    question: 'What was the biggest challenge for Chang?',
    selectedAnswer: 'purple-mist',
    expectedCorrectAnswer: 'purple-mist',
    explanation: 'I remember this one.',
  })
  assert.equal(result.answerCorrect, true)
  assert.equal(result.comprehension, 'weak')
})

test('correct answer with story evidence is strong', () => {
  const result = evaluateDemo({
    ...base,
    question: 'What lesson did Chang and Tikki Tikki learn after their accident?',
    selectedAnswer: 'listen',
    expectedCorrectAnswer: 'listen',
    explanation: 'Their mother warned them to stay away from the well, so they should have listened to her.',
  })
  assert.equal(result.answerCorrect, true)
  assert.equal(result.comprehension, 'strong')
})

test('recognizes evidence for each quiz question', () => {
  const examples = [
    {
      question: 'What is the moral of Tikki Tikki Tembo?',
      explanation: 'His long name delayed getting help when he fell into the well.',
    },
    {
      question: 'What was the biggest challenge for Chang?',
      explanation: 'He had to say his brother’s long name before he could get help.',
    },
    {
      question: 'How does Chang’s mother respond to him when he asks for help?',
      explanation: 'She says that she cannot hear him.',
    },
    {
      question: 'Why do both boys have to go ask the Old Man for help?',
      explanation: 'The Old Man has the ladder.',
    },
    {
      question: 'What does Chang’s name mean?',
      explanation: 'His name means little or nothing.',
    },
    {
      question: 'What lesson did Chang and Tikki Tikki learn after their accident?',
      explanation: 'Their mother warned them about the well, so they should have listened.',
    },
    {
      question: 'What was the Old Man dreaming about when Chang woke him up?',
      explanation: 'He was becoming young again while floating in purple mist.',
    },
  ]

  for (const example of examples) {
    const result = evaluateDemo({ ...base, ...example })
    assert.equal(result.comprehension, 'strong', example.question)
  }
})

test('accepts an empty explanation for direct-recall questions', () => {
  assert.equal(evaluationRequestSchema.safeParse({ ...base, explanation: '' }).success, true)
})

test('uses a multiple-choice answer when no explanation is requested', () => {
  const result = evaluateDemo({
    ...base,
    question: 'What did the Three Little Pigs learn at the end of the story?',
    selectedAnswer: 'preparation',
    expectedCorrectAnswer: 'preparation',
    explanation: '',
  })

  assert.equal(result.answerCorrect, true)
  assert.equal(result.comprehension, 'strong')
})

test('requires a student name when saving a submission', () => {
  assert.equal(
    evaluationSubmissionSchema.safeParse({ ...base, studentName: 'Maya R.' }).success,
    true,
  )
  assert.equal(
    evaluationSubmissionSchema.safeParse({ ...base, studentName: '   ' }).success,
    false,
  )
})
