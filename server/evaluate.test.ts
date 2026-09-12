import assert from 'node:assert/strict'
import test from 'node:test'
import {
  evaluateDemo,
  evaluateWithAI,
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
  assert.equal(result.skills.usesStoryEvidence, true)
  assert.ok(result.strengths.length > 0)
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
      question: 'What did the Three Little Pigs learn at the end of the story?',
      explanation: 'The third pig worked hard to build a brick house, so the wolf could not blow it down.',
    },
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

test('uses Pioneer Anthropic-compatible messages for live analysis', async () => {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.PIONEER_API_KEY
  const originalModel = process.env.PIONEER_MODEL
  process.env.PIONEER_API_KEY = 'test-key'
  process.env.PIONEER_MODEL = 'claude-haiku-4-5'

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.pioneer.ai/v1/messages')
    const headers = new Headers(init?.headers)
    assert.equal(headers.get('X-API-Key'), 'test-key')

    const requestBody = JSON.parse(String(init?.body)) as { model: string }
    assert.equal(requestBody.model, 'claude-haiku-4-5')

    return new Response(JSON.stringify({
      content: [{
        type: 'text',
        text: JSON.stringify({
          answerCorrect: true,
          comprehension: 'strong',
          reason: 'You explained that the brick house stayed standing and kept the pigs safe.',
          strengths: ['You used the brick house as story evidence.'],
          misconceptions: [],
          nextStep: 'Keep connecting story events to the lesson.',
          skills: {
            usesStoryEvidence: true,
            connectsCauseAndEffect: true,
            identifiesCentralLesson: true,
          },
        }),
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const result = await evaluateWithAI({
      ...base,
      question: 'What did the Three Little Pigs learn at the end of the story?',
      selectedAnswer: 'preparation',
      expectedCorrectAnswer: 'preparation',
      explanation: 'The brick house did not fall, so taking time kept the pigs safe.',
    })
    assert.equal(result.comprehension, 'strong')
    assert.equal(result.skills.connectsCauseAndEffect, true)
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.PIONEER_API_KEY
    else process.env.PIONEER_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.PIONEER_MODEL
    else process.env.PIONEER_MODEL = originalModel
  }
})
test('evaluateWithAI gracefully handles Pioneer response missing skills field', async () => {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.PIONEER_API_KEY
  process.env.PIONEER_API_KEY = 'test-key'

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              answerCorrect: true,
              comprehension: 'strong',
              reason: 'Good explanation.',
              strengths: ['Identified main idea.'],
              misconceptions: [],
              nextStep: 'Continue reading.',
            }),
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const result = await evaluateWithAI({
      ...base,
      selectedAnswer: 'purple-mist',
      expectedCorrectAnswer: 'purple-mist',
      explanation: 'He was becoming young again in a purple mist.',
    })
    assert.equal(result.comprehension, 'strong')
    assert.equal(result.skills.usesStoryEvidence, true)
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.PIONEER_API_KEY
    else process.env.PIONEER_API_KEY = originalKey
  }
})
