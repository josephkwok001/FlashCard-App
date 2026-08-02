import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cardRoutes from './routes/cards.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';

dotenv.config();

// if process.env.PORT is undefined or empty, use 5001
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
// cors(...) lets the React app on :5173 call this API (browser would otherwise block it)

app.use(express.json());
// parses JSON bodies into req.body (needed for createCard, rateCard, etc.)

app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ message: 'Flashcard API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/ai', aiRoutes);

// error handling
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// catch all 404 errors
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      console.error('On macOS, port 5000 is often taken by AirPlay Receiver — use PORT=5001 in .env');
      process.exit(1);
    }
    throw err;
  });
}

startServer();

export default app;
