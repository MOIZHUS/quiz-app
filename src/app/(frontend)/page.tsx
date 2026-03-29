import React, { Suspense } from 'react'
import QuizComponent from '@/app/(frontend)/components/quiz-component'
import { getQuiz } from '@/services/quiz.service'
import './styles.css'

/**
 * SSR page — quiz data is fetched server-side on every request via the quiz service.
 * Questions are always up-to-date with the CMS, with no client-side loading state.
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const quiz = await getQuiz()

  return (
    <Suspense>
      <QuizComponent initialQuiz={quiz} />
    </Suspense>
  )
}
