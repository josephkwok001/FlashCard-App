import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('No MONGODB_URI in .env');
  process.exit(1);
}

console.log('Node version:', process.version);
console.log('URI host:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log('Connected:', mongoose.connection.host);

  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', cols.map((c) => c.name).join(', ') || '(none yet)');

  await mongoose.disconnect();
  console.log('Test passed — run npm run dev:server');
} catch (error) {
  console.error('Failed:', error.message);
  if (error.cause?.message) console.error('Cause:', error.cause.message);
  process.exit(1);
}
