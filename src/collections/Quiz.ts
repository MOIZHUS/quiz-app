import type { CollectionConfig } from 'payload'

/**
 * Quiz collection stores the quiz title, all questions with their options,
 * and the result ranges. Fully editable from the Payload CMS admin UI.
 */
export const Quiz: CollectionConfig = {
  slug: 'quiz',
  admin: {
    useAsTitle: 'title',
    description: 'Manage quiz questions, options, and result ranges.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Quiz Title',
    },
    {
      name: 'questions',
      type: 'array',
      label: 'Questions',
      minRows: 1,
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          label: 'Question Text',
        },
        {
          name: 'options',
          type: 'array',
          label: 'Answer Options',
          minRows: 2,
          maxRows: 4,
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'Option Label',
            },
            {
              name: 'score',
              type: 'number',
              required: true,
              label: 'Score (0–3)',
              min: 0,
              max: 3,
            },
          ],
        },
      ],
    },
    {
      name: 'resultRanges',
      type: 'array',
      label: 'Result Ranges',
      minRows: 1,
      fields: [
        {
          name: 'minScore',
          type: 'number',
          required: true,
          label: 'Min Score',
        },
        {
          name: 'maxScore',
          type: 'number',
          required: true,
          label: 'Max Score',
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Result Label',
        },
      ],
    },
  ],
}
