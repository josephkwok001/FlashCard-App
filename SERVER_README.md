# Flashcard App - Server (Express + MongoDB)

This is the backend API for the flashcard application with spaced repetition.

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally or a MongoDB Atlas connection string
- (Optional) OpenRouter API key for AI-powered card suggestions

## MongoDB Atlas setup (recommended)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up (free tier is fine).
2. Create a **free cluster** (M0). Pick a cloud region close to you.
3. **Database Access** → Add New Database User:
   - Authentication: Password
   - Pick a username and password (save these — you need them for the connection string)
   - Built-in role: `Atlas admin` or `readWriteAnyDatabase` for dev
4. **Network Access** → Add IP Address:
   - For development: **Allow Access from Anywhere** (`0.0.0.0/0`)
   - (Tighten this in production)
5. **Database** → your cluster → **Connect** → **Drivers**:
   - Driver: Node.js, version 5.5 or later
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://myuser:<password>@cluster0.xxxxx.mongodb.net/
     ```
6. Edit the string:
   - Replace `<password>` with your real database user password
   - Add the database name `flashcards` before the query string (or at the end of the path):
     ```
     mongodb+srv://myuser:MyPass123@cluster0.xxxxx.mongodb.net/flashcards
     ```
   - If the password has special characters (`@`, `#`, `:`, etc.), [URL-encode them](https://www.urlencoder.org/).
7. Put it in `.env`:
   ```
   MONGODB_URI=mongodb+srv://myuser:MyPass123@cluster0.xxxxx.mongodb.net/flashcards
   ```
8. Start the server and confirm you see `MongoDB Connected`:
   ```bash
   npm run dev:server
   ```

## Setup

> **macOS note:** Port 5000 is often used by AirPlay Receiver. This project defaults to **port 5001** instead.

1. **Create `.env` file** from the example:
   ```bash
   cp .env.example .env
   ```

2. **Update environment variables**:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong secret key for JWT tokens
   - `OPENROUTER_API_KEY` - Your OpenRouter API key (optional, for AI features)

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:server` | Start the Express server |
| `npm run dev` | Start the Vite frontend (separate terminal) |

## API Endpoints

All card routes are prefixed with `/api/cards` and require authentication via JWT token in the `Authorization` header.

### Public Endpoints

- `GET /` - Health check

### Card Endpoints (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards` | Get all cards for the authenticated user |
| GET | `/api/cards/due` | Get cards due for review |
| POST | `/api/cards` | Create a new card (`{ front, back }`) |
| PUT | `/api/cards/:id` | Update a card (`{ front, back }`) |
| DELETE | `/api/cards/:id` | Delete a card |
| POST | `/api/cards/:id/rate` | Rate a card (`{ quality: 1-4 }`) |

## Spaced Repetition Algorithm

The rating system uses the SuperMemo SM-2 algorithm:

- **1 (Again)**: Reset repetitions, interval = 1 day
- **2 (Hard)**: Repetitions = 2, interval = 6 days
- **3 (Good)**: Increment repetitions, interval *= easeFactor
- **4 (Easy)**: Increment repetitions, interval *= easeFactor * 1.3

The ease factor adjusts based on your performance (minimum 1.3).

## Development

1. Set `MONGODB_URI` in `.env` (see **MongoDB Atlas setup** above).

2. Run both server and client:
   ```bash
   # Terminal 1: Server
   npm run dev:server
   
   # Terminal 2: Client
   npm run dev
   ```

## Future Enhancements

- [ ] User authentication endpoints
- [ ] OpenRouter AI suggestion endpoint
- [ ] Statistics aggregation
- [ ] Card sharing between users
- [ ] Bulk import/export