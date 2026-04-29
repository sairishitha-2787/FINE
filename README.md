# FINE — Finance Intelligent Ecosystem

**A behavioral finance tracker that maps emotional triggers to spending patterns.**

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat&logo=fastapi) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-animation-black?style=flat&logo=framer)

---

## What is FINE?

FINE is a behavioral finance tracker built around a simple insight: *how* you feel when you spend matters as much as *what* you spend on. Every transaction is tagged with a mood, letting FINE surface the emotional patterns driving your finances — so you can see that you consistently overspend on food when stressed, or splurge on shopping when you're happy.

The nudge system fires at the moment of logging, showing you your own historical pattern before you commit the transaction. It's not about budgets — it's about awareness.

---

## Core Features

- **Emotion-tagged transaction logging** — every spend is paired with a mood at log time
- **Personalized nudge system** — fires post-form for discretionary spending when a behavioral pattern is detected
- **Behavioral patterns dashboard** — bento grid layout with emotional spending map, mood triggers, category breakdown, and spending timeline
- **Weekly report** — this week vs last week comparison across moods, categories, and improvements
- **Communication style-based UI** — Brief, Detailed, or Visual display modes adapt charts and copy to your preference
- **Onboarding preferences** — communication style, financial situation, and nudge preference collected on first login

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18 + Vite + Framer Motion + Recharts |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (JWT) |

---

## Project Structure

```text
FINE/
├── client/               # React frontend
│   ├── src/
│   │   ├── screens/      # All screen components
│   │   ├── components/   # Reusable components
│   │   └── api/          # API client
├── server/               # FastAPI backend
│   ├── main.py           # All endpoints
│   └── run.py            # Server runner
└── docs/                 # PRD and documentation
```

---

## Getting Started (Local Setup)

**Prerequisites:**

- Python 3.11+
- Node.js 18+
- Supabase account

**Backend:**

```bash
cd server
python -m venv venv
venv/Scripts/activate       # Windows
source venv/bin/activate    # macOS / Linux
pip install fastapi uvicorn supabase python-dotenv
# Create .env file — see Environment Variables below
python run.py
```

**Frontend:**

```bash
cd client
npm install
npm run dev
```

---

## Environment Variables

```env
# server/.env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Sign in |
| PUT | `/user/onboarding` | Save preferences |
| GET | `/transactions` | Get all transactions |
| POST | `/transactions` | Log a transaction |
| POST | `/nudge/check` | Check if nudge should fire |

---

## Key Product Decisions

- **Nudge scope** — nudges only fire for discretionary categories (Food & Dining, Shopping, Entertainment, Personal Care, Gifts, Other, Groceries). Necessary spending like Bills, Health, and EMI is excluded by design.
- **Communication style** — the `communication_style` preference set during onboarding controls how patterns and reports render: Brief users see numbers and lists, Visual users see charts, Detailed users see both.
- **Frontend-computed patterns** — all pattern analysis (emotional spending maps, weekly comparisons, improvement detection) runs on the frontend against the full transaction list. No extra API calls needed beyond the initial fetch.

---

## Status

`v1 — Complete. Built as a learning project to practice full stack development with React, FastAPI, and Supabase.`
