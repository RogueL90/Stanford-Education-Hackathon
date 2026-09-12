import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateDemo, type EvaluationRequest } from './evaluate.js'

const base: EvaluationRequest = {
  passage: 'Maya left after arguing with Leo so she could cool down.',
  question: 'Why did Maya leave?',
  answerChoices: [
    { id: 'friend', label: 'To see a friend' },
    { id: 'space', label: 'To get space' },
  ],
  expectedCorrectAnswer: 'space',
  selectedAnswer: 'friend',
  explanation: '',
}

test('wrong answer can still show strong comprehension', () => {
  const result = evaluateDemo({
    ...base,
    explanation: "She left after the argument with Leo to cool down before she said something she'd regret, and she did not want her mom involved.",
  })
  assert.equal(result.answerCorrect, false)
  assert.equal(result.comprehension, 'strong')
})

test('correct answer with vague reasoning is weak', () => {
  const result = evaluateDemo({
    ...base,
    selectedAnswer: 'space',
    explanation: 'Because she was mad.',
  })
  assert.equal(result.answerCorrect, true)
  assert.equal(result.comprehension, 'weak')
})

test('correct answer with textual reasoning is strong', () => {
  const result = evaluateDemo({
    ...base,
    selectedAnswer: 'space',
    explanation: 'The argument with her brother got louder, so she needed space to cool down before saying something she would regret.',
  })
  assert.equal(result.answerCorrect, true)
  assert.equal(result.comprehension, 'strong')
})
