class RoomStore {
  constructor(expiryMinutes = 30) {
    this.rooms = new Map();
    this.expiryMs = expiryMinutes * 60 * 1000;
    setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  create(roomCode, senderSocketId) {
    const room = {
      code: roomCode,
      sender: senderSocketId,
      receiver: null,
      createdAt: Date.now(),
      connected: false,
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  get(roomCode) {
    return this.rooms.get(roomCode) || null;
  }

  join(roomCode, receiverSocketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    room.receiver = receiverSocketId;
    room.connected = true;
    return room;
  }

  remove(roomCode) {
    this.rooms.delete(roomCode);
  }

  removeBySocket(socketId) {
    for (const [code, room] of this.rooms) {
      if (room.sender === socketId || room.receiver === socketId) {
        this.rooms.delete(code);
        return code;
      }
    }
    return null;
  }

  exists(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (Date.now() - room.createdAt > this.expiryMs) {
      this.rooms.delete(roomCode);
      return false;
    }
    return true;
  }

  _cleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > this.expiryMs) {
        this.rooms.delete(code);
      }
    }
  }

  stats() {
    return {
      totalRooms: this.rooms.size,
      connectedRooms: [...this.rooms.values()].filter(r => r.connected).length,
    };
  }
}

module.exports = new RoomStore(parseInt(process.env.ROOM_EXPIRY_MINUTES) || 30);
