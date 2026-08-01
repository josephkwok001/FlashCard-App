import mongoose from 'mongoose';

/** Connection state so routes and the health endpoint can report it. */
export const dbStatus = { connected: false, lastError: null };

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.startsWith('mongodb')) {
    dbStatus.lastError = 'MONGODB_URI is missing or invalid in .env';
    console.error(dbStatus.lastError);
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    dbStatus.connected = true;
    dbStatus.lastError = null;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    dbStatus.connected = false;
    dbStatus.lastError = error.message;
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

export default connectDB;
