const roomStore = require('./roomStore');

function generateRoomCode() {
  const part1 = Math.floor(Math.random() * 900 + 100).toString();
  const part2 = Math.floor(Math.random() * 900 + 100).toString();
  return `${part1}-${part2}`;
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('create-room', (callback) => {
      let roomCode;
      let attempts = 0;
      do {
        roomCode = generateRoomCode();
        attempts++;
      } while (roomStore.exists(roomCode) && attempts < 10);

      const room = roomStore.create(roomCode, socket.id);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.role = 'sender';

      console.log(`[Room] Created: ${roomCode} by ${socket.id}`);
      if (typeof callback === 'function') callback({ success: true, roomCode });
    });

    socket.on('join-room', ({ roomCode }, callback) => {
      const room = roomStore.get(roomCode);

      if (!room) {
        if (typeof callback === 'function')
          callback({ success: false, error: 'Room not found. Check the code and try again.' });
        return;
      }

      if (room.receiver) {
        if (typeof callback === 'function')
          callback({ success: false, error: 'Room is full. Only one receiver allowed.' });
        return;
      }

      roomStore.join(roomCode, socket.id);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.role = 'receiver';

      socket.to(room.sender).emit('peer-joined', { receiverId: socket.id });
      if (typeof callback === 'function') callback({ success: true, roomCode });

      console.log(`[Room] ${roomCode}: receiver joined ${socket.id}`);
    });

    socket.on('signal', (data) => {
      const room = roomStore.get(socket.roomCode);
      if (!room) return;

      const targetId = socket.role === 'sender' ? room.receiver : room.sender;
      if (targetId) {
        io.to(targetId).emit('signal', {
          ...data,
          from: socket.id,
        });
      }
    });

    socket.on('transfer-start', (meta) => {
      const room = roomStore.get(socket.roomCode);
      if (!room) return;
      const targetId = socket.role === 'sender' ? room.receiver : room.sender;
      if (targetId) io.to(targetId).emit('transfer-start', meta);
    });

    socket.on('transfer-complete', () => {
      const room = roomStore.get(socket.roomCode);
      if (!room) return;
      const targetId = socket.role === 'sender' ? room.receiver : room.sender;
      if (targetId) io.to(targetId).emit('transfer-complete');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const roomCode = socket.roomCode;
      if (!roomCode) return;

      const room = roomStore.get(roomCode);
      if (room) {
        const peerId = socket.role === 'sender' ? room.receiver : room.sender;
        if (peerId) {
          io.to(peerId).emit('peer-disconnected', { reason: 'Peer left the session' });
        }
        roomStore.remove(roomCode);
      }
    });

    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb({ pong: true, ts: Date.now() });
    });
  });
}

module.exports = { setupSocketHandlers };
