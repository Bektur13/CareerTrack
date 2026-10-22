# CareerTrack

A full-stack job application tracker: a Kanban board for your pipeline, real-data analytics, stale-application follow-up reminders, and a Chrome extension that clips job postings from Greenhouse, LinkedIn, and Handshake straight into your dashboard.

**Live app:** [career-track-set.vercel.app](https://career-track-set.vercel.app/)

## Features

- **Pipeline board** — drag-and-drop Kanban across Applied → Screening → Technical → Offer → Rejected, with a confetti celebration on landing an offer
- **Browser extension** — one click on a Greenhouse, LinkedIn, or Handshake job posting saves the role, company, and description into your account, with duplicate detection
- **Follow-up reminders** — a banner surfaces applications that have gone quiet for too long, with a ready-to-edit follow-up email
- **Analytics** — submission velocity, interview rate, and offer conversion computed from your real application history
- **Contacts & notes** — attach recruiter/interviewer contacts and running notes to any application
- **Authentication** — Clerk-backed accounts for the web dashboard; a personal API key for the extension

## Tech stack

| Layer | Tech |
|---|---|
| Web app | Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui |
| API | Next.js Route Handlers (dashboard) + a separate Express API (extension) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Clerk (`@clerk/nextjs` for the web app, `@clerk/express` for the API) |
| Extension | Chrome Manifest V3 (popup, background service worker, per-site parsers) |
| Drag & drop | dnd-kit |
| Charts | Recharts |
| Analytics | Vercel Analytics |

## Project structure

```
src/
  app/
    (protected)/        # auth-gated pages: dashboard, analytics, settings
    api/                # same-origin Next.js API routes used by the dashboard
    sign-in/, sign-up/  # Clerk auth pages
    extension/          # web-side pages for the extension's connect-account flow
  components/           # dashboard UI (Kanban board, dialogs, charts, etc.)
  lib/                  # client-side API wrapper, Prisma client, auth helpers
  routes/, middlewares/ # Express API (applications CRUD, auth, validation)
  index.ts              # Express server entry point
prisma/
  schema.prisma         # User, Company, JobApplication, Contact, Note models
extension/
  popup/, background.js, parsers/, lib/   # the Chrome extension itself
```

### Why two API layers?

The dashboard talks to same-origin Next.js Route Handlers (`src/app/api/**`), authenticated via a Clerk session cookie. The Chrome extension talks to a separate Express API (`src/index.ts`, `src/routes/`), authenticated via a per-user API key — a browser extension popup can't share Clerk's session cookie with the web app's origin, so it needs its own auth path. Both sides resolve to the same `User`/`JobApplication` tables in Postgres.

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. [Prisma Postgres](https://console.prisma.io))
- A [Clerk](https://clerk.com) application (for auth)

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://...?sslmode=verify-full"   # pooled connection, used at runtime
DIRECT_URL="postgresql://...?sslmode=verify-full"      # direct connection, used for migrations

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

PORT=3001   # Express API port
```

Apply the database schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

### Run it

The web app and the Express API run as two separate processes:

```bash
npm run dev      # Next.js dashboard — http://localhost:3000
npm run server   # Express API (extension backend) — http://localhost:3001
```

### Load the extension

1. Open `chrome://extensions`, enable **Developer mode**
2. **Load unpacked** → select the `extension/` folder
3. Click the extension icon → **Connect account** → sign in on the web app to link your API key

## Deployment

- **Web app** — deployed on [Vercel](https://vercel.com); `npm run build` / `npm run start`. `postinstall` runs `prisma generate` automatically after every install.
- **Express API** — deployed separately (e.g. Render; see `render.yaml`), since Vercel doesn't run long-lived Express servers. Needs the same `DATABASE_URL`/`DIRECT_URL`/`CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` environment variables set on whichever host runs it.
- **CORS** — the Express API's allowlist (`src/index.ts`) permits the production web origin and any `chrome-extension://` origin; update it if you deploy to a different domain.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run server` | Start the Express API (extension backend) |
| `npm run build` | Production build of the Next.js app |
| `npm run start` | Start the production Next.js build |
| `npm run lint` | Run ESLint |

## Database schema

- **User** — Clerk-linked account, holds the extension API key
- **Company** — shared across users; applications and contacts reference it
- **JobApplication** — role, stage, dates, salary, skills, source (which site it was clipped from)
- **Contact** — recruiters/interviewers, linked to a company and optionally to applications
- **Note** — free-text notes attached to an application or contact
