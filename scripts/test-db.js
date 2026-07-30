import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import dnsPromises from 'node:dns/promises';
import tls from 'node:tls';
import net from 'node:net';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('No MONGODB_URI in .env');
  process.exit(1);
}

console.log('Node version:', process.version);
console.log('Testing MongoDB connection...');
console.log('URI host:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));

const clusterHost = (uri.split('@')[1] || '').split('/')[0];

/** Raw TCP reachability check (no TLS). */
function probeTcp(host, port = 27017) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(8000);
    socket.on('connect', () => { resolve({ tcp: 'ok' }); socket.destroy(); });
    socket.on('timeout', () => { resolve({ tcp: 'timeout' }); socket.destroy(); });
    socket.on('error', (e) => resolve({ tcp: 'error', code: e.code, message: e.message }));
  });
}

/** TLS handshake check — Atlas rejects non-allowlisted IPs by resetting during handshake. */
function probeTls(host, port = 27017) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port, servername: host });
    socket.setTimeout(8000);
    socket.on('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      resolve({
        tls: 'ok',
        authorized: socket.authorized,
        peerCert: cert && cert.subject ? 'present' : 'none',
        protocol: socket.getProtocol(),
      });
      socket.destroy();
    });
    socket.on('timeout', () => { resolve({ tls: 'timeout' }); socket.destroy(); });
    socket.on('error', (e) => resolve({ tls: 'error', code: e.code, message: e.message }));
  });
}

let srvHosts = [];
let srvError = null;
try {
  const records = await dnsPromises.resolveSrv(`_mongodb._tcp.${clusterHost}`);
  srvHosts = records.map((r) => r.name);
  console.log('SRV records resolved:', srvHosts.length);
} catch (e) {
  srvError = { code: e.code, message: e.message };
  console.error('SRV lookup failed:', e.message);
}

// #region agent log
fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'D',location:'scripts/test-db.js:69',message:'SRV lookup result',data:{clusterHost,srvHostCount:srvHosts.length,srvHosts,srvError,nodeVersion:process.version,dnsServers:dns.getServers()},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const probeTarget = srvHosts[0] || clusterHost;
const tcpResult = await probeTcp(probeTarget);
const tlsResult = await probeTls(probeTarget);
console.log('TCP probe:', JSON.stringify(tcpResult));
console.log('TLS probe:', JSON.stringify(tlsResult));

// #region agent log
fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'A,B',location:'scripts/test-db.js:79',message:'Raw TCP + TLS probe to shard',data:{probeTarget,tcp:tcpResult,tls:tlsResult},timestamp:Date.now()})}).catch(()=>{});
// #endregion

let egressIp = null;
try {
  egressIp = (await fetch('https://api.ipify.org').then((r) => r.text())).trim();
  console.log('Public egress IP:', egressIp);
} catch {
  console.log('Could not determine public egress IP');
}

// #region agent log
fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'A,B',location:'scripts/test-db.js:90',message:'Public egress IP as seen by internet',data:{egressIp},timestamp:Date.now()})}).catch(()=>{});
// #endregion

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
    family: 4,
  });
  console.log('✓ Connected:', mongoose.connection.host);
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('✓ Collections:', cols.map((c) => c.name).join(', ') || '(none yet)');
  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'A,B,C,D',location:'scripts/test-db.js:104',message:'mongoose.connect SUCCESS from test script',data:{host:mongoose.connection.host,collections:cols.map((c)=>c.name)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  await mongoose.disconnect();
  console.log('✓ Test passed — run npm run dev:server');
} catch (error) {
  // #region agent log
  const shardStates = error.reason?.servers ? [...error.reason.servers].map(([host, desc]) => ({ host, type: desc.type, error: desc.error?.message ?? null })) : null;
  fetch('http://127.0.0.1:7625/ingest/29d72b27-fbbc-46f6-b04e-30b518f2d130',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de8c73'},body:JSON.stringify({sessionId:'de8c73',hypothesisId:'A,B,C,D',location:'scripts/test-db.js:110',message:'mongoose.connect FAILED from test script',data:{errorName:error.name,errorMessage:error.message,topologyType:error.reason?.type??null,setName:error.reason?.setName??null,causeCode:error.cause?.code??null,causeMessage:error.cause?.message??null,shardStates},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  console.error('✗ Failed:', error.message);
  if (error.cause?.message) console.error('  Cause:', error.cause.message);
  process.exit(1);
}
