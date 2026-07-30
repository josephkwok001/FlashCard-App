import dns from 'node:dns';
import mongoose from 'mongoose';

/** Connection state so routes and the health endpoint can report it. */
export const dbStatus = { connected: false, lastError: null };

/** Strip credentials so we never log secrets. */
function safeUriInfo(uri) {
  try {
    const scheme = uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb';
    const afterAt = uri.split('@')[1] || '';
    const host = afterAt.split('/')[0] || null;
    const dbName = (afterAt.split('/')[1] || '').split('?')[0] || null;
    const passwordHasBrackets = /:\s*<[^>]*>@/.test(uri);
    return { scheme, host, dbName, hasCredentials: uri.includes('@'), passwordHasBrackets };
  } catch {
    return { scheme: null, host: null, dbName: null, hasCredentials: false, passwordHasBrackets: false };
  }
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.startsWith('mongodb')) {
    dbStatus.lastError = 'MONGODB_URI is missing or invalid in .env';
    console.error(dbStatus.lastError);
    return false;
  }

  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'F,G,H',location:'server/config/db.js:31',message:'Before mongoose.connect',data:{...safeUriInfo(uri),nodeVersion:process.version,systemDnsServers:dns.getServers()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    dbStatus.connected = true;
    dbStatus.lastError = null;
    // #region agent log
    await fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'F,G,H',location:'server/config/db.js:40',message:'mongoose.connect SUCCESS',data:{host:conn.connection.host,dbName:conn.connection.name},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    dbStatus.connected = false;
    dbStatus.lastError = error.message;
    // #region agent log
    const shardStates = error.reason?.servers ? [...error.reason.servers].map(([host, desc]) => ({ host, type: desc.type, error: desc.error?.message ?? null })) : null;
    await fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'F,G,H',location:'server/config/db.js:49',message:'mongoose.connect FAILED',data:{errorName:error.name,errorMessage:error.message,topologyType:error.reason?.type??null,setName:error.reason?.setName??null,causeCode:error.cause?.code??null,causeMessage:error.cause?.message??null,shardStates},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

export default connectDB;
