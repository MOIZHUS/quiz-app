'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Option = { label: string; score: number }
type Question = { id: string; question: string; options: Option[] }
type ResultRange = { minScore: number; maxScore: number; label: string }
export type QuizData = { title: string; questions: Question[]; resultRanges: ResultRange[] }

type AnswerBreakdown = {
  questionId: number
  questionText: string
  selectedOption: string
  score: number
}

type PastResult = {
  id: string
  totalScore: number
  resultLabel: string
  createdAt: string
}

type AppView = 'quiz' | 'score' | 'lookup'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shuffles an array in-place using Fisher-Yates and returns it. */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Returns the result label for a given score, including the easter egg. */
function getResultLabel(score: number, results: ResultRange[]): string {
  if (score === 13) return 'You lucky fucker! You scored 13 exactly.'
  const match = results.find((r) => score >= r.minScore && score <= r.maxScore)
  return match ? match.label : 'No result found'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBreakdown({ answers }: { answers: AnswerBreakdown[] }) {
  return (
    <section className="bg-white/5 rounded-lg p-4 space-y-2">
      <h3 className="font-semibold text-lg mb-3">Score Breakdown</h3>
      {answers.map((a, i) => (
        <div key={i} className="flex justify-between items-start gap-4 text-sm border-b border-white/10 pb-2">
          <span className="text-white/70 flex-1">{a.questionText}</span>
          <span className="text-white/90 flex-1 text-center">{a.selectedOption}</span>
          <span className="text-blue-400 font-semibold w-8 text-right">+{a.score}</span>
        </div>
      ))}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  initialQuiz: QuizData | null
}

export default function QuizComponent({ initialQuiz }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<AppView>(() =>
    searchParams.get('lookup') === 'true' ? 'lookup' : 'quiz'
  )
  const [quizData] = useState<QuizData | null>(initialQuiz)
  const [shuffledOptions] = useState<Record<string, Option[]>>(() => {
    if (!initialQuiz) return {}
    const shuffled: Record<string, Option[]> = {}
    initialQuiz.questions.forEach((q) => {
      shuffled[q.id] = shuffleArray(q.options)
    })
    return shuffled
  })
  const [answers, setAnswers] = useState<Record<string, { option: Option; questionText: string }>>({})
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pastResults, setPastResults] = useState<PastResult[]>([])
  // Re-shuffled options are stored separately so restart re-shuffles without re-fetching
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState<Record<string, Option[]>>(shuffledOptions)

  const totalScore = Object.values(answers).reduce((sum, { option }) => sum + option.score, 0)

  const allAnswered = quizData !== null && Object.keys(answers).length === quizData.questions.length

  const buildAnswerBreakdown = useCallback((): AnswerBreakdown[] => {
    if (!quizData) return []
    return quizData.questions.map((q, i) => ({
      questionId: i + 1,
      questionText: q.question,
      selectedOption: answers[q.id]?.option.label ?? '(not answered)',
      score: answers[q.id]?.option.score ?? 0,
    }))
  }, [quizData, answers])

  const handleSelectAnswer = (questionId: string, option: Option, questionText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { option, questionText } }))
  }

  const handleSubmitQuiz = () => {
    setView('score')
  }

  const handleSaveResults = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          totalScore,
          resultLabel: getResultLabel(totalScore, quizData?.resultRanges ?? []),
          answers: buildAnswerBreakdown(),
          notes: notes || undefined,
        }),
      })
      if (res.ok) {
        const { id } = await res.json()
        // Redirect to the SSR score page
        router.push(`/score/${id}`)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleLookup = async () => {
    if (!lookupEmail.trim()) return
    setLookupStatus('loading')
    setPastResults([])
    try {
      const res = await fetch(`/api/quiz/results?email=${encodeURIComponent(lookupEmail.trim())}`)
      const data = await res.json()
      if (res.ok && data.results?.length) {
        setPastResults(data.results)
        setLookupStatus('idle')
      } else {
        setLookupStatus('error')
      }
    } catch {
      setLookupStatus('error')
    }
  }

  const handleRestart = () => {
    setView('quiz')
    setAnswers({})
    setNotes('')
    setEmail('')
    setSaveStatus('idle')
    // Re-shuffle options on restart
    if (quizData) {
      const reshuffled: Record<string, Option[]> = {}
      quizData.questions.forEach((q) => {
        reshuffled[q.id] = shuffleArray(q.options)
      })
      setCurrentShuffledOptions(reshuffled)
    }
  }

  // ---------------------------------------------------------------------------
  // Render: No quiz in CMS (server passed null)
  // ---------------------------------------------------------------------------

  if (!quizData) {
    return (
      <main className="max-w-xl mx-auto p-6 text-center space-y-4">
        <p className="text-red-400">No quiz found. Please add quiz data in the CMS admin.</p>
        <Link href="/admin" className="text-blue-400 underline text-sm">
          Go to CMS Admin →
        </Link>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Lookup view
  // ---------------------------------------------------------------------------

  if (view === 'lookup') {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">{quizData.title}</h1>
        <h2 className="text-xl font-semibold text-center">Retrieve Past Results</h2>

        <div className="space-y-3">
          <label htmlFor="lookup-email" className="block font-semibold">
            Enter your email
          </label>
          <input
            id="lookup-email"
            type="email"
            value={lookupEmail}
            onChange={(e) => { setLookupEmail(e.target.value); setLookupStatus('idle'); setPastResults([]) }}
            className="w-full p-2 border rounded text-black bg-white"
            placeholder="you@example.com"
          />
          <button
            onClick={handleLookup}
            disabled={lookupStatus === 'loading' || !lookupEmail.trim()}
            className="w-full py-2 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lookupStatus === 'loading' ? 'Looking up…' : 'Find My Results'}
          </button>
          {lookupStatus === 'error' && (
            <p className="text-red-400 text-sm text-center">No results found for this email.</p>
          )}
        </div>

        {pastResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Past Submissions</h3>
            {pastResults.map((r) => (
              <a
                key={r.id}
                href={`/score/${r.id}`}
                className="block w-full text-left p-3 border rounded hover:bg-white/10 space-y-1"
              >
                <div className="font-semibold">{r.resultLabel}</div>
                <div className="text-sm text-white/60">
                  Score: {r.totalScore} · {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </a>
            ))}
          </div>
        )}

        <button
          onClick={() => setView('quiz')}
          className="w-full py-2 rounded border border-white/30 hover:bg-white/10 text-sm"
        >
          ← Back to Quiz
        </button>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Score view
  // ---------------------------------------------------------------------------

  if (view === 'score') {
    const resultLabel = getResultLabel(totalScore, quizData.resultRanges)
    const breakdown = buildAnswerBreakdown()

    return (
      <main className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">{quizData.title}</h1>

        <div className="text-center space-y-2">
          <p className="text-4xl font-bold">{totalScore}</p>
          <p className="text-white/60 text-sm">out of {quizData.questions.length * 3}</p>
          <p className="text-xl italic mt-2">{resultLabel}</p>
        </div>

        <ScoreBreakdown answers={breakdown} />

        <section className="space-y-2">
          <label htmlFor="notes" className="block font-semibold">
            Notes <span className="text-white/50 font-normal text-sm">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded text-black bg-white text-sm"
            placeholder="Write your thoughts here…"
          />
        </section>

        <section className="space-y-2">
          <label htmlFor="email" className="block font-semibold">
            Email <span className="text-white/50 font-normal text-sm">(optional — saves your result)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded text-black bg-white text-sm"
            placeholder="you@example.com"
          />
        </section>

        {saveStatus === 'error' && (
          <p className="text-red-400 text-sm text-center">Failed to save. Please try again.</p>
        )}

        <button
          onClick={handleSaveResults}
          disabled={saving}
          className="w-full py-3 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving & redirecting…' : 'Save Results'}
        </button>

        <p className="text-white/40 text-xs text-center">
          Saving redirects you to a shareable score page
        </p>

        <button
          onClick={handleRestart}
          className="w-full py-2 rounded border border-white/30 hover:bg-white/10 text-sm"
        >
          Retake Quiz Without Saving
        </button>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Quiz view (default)
  // ---------------------------------------------------------------------------

  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{quizData.title}</h1>
        <button
          onClick={() => setView('lookup')}
          className="text-sm text-blue-400 hover:underline"
        >
          Past results →
        </button>
      </div>

      <p className="text-white/50 text-sm">
        {Object.keys(answers).length} / {quizData.questions.length} answered
      </p>

      {quizData.questions.map((q) => (
        <section key={q.id} className="border border-white/20 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">{q.question}</h2>
          <div className="space-y-2">
            {(currentShuffledOptions[q.id] ?? q.options).map((opt) => {
              const isSelected = answers[q.id]?.option.label === opt.label
              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelectAnswer(q.id, opt, q.question)}
                  className={`block w-full text-left px-3 py-2 rounded border text-sm transition-colors
                    ${isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:border-white/40'
                    }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <button
        disabled={!allAnswered}
        onClick={handleSubmitQuiz}
        className={`w-full py-3 rounded font-semibold text-white transition-colors
          ${allAnswered ? 'bg-blue-700 hover:bg-blue-800' : 'bg-white/20 cursor-not-allowed opacity-50'}`}
      >
        {allAnswered ? 'Submit Quiz' : `Answer all ${quizData.questions.length} questions to continue`}
      </button>
    </main>
  )
}
