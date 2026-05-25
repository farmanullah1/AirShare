require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomStore = require('./roomStore');
const { setupSocketHandlers } = require('./socketManager');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    rooms: roomStore.stats(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/check-room/:code', (req, res) => {
  const exists = roomStore.exists(req.params.code);
  res.json({ exists });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 AirShare Signaling Server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend: ${FRONTEND_URL}\n`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
