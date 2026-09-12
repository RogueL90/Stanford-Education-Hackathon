import OpenAI from 'openai'
import { z } from 'zod'

export const evaluationRequestSchema = z.object({
  passage: z.string().min(1).max(10_000),
  question: z.string().min(1).max(1_000),
  answerChoices: z.array(z.object({ id: z.string(), label: z.string() })).min(2).max(8),
  expectedCorrectAnswer: z.string(),
  selectedAnswer: z.string(),
  explanation: z.string().max(5_000),
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
- If no written explanation is provided, treat the multiple-choice response as the available evidence: use "strong" for a correct answer and "weak" for an incorrect answer.
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

type DemoRubric = {
  questionIncludes: string
  evidenceGroups: string[][]
  strongThreshold: number
}

const demoRubrics: DemoRubric[] = [
  {
    questionIncludes: 'moral of tikki tikki tembo',
    evidenceGroups: [
      ['long name', 'long names', 'say his name', 'saying his name'],
      ['delay', 'too long', 'rescue', 'save him', 'get help', 'well'],
      ['short name', 'short names'],
    ],
    strongThreshold: 2,
  },
  {
    questionIncludes: 'biggest challenge for chang',
    evidenceGroups: [
      ['long name', 'whole name', 'say his name', 'saying his name'],
      ['help', 'rescue', 'save', 'old man'],
      ['brother', 'tikki'],
    ],
    strongThreshold: 2,
  },
  {
    questionIncludes: 'mother respond',
    evidenceGroups: [['cannot hear', "can't hear", 'could not hear', "couldn't hear"]],
    strongThreshold: 1,
  },
  {
    questionIncludes: 'old man for help',
    evidenceGroups: [['ladder']],
    strongThreshold: 1,
  },
  {
    questionIncludes: 'chang’s name mean',
    evidenceGroups: [
      ['little or nothing', 'means little', 'meant little', 'means nothing', 'meant nothing'],
      ['short name', 'younger brother'],
    ],
    strongThreshold: 1,
  },
  {
    questionIncludes: 'lesson did chang',
    evidenceGroups: [
      ['listen', 'listened'],
      ['mother', 'mom'],
      ['advice', 'warned', 'warning', 'stay away', 'well'],
    ],
    strongThreshold: 2,
  },
  {
    questionIncludes: 'old man dreaming',
    evidenceGroups: [
      ['purple mist', 'purple'],
      ['young again', 'becoming young', 'young'],
      ['glittering gateway', 'gateway', 'gate'],
      ['jeweled blossom', 'blossom', 'flower', 'jewel'],
      ['floating', 'float'],
    ],
    strongThreshold: 2,
  },
]

export function evaluateDemo(input: EvaluationRequest): Evaluation {
  const explanation = input.explanation.toLowerCase()
  const answerCorrect = input.selectedAnswer === input.expectedCorrectAnswer

  if (!explanation.trim()) {
    return {
      answerCorrect,
      comprehension: answerCorrect ? 'strong' : 'weak',
      reason: answerCorrect
        ? 'You recognized that careful work and preparation kept the pigs safe from the wolf.'
        : 'The brick house shows that hard work and preparation can protect you from trouble.',
    }
  }

  const rubric = demoRubrics.find(({ questionIncludes }) =>
    input.question.toLowerCase().includes(questionIncludes),
  )
  const evidence = rubric?.evidenceGroups.filter((terms) => hasAny(explanation, terms)).length ?? 0
  const strongThreshold = rubric?.strongThreshold ?? 2
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length

  let comprehension: Evaluation['comprehension']
  if (evidence >= strongThreshold) comprehension = 'strong'
  else if (evidence >= 1 || wordCount >= 12) comprehension = 'partial'
  else comprehension = 'weak'

  const reasons = {
    strong:
      'Your explanation recalls specific details from this part of the story and connects them clearly to your answer.',
    partial:
      'Your explanation remembers a relevant part of the story. Add one more specific detail or explain how that detail supports your answer.',
    weak:
      'Your explanation does not yet include a specific detail from this part of the story. Try writing what happened or what you remember hearing.',
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
