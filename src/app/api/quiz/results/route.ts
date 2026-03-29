import { NextRequest, NextResponse } from 'next/server'
import { getResultsByEmail } from '@/services/quiz.service'

/**
 * GET /api/quiz/results?email=user@example.com
 * Returns all past quiz results for a given email, newest first.
 * Notes are decrypted automatically via the QuizResult collection afterRead hook.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const results = await getResultsByEmail(email)

    if (!results.length) {
      return NextResponse.json({ error: 'No results found for this email.' }, { status: 404 })
    }

    return NextResponse.json({ results }, { status: 200 })
  } catch (err) {
    console.error('[quiz/results]', err)
    return NextResponse.json({ error: 'Failed to retrieve quiz results.' }, { status: 500 })
  }
}
