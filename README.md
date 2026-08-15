# Flashcards

Full-stack spaced-repetition flashcard app: React frontend, Express API, MongoDB, and JWT auth.

**Live demo:** [GitHub Pages](https://josephkwok001.github.io/my-project/)  
*(API must be running locally or deployed for login/cards to work against a backend.)*

![Study session — flip card with spaced-repetition ratings](docs/thumbnail.png)

---

## Highlights

- **JWT auth** — register / login, bcrypt password hashing, protected card routes
- **Spaced repetition** — SuperMemo SM-2 style scheduling (Again / Hard / Good / Easy)
- **Per-user decks** — cards scoped by `userId` from the token
- **React context + REST** — optimistic UI updates synced to Express/MongoDB
- **Optional AI assist** — OpenRouter suggestion for card backs
- **Typed answers** — Levenshtein distance maps typos to Again / Hard / Good / Easy
- **Inverted-index search** — word search on front and back (AND of terms)
- **Review history** — append-only log feeding last-7-days Stats

```
React (Vite)  →  Express API  →  MongoDB
     JWT in localStorage · Authorization: Bearer
     shared/ SM-2, Levenshtein, inverted index
```

---

## Screenshots

![Login](docs/login.png)
![Register](docs/register.png)
![Study](docs/studyview.png)

| Screen | File |
|--------|------|
| Hero / thumbnail | `docs/thumbnail.png` |
| Login | `docs/login.png` |
| Register | `docs/register.png` |
| Study | `docs/studyview.png` |

Still optional: `docs/cards.png`, `docs/stats.png` for My Cards and Stats.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router, Vite |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |

---

## Run locally

**Prerequisites:** Node 18+, MongoDB Atlas (or local MongoDB). Optional: OpenRouter API key for AI suggestions.

1. Install and configure env:

```bash
npm install
cp .env.example .env
```

Set at least:

```
MONGODB_URI=...
JWT_SECRET=...
PORT=5001
CLIENT_URL=http://localhost:5173
```

2. Start API and UI (two terminals):

```bash
npm run dev:server
npm run dev
```

3. Open the Vite URL (often `http://localhost:5173/my-project/`), register, then study.

```bash
npm test
```

More server detail: [SERVER_README.md](./SERVER_README.md)

---

## Algorithms

| Piece | Where | What it does |
|-------|--------|----------------|
| **SM-2 scheduler** | `shared/sm2.js` | Maps quality 1–4 → next `interval` / `easeFactor` / `nextReview`. Used by the API and optimistic UI. |
| **Levenshtein grading** | `shared/levenshtein.js` | Edit distance between typed answer and card back → SM-2 quality. Exact = Easy; relative distance ≤ 0.2 = Good; ≤ 0.4 = Hard; else Again. |
| **Inverted index** | `shared/invertedIndex.js` | Tokenize front+back; query is AND of posting lists. |
| **Review log** | `reviews` collection | Each rating appends `{ userId, cardId, quality, createdAt }`. Stats aggregates last 7 days. |

`npm test` runs `shared/*.test.js` (Node built-in test runner).

---

## API (auth + cards)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Create user + JWT |
| POST | `/api/auth/login` | Email/password + JWT |
| GET/POST/PUT/DELETE | `/api/cards`… | Require `Authorization: Bearer <token>` |
| POST | `/api/cards/:id/rate` | Update SM-2 schedule + append review |
| GET | `/api/reviews/stats?days=7` | Per-day counts and quality split |

---

## Project layout

```
src/           React UI (pages, context, api client)
server/        Express routes, controllers, models, auth middleware
shared/        SM-2, Levenshtein, inverted index (used by UI + API)
```
