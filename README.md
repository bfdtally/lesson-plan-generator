# FAMU DRS Lesson Plan Generator

Pilot Next.js app for FAMU DRS teachers to generate Florida standards-aligned lesson plans and save submissions for administrative review.

## Routes

- `/` - teacher lesson plan generator
- `/admin` - password-protected pilot dashboard for reviewing saved lesson plans

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Required Environment Variables

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ACCESS_CODE=
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-side only. Do not expose it in browser code or prefix it with `NEXT_PUBLIC_`.

## Supabase

Run this SQL in the Supabase SQL Editor before expecting lessons to save:

```text
supabase/famu_drs_schema.sql
```

The schema creates:

- `schools`
- `profiles`
- `lesson_plans`

## Deploy on Render

Deploy as a Render Web Service, not a Static Site.

Suggested settings:

- Runtime: Node
- Build Command: `npm install && npm run build`
- Start Command: `npm run start -- -p $PORT`

After changing environment variables, use **Save, rebuild, and deploy**.
