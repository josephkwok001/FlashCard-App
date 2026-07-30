import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cardRoutes from './routes/cards.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ message: 'Flashcard API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function startServer() {
  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'E',location:'server/server.js:42',message:'startServer entry',data:{port:PORT,hasMongoUri:Boolean(process.env.MONGODB_URI),nodeVersion:process.version},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  await connectDB();

  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'E',location:'server/server.js:48',message:'connectDB resolved — about to call app.listen',data:{port:PORT},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const server = app.listen(PORT, () => {
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'E',location:'server/server.js:54',message:'app.listen SUCCESS — server is accepting requests',data:{port:PORT},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
