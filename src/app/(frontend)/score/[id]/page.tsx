import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResultById } from '@/services/quiz.service'
import '../../styles.css'

type Props = {
  params: Promise<{ id: string }>
}

/**
 * SSG with fallback — score pages are generated on first request then cached.
 *
 * generateStaticParams returns [] because result IDs only exist at runtime
 * (created when users submit). dynamicParams = true (Next.js default) means:
 *   - IDs not in generateStaticParams are rendered on-demand on first visit
 *   - The rendered HTML is then cached as a static page for all future visits
 *   - No DB hit on repeat visits to the same score page
 *
 * This is correct for score pages since a saved result never changes.
 */
export async function generateStaticParams() {
  return []
}

export const dynamicParams = true

export default async function ScorePage({ params }: Props) {
  const { id } = await params

  const result = await getResultById(id)
  if (!result) notFound()

  const { totalScore, resultLabel, answers, notes, email, createdAt } = result

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">What Kind of Cosmic Animal Are You?</h1>

      {/* Score summary */}
      <div className="text-center space-y-2">
        <p className="text-5xl font-bold">{totalScore}</p>
        <p className="text-white/50 text-sm">total score</p>
        <p className="text-xl italic mt-2">{resultLabel}</p>
      </div>

      {/* Score breakdown */}
      {answers && answers.length > 0 && (
        <section className="bg-white/5 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold text-lg mb-3">Score Breakdown</h2>
          {answers.map((a, i) => (
            <div
              key={i}
              className="flex justify-between items-start gap-4 text-sm border-b border-white/10 pb-2"
            >
              <span className="text-white/70 flex-1">{a.questionText}</span>
              <span className="text-white/90 flex-1 text-center">{a.selectedOption}</span>
              <span className="text-blue-400 font-semibold w-8 text-right">+{a.score}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-semibold text-sm">
            <span>Total</span>
            <span className="text-blue-400">{totalScore}</span>
          </div>
        </section>
      )}

      {/* Notes */}
      {notes && (
        <section className="bg-white/5 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-white/80 text-sm whitespace-pre-wrap">{notes}</p>
        </section>
      )}

      {/* Meta */}
      <div className="text-center text-xs text-white/30 space-y-1">
        {email && <p>Saved by {email}</p>}
        <p>Submitted on {new Date(createdAt).toLocaleString()}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex-1 py-2 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 text-sm text-center"
        >
          Take Quiz Again
        </Link>
        <Link
          href="/?lookup=true"
          className="flex-1 py-2 rounded border border-white/30 hover:bg-white/10 text-sm text-center"
        >
          Look Up Past Results
        </Link>
      </div>
    </main>
  )
}
