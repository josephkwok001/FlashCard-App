# Flashcard App - Server (Express + MongoDB)

This is the backend API for the flashcard application with spaced repetition.

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally or a MongoDB Atlas connection string
- (Optional) OpenRouter API key for AI-powered card suggestions

## Setup

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

1. Start MongoDB:
   ```bash
   # On Mac with Homebrew
   brew services start mongodb-community
   
   # Or use MongoDB Atlas connection string in .env
   ```

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