export const quiz = {
  title: 'Reading Comprehension Check',
  passageTitle: 'A Walk Around the Block',
  passage: [
    `Maya found her brother Leo in the kitchen, searching through a stack of mail. Their grandmother's birthday card was missing, and Leo insisted Maya had moved it. Maya knew she had left it by the fruit bowl, but the more she tried to explain, the louder their argument became.`,
    `Maya grabbed her jacket and stepped outside. She was not going to meet anyone. She walked toward the empty park at the end of the block because she needed time to cool down before she said something she would regret.`,
    `When her mother called, Maya said she was returning a library book. It was not true, but she did not want her mother pulled into the argument or blaming Leo before the two of them had a chance to sort it out.`,
  ],
  question: 'Why does Maya leave the house after talking to her brother?',
  choices: [
    { id: 'friend', label: 'She wants to meet her friend.' },
    { id: 'space', label: 'She needs space after their argument.' },
    { id: 'mother', label: 'Her mother asks her to leave.' },
    { id: 'library', label: 'She needs to return a library book.' },
  ],
  correctAnswerId: 'space',
} as const

export type ChoiceId = (typeof quiz.choices)[number]['id']

export const demoResponses: Array<{
  label: string
  description: string
  answerId: ChoiceId
  explanation: string
}> = [
  {
    label: 'Wrong answer, strong explanation',
    description: 'Shows why correctness and understanding are different.',
    answerId: 'friend',
    explanation:
      "Maya leaves right after the argument with Leo and walks to the park to cool down before she says something she'll regret. She also lies about the library book because she doesn't want her mom pulled into their argument.",
  },
  {
    label: 'Correct answer, weak explanation',
    description: 'The answer is right, but the reasoning is too vague.',
    answerId: 'space',
    explanation: 'Because she was mad.',
  },
  {
    label: 'Correct answer, strong explanation',
    description: 'Both the answer and the reasoning show understanding.',
    answerId: 'space',
    explanation:
      "The argument with Leo was getting louder, so Maya left to cool down before saying something she would regret. Her walk gave her space, and she wanted to resolve the problem with Leo without involving her mom.",
  },
]
