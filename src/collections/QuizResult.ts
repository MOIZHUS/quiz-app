import type { CollectionConfig } from 'payload'
import { encrypt, decrypt } from '../lib/encryption'

/**
 * QuizResult stores a user's quiz submission.
 * The `notes` field is encrypted before save and decrypted after read
 * using Caesar cipher hooks — never stored in plain text.
 */
export const QuizResult: CollectionConfig = {
  slug: 'quiz-results',
  admin: {
    useAsTitle: 'email',
    description: 'Stores user quiz submissions with encrypted notes.',
  },
  access: {
    read: () => true,
    create: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.notes && typeof data.notes === 'string' && data.notes.trim() !== '') {
          data.notes = encrypt(data.notes)
        }
        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (doc.notes && typeof doc.notes === 'string' && doc.notes.trim() !== '') {
          doc.notes = decrypt(doc.notes)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: false,
    },
    {
      name: 'totalScore',
      type: 'number',
      required: true,
      label: 'Total Score',
    },
    {
      name: 'resultLabel',
      type: 'text',
      required: true,
      label: 'Result Label',
    },
    {
      name: 'answers',
      type: 'array',
      label: 'Answer Breakdown',
      fields: [
        {
          name: 'questionId',
          type: 'number',
          required: true,
          label: 'Question ID',
        },
        {
          name: 'questionText',
          type: 'text',
          required: true,
          label: 'Question Text',
        },
        {
          name: 'selectedOption',
          type: 'text',
          required: true,
          label: 'Selected Option',
        },
        {
          name: 'score',
          type: 'number',
          required: true,
          label: 'Score',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes (encrypted at rest)',
      required: false,
    },
  ],
}
