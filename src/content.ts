export const quiz = {
  title: 'The Three Little Pigs',
  instructions: 'Choose the best answer.',
  referenceText: `In The Three Little Pigs, the first pig quickly builds a house of straw and the second pig builds a house of sticks. The wolf blows both houses down. The third pig takes the time to build a strong house of bricks, which the wolf cannot blow down. The brick house keeps the pigs safe from the wolf.`,
  questions: [
    {
      id: 'lesson',
      prompt: 'What did the Three Little Pigs learn at the end of the story?',
      choices: [
        { id: 'preparation', label: 'Hard work and preparation can protect you from trouble.' },
        { id: 'properly', label: 'Taking time to do something properly is better than rushing.' },
        { id: 'together', label: 'Staying together can help you when you are in danger.' },
        { id: 'wolves', label: 'Wolves should never be trusted.' },
      ],
      correctAnswerId: 'preparation',
      explanationPrompt: 'What happened in the story that supports your answer?',
    },
  ],
} as const

export type QuestionId = (typeof quiz.questions)[number]['id']
