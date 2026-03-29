// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Quiz } from './collections/Quiz'
import { QuizResult } from './collections/QuizResult'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Quiz, QuizResult],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  /**
   * onInit runs once after Payload and the DB schema are fully ready.
   * Seeds the quiz if it doesn't already exist — safe to run on every boot.
   */
  onInit: async (payload) => {
    const existing = await payload.find({ collection: 'quiz', limit: 1 })
    if (existing.docs.length > 0) return

    await payload.create({
      collection: 'quiz',
      data: {
        title: 'What Kind of Cosmic Animal Are You?',
        questions: [
          { question: "What's your ideal weekend vibe?", options: [{ label: 'Stargazing in silence 🌌', score: 0 }, { label: 'A road trip with no map 🚗', score: 1 }, { label: 'Organizing your sock drawer 🧦', score: 2 }, { label: 'Hosting a secret underground rave 💃', score: 3 }] },
          { question: 'How do you respond to conflict?', options: [{ label: 'Meditate and wait for the storm to pass 🧘', score: 0 }, { label: 'Speak up, but keep it chill 😎', score: 1 }, { label: 'Write a pros-and-cons list 📋', score: 2 }, { label: 'Throw a pie (or a metaphorical one) 🥧', score: 3 }] },
          { question: 'Which color calls to your soul?', options: [{ label: 'Deep violet 💜', score: 0 }, { label: 'Electric blue ⚡', score: 1 }, { label: 'Earthy brown 🌱', score: 2 }, { label: 'Neon green 🟢', score: 3 }] },
          { question: 'Your dream mode of transport?', options: [{ label: 'Flying carpet 🪄', score: 0 }, { label: 'Teleportation 💫', score: 1 }, { label: 'Tank 🛡️', score: 2 }, { label: 'Unicycle on fire 🔥', score: 3 }] },
          { question: 'Pick a snack:', options: [{ label: 'Moon cheese 🧀', score: 0 }, { label: 'Spicy chips 🌶️', score: 1 }, { label: 'Wasabi popcorn 🍿', score: 2 }, { label: 'Cosmic brownies 🍫', score: 3 }] },
          { question: "What's your greatest strength?", options: [{ label: 'Patience', score: 0 }, { label: 'Curiosity', score: 1 }, { label: 'Planning', score: 2 }, { label: 'Chaos energy', score: 3 }] },
          { question: 'Choose a celestial body:', options: [{ label: 'The Moon 🌕', score: 0 }, { label: 'A comet ☄️', score: 1 }, { label: 'A black hole 🕳️', score: 2 }, { label: 'A rogue planet 🌑', score: 3 }] },
          { question: "What's your social energy?", options: [{ label: 'Low-key lurker', score: 0 }, { label: 'One-on-one convos', score: 1 }, { label: 'Team brainstormer', score: 2 }, { label: 'Life of the party', score: 3 }] },
          { question: "What's your spirit time of day?", options: [{ label: '3am under the stars 🌌', score: 0 }, { label: 'Sunrise hustle 🌅', score: 1 }, { label: 'Midday focus ☀️', score: 2 }, { label: 'Midnight rebellion 🌒', score: 3 }] },
          { question: 'What animal resonates with you most?', options: [{ label: 'Owl 🦉', score: 0 }, { label: 'Fox 🦊', score: 1 }, { label: 'Bear 🐻', score: 2 }, { label: 'Dragon 🐉', score: 3 }] },
        ],
        resultRanges: [
          { minScore: 0,  maxScore: 6,  label: '🌙 Mooncat — Mysterious, calm, and observant.' },
          { minScore: 7,  maxScore: 14, label: '🦊 Solar Fox — Clever, curious, and adaptable.' },
          { minScore: 15, maxScore: 22, label: '🐻 Cosmic Bear — Grounded, strong, and thoughtful.' },
          { minScore: 23, maxScore: 30, label: '🐉 Galactic Dragon — Wild, bold, and unstoppable.' },
        ],
      },
    })

    payload.logger.info('Quiz seeded.')
  },
})
