export const quiz = {
  title: 'Tikki Tikki Tembo Comprehension Check',
  instructions: 'Choose the best answer. Then explain what you remember from the story.',
  referenceText: `In the story, the older brother has a very long honorable name, while Chang's short name means little or nothing. Their mother warns the boys not to play near the well. When each brother falls in, getting help is complicated by the older brother's long name. The Old Man uses his ladder to rescue them. When Chang wakes him, the Old Man has been dreaming that he is floating through purple mist, becoming young again, and seeing glittering gateways and jeweled blossoms. After the accidents, the boys learn that they should have listened to their mother's warning.`,
  questions: [
    {
      id: 'moral',
      prompt: 'What is the moral of Tikki Tikki Tembo?',
      choices: [
        { id: 'kind', label: 'To always be kind.' },
        { id: 'slow', label: 'Slow and steady wins the race.' },
        { id: 'short-names', label: "You shouldn't give your children long names." },
        { id: 'ladder', label: 'You should always sleep with a ladder.' },
      ],
      correctAnswerId: 'short-names',
      explanationPrompt: 'What in the story led you to your answer?',
    },
    {
      id: 'challenge',
      prompt: 'What was the biggest challenge for Chang?',
      choices: [
        { id: 'long-name', label: 'Getting help for his brother because he had to say his long name.' },
        { id: 'neighborhood', label: 'Running all over the neighborhood.' },
        { id: 'attention', label: "Getting his mother's attention." },
        { id: 'short-name', label: 'His short name.' },
      ],
      correctAnswerId: 'long-name',
      explanationPrompt: 'What in the story led you to your answer?',
    },
    {
      id: 'mother-response',
      prompt: 'How does Chang’s mother respond to him when he asks for help?',
      choices: [
        { id: 'cannot-hear', label: '“I cannot hear you.”' },
        { id: 'cold-water', label: '“The water is so cold.”' },
        { id: 'long-name', label: '“Your brother has a long name.”' },
        { id: 'chores', label: '“Did you do your chores?”' },
      ],
      correctAnswerId: 'cannot-hear',
      explanationPrompt: 'What do you remember about this part of the story?',
    },
    {
      id: 'old-man',
      prompt: 'Why do both boys have to go ask the Old Man for help?',
      choices: [
        { id: 'strength', label: 'They need his super-human strength.' },
        { id: 'wise', label: 'He is wise.' },
        { id: 'mother', label: 'Their mother needs help.' },
        { id: 'ladder', label: 'He has the ladder.' },
      ],
      correctAnswerId: 'ladder',
      explanationPrompt: 'Why was the Old Man important in this situation?',
    },
    {
      id: 'chang-name',
      prompt: 'What does Chang’s name mean?',
      choices: [
        { id: 'honorable', label: 'Most honorable' },
        { id: 'nothing', label: 'Little or nothing' },
        { id: 'younger', label: 'Younger child' },
        { id: 'foolish', label: 'Foolish boy' },
      ],
      correctAnswerId: 'nothing',
      explanationPrompt: "What do you remember about how the brothers' names were described?",
    },
    {
      id: 'lesson',
      prompt: 'What lesson did Chang and Tikki Tikki learn after their accident?',
      choices: [
        { id: 'cold-water', label: 'Water in the well is cold.' },
        { id: 'wise', label: 'The Old Man is wise.' },
        { id: 'listen', label: 'They should have listened to their mother’s advice.' },
        { id: 'ladder-fun', label: 'Ladders are fun to climb.' },
      ],
      correctAnswerId: 'listen',
      explanationPrompt: 'What happened in the story that supports your answer?',
    },
    {
      id: 'dream',
      prompt: 'What was the Old Man dreaming about when Chang woke him up?',
      choices: [
        { id: 'treasure', label: 'Finding a treasure hidden inside the well.' },
        {
          id: 'purple-mist',
          label: 'Floating into a purple mist and becoming young again, surrounded by glittering gateways and jeweled blossoms.',
        },
        { id: 'clouds', label: 'Climbing a ladder into the clouds.' },
        { id: 'playing', label: 'Playing with Chang and Tikki Tikki Tembo when they were younger.' },
      ],
      correctAnswerId: 'purple-mist',
      explanationPrompt: "What details from the Old Man's description do you remember?",
    },
  ],
} as const

export type QuestionId = (typeof quiz.questions)[number]['id']
