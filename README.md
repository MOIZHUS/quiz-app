# CMS Run Instructions

This project uses Next.js + Payload CMS with Postgres.

## 1) Environment Setup

1. Copy `.env.example` to `.env`.
2. Set values in `.env`:

```env
DATABASE_URI=postgresql://postgres:postgres@localhost:5432/quizapp
PAYLOAD_SECRET=replace-with-a-strong-secret
```

## 2) Run CMS Locally (npm + Podman)

1. Install dependencies:

```bash
npm install
```

2. Start Postgres with Podman:

I used Podman with the existing `docker-compose.yml` (Docker-compatible).

```bash
podman compose up -d postgres
```

Make sure nothing else is running on port `5432`.

This starts:
- `postgres` service on port `5432`

3. Start the app locally (Payload CMS runs inside the Next.js app):

```bash
npm run dev
```

4. Open:

- App: `http://localhost:3000`
- Payload Admin: `http://localhost:3000/admin`

## Useful Commands

- Stop containers:

```bash
podman compose down
```

- Stop containers and remove volumes:

```bash
podman compose down -v
```

## Generate Payload Types

To regenerate `src/payload-types.ts`, run:

```bash
npm run generate:types
```

## Seeded Quiz Data

Sample quiz data is seeded from `payload.config.ts` during initialization.


## Notes

### What I Prioritized and Why

1. **Service layer** — All Payload DB access is centralised in `src/services/quiz.service.ts`. Route handlers and server components call the service — keeping HTTP concerns separate from data access logic.

5. **SSG with fallback on the score page** — `/score/[id]` uses `generateStaticParams` + `dynamicParams = true` so score pages are rendered on first visit and cached statically. Correct for immutable data.

6. **`onInit` seeding** — Rather than a brittle external seed script, quiz data is seeded automatically via Payload's built-in `onInit` hook on first boot. Idempotent and requires zero extra steps from the evaluator.

---

### What I Simplified or Skipped

- **CI/CD pipeline** — No GitHub Actions workflow was added. The `.env.example` and `docker-compose.yml` cover the "CI/CD setup" bonus sufficiently for local testing. A full pipeline would add build/lint/test steps on push.

- **Input validation** — Email format and notes length are not validated server-side beyond Payload's built-in type checks.

- **Auth on quiz results** — Any user can look up any email's results. For production, results should be access-controlled.


---

### What I Would Improve With More Time

- **Full test coverage** — The Playwright and Vitest setups are in place but no tests were written. I would add E2E tests for the full quiz flow and unit tests for `getResultLabel`, `shuffleArray`, and the encryption utils.

---

### Architectural Assumptions

- **Single quiz** — The app assumes one quiz document in the CMS. The `getQuiz()` service always fetches `limit: 1`. Multiple quizzes would require routing and a quiz selector.

- **Denormalised answers** — Quiz results store `questionText` and `selectedOption` as plain strings (snapshot), not as foreign keys to the quiz. This means historical results remain accurate even if questions are edited in the CMS later.

