import OpenAI from 'openai'
import { z } from 'zod'

export const evaluationRequestSchema = z.object({
  passage: z.string().min(1).max(10_000),
  question: z.string().min(1).max(1_000),
  answerChoices: z.array(z.object({ id: z.string(), label: z.string() })).min(2).max(8),
  expectedCorrectAnswer: z.string(),
  selectedAnswer: z.string(),
  explanation: z.string().min(1).max(5_000),
})

export const evaluationSchema = z.object({
  answerCorrect: z.boolean(),
  comprehension: z.enum(['strong', 'partial', 'weak']),
  reason: z.string().min(1).max(700),
})

export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>
export type Evaluation = z.infer<typeof evaluationSchema>

const SYSTEM_PROMPT = `You evaluate a student's reading comprehension from a multiple-choice response and a written explanation.

Judge these two things separately:
1. Whether the selected multiple-choice answer matches the expected correct answer.
2. Whether the written explanation demonstrates comprehension of the supplied reading.

Do not assume that an incorrect multiple-choice answer means the student failed to understand the reading. Evaluate the student's explanation independently and determine what understanding of the text it demonstrates.

Rules:
- Only use information contained in the supplied reading.
- Judge understanding, not writing quality.
- Do not reward unnecessarily fancy writing.
- Casual or grammatically imperfect writing can still demonstrate strong comprehension.
- A vague explanation that simply repeats the selected answer is not strong comprehension.
- Look for evidence that the student understands relevant events, relationships, motivations, cause and effect, or other information from the text.
- Use "strong" when the explanation accurately connects specific relevant details and the central reasoning.
- Use "partial" when it shows some relevant understanding but misses or confuses an important connection.
- Use "weak" when it is vague, unsupported, substantially contradicted by the text, or shows little relevant understanding.
- Keep the reason concise, specific, supportive, and addressed directly to the student.
- Set answerCorrect solely by comparing selectedAnswer with expectedCorrectAnswer.`

const outputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answerCorrect: { type: 'boolean' },
    comprehension: { type: 'string', enum: ['strong', 'partial', 'weak'] },
    reason: { type: 'string' },
  },
  required: ['answerCorrect', 'comprehension', 'reason'],
} as const

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

export function evaluateDemo(input: EvaluationRequest): Evaluation {
  const explanation = input.explanation.toLowerCase()
  const answerCorrect = input.selectedAnswer === input.expectedCorrectAnswer

  const evidence = [
    hasAny(explanation, ['argument', 'argue', 'fight', 'leo', 'brother']),
    hasAny(explanation, ['cool down', 'calm down', 'space', 'regret', 'getting louder']),
    hasAny(explanation, ['mom', 'mother']) && hasAny(explanation, ['involve', 'involved', 'pulled', 'blame', 'between them']),
    hasAny(explanation, ['park', 'library']) && hasAny(explanation, ['lie', 'lied', 'not true', "wasn't true"]),
  ].filter(Boolean).length

  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length
  const contradictsText =
    (hasAny(explanation, ['meet her friend', 'meeting her friend']) && evidence < 2) ||
    (hasAny(explanation, ['return the book', 'returning the book']) && !hasAny(explanation, ['lie', 'lied', 'not true'])) ||
    hasAny(explanation, ['mother made', 'mom made', 'told her to leave'])

  let comprehension: Evaluation['comprehension']
  if (evidence >= 2 && !contradictsText) comprehension = 'strong'
  else if ((evidence >= 1 || wordCount >= 12) && !contradictsText) comprehension = 'partial'
  else comprehension = 'weak'

  const reasons = {
    strong:
      'Your explanation uses specific details from the passage and connects the argument to Maya’s need to cool down. It shows that you understood both the sequence of events and her motivation.',
    partial:
      'Your explanation identifies part of Maya’s reaction, but it does not yet connect enough specific details from the passage to fully explain why she left.',
    weak:
      'Your explanation does not give enough specific evidence from the passage to show why Maya left. Try connecting the argument to what Maya hoped would happen by going outside.',
  }

  return { answerCorrect, comprehension, reason: reasons[comprehension] }
}

export async function evaluateWithAI(input: EvaluationRequest): Promise<Evaluation> {
  if (!process.env.OPENAI_API_KEY) return evaluateDemo(input)

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions: SYSTEM_PROMPT,
    input: JSON.stringify(input),
    text: {
      format: {
        type: 'json_schema',
        name: 'comprehension_evaluation',
        strict: true,
        schema: outputSchema,
      },
    },
  })

  const parsed = evaluationSchema.parse(JSON.parse(response.output_text))
  return {
    ...parsed,
    answerCorrect: input.selectedAnswer === input.expectedCorrectAnswer,
  }
}

export function usesAI() {
  return Boolean(process.env.OPENAI_API_KEY)
}
