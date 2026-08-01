# FINE — Finance Intelligent Ecosystem

A behavioral finance tracker that pays attention to *how you feel* when you spend, not just what you spend on.

## What it does

Every transaction gets tagged with a mood at the moment you log it. Over time, FINE surfaces the patterns that emerge — you consistently overspend on food when stressed, or splurge on shopping when you're happy. A nudge system fires right when you're logging a discretionary purchase, showing you your own historical pattern before you commit to the spend. It isn't a budgeting app; it's about building awareness of the emotional side of money.

The dashboard lays out an emotional spending map, mood triggers, category breakdowns, and a spending timeline, plus a weekly report comparing this week to last. During onboarding you pick a communication style — brief, detailed, or visual — and that choice shapes how charts and copy are presented throughout the app.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Framer Motion, Recharts |
| Backend | FastAPI (Python) |
| Database / Auth | Supabase (Postgres, row-level security, JWT auth) |

## Running it locally

Needs Python 3.11+, Node 18+, and a Supabase account.

```
cd server && python -m venv venv && venv/Scripts/activate
pip install fastapi uvicorn supabase python-dotenv
python run.py

cd client && npm install && npm run dev
```

Set `SUPABASE_URL` and `SUPABASE_KEY` in `server/.env`.

## A few product decisions worth knowing

Nudges only fire for discretionary categories — food, shopping, entertainment, personal care, gifts, groceries. Necessary spending like bills, health, and EMI is deliberately excluded. All pattern analysis (emotional maps, weekly comparisons, improvement detection) runs client-side against the full transaction list, so there's no extra API call needed beyond the initial fetch.

## Status

v1, complete. Built as a learning project to practice full-stack development with React, FastAPI, and Supabase.
