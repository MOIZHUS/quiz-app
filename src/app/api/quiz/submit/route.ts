import { NextRequest, NextResponse } from 'next/server'
import { saveQuizResult, type SaveResultInput } from '@/services/quiz.service'

/**
 * POST /api/quiz/submit
 * Saves a quiz result. Email and notes are optional.
 * Notes encryption is handled by the QuizResult collection beforeChange hook.
 */
export async function POST(req: NextRequest) {
  try {
    const body: SaveResultInput = await req.json()
    const { totalScore, resultLabel, answers } = body

    if (totalScore === undefined || !resultLabel || !answers?.length) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const { id } = await saveQuizResult(body)

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    console.error('[quiz/submit]', err)
    return NextResponse.json({ error: 'Failed to save quiz result.' }, { status: 500 })
  }
}
