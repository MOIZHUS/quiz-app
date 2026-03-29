/**
 * Quiz Service
 * ------------
 * Centralises all Payload CMS data access for the quiz domain.
 * Route handlers and server components call these functions instead of
 * talking to Payload directly — keeping DB logic out of the HTTP layer.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { QuizData } from '@/app/(frontend)/components/quiz-component'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnswerBreakdown = {
  questionId: number
  questionText: string
  selectedOption: string
  score: number
}

export type SaveResultInput = {
  email?: string
  totalScore: number
  resultLabel: string
  answers: AnswerBreakdown[]
  notes?: string
}

export type QuizResultDoc = {
  id: number
  email?: string | null
  totalScore: number
  resultLabel: string
  answers?: AnswerBreakdown[] | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

/**
 * Fetches the first quiz from the CMS and maps Payload's nullable fields
 * to the strict QuizData shape expected by the frontend component.
 * Returns null if no quiz has been seeded yet.
 */
export async function getQuiz(): Promise<QuizData | null> {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({ collection: 'quiz', limit: 1 })
  const raw = docs[0] ?? null

  if (!raw) return null

  return {
    title: raw.title,
    questions: (raw.questions ?? []).map((q) => ({
      id: q.id ?? '',
      question: q.question,
      options: (q.options ?? []).map((o) => ({ label: o.label, score: o.score })),
    })),
    resultRanges: (raw.resultRanges ?? []).map((r) => ({
      minScore: r.minScore,
      maxScore: r.maxScore,
      label: r.label,
    })),
  }
}

// ---------------------------------------------------------------------------
// Quiz Results
// ---------------------------------------------------------------------------

/**
 * Saves a quiz result to the DB.
 * Notes are encrypted automatically via the QuizResult collection beforeChange hook.
 */
export async function saveQuizResult(input: SaveResultInput): Promise<{ id: number }> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.create({
    collection: 'quiz-results',
    data: {
      email: input.email || undefined,
      totalScore: input.totalScore,
      resultLabel: input.resultLabel,
      answers: input.answers,
      notes: input.notes || undefined,
    },
  })

  return { id: result.id }
}

/**
 * Retrieves all past quiz results for a given email, newest first.
 * Notes are decrypted automatically via the QuizResult collection afterRead hook.
 */
export async function getResultsByEmail(email: string): Promise<QuizResultDoc[]> {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'quiz-results',
    where: { email: { equals: email } },
    sort: '-createdAt',
  })

  return docs as QuizResultDoc[]
}

/**
 * Retrieves a single quiz result by ID.
 * Notes are decrypted automatically via the QuizResult collection afterRead hook.
 * Returns null if not found.
 */
export async function getResultById(id: string): Promise<QuizResultDoc | null> {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.findByID({ collection: 'quiz-results', id })
    return result as QuizResultDoc
  } catch {
    return null
  }
}
