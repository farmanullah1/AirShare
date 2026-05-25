# AirShare

> Fast, private peer-to-peer file sharing. No cloud. No limits.

## Features

- End-to-end P2P transfer (WebRTC)
- Folder & batch file support
- Limited only by your network speed
- Works on mobile & desktop
- Dark/light mode
- 6-digit room codes + QR
- Works across different networks (TURN)
- PWA installable

## Architecture

```
Sender                 Signaling Server              Receiver
  |                          |                          |
  |-- create-room ---------->|                          |
  |<-- roomCode -------------|                          |
  |                          |<-- join-room ------------|
  |<-- peer-joined ----------|                          |
  |                          |                          |
  |-- offer (via signal) --->|--- offer (via signal) -->|
  |<-- answer (via signal) --|<-- answer (via signal) --|
  |<-- ICE candidates ------>|<-- ICE candidates ------>|
  |                          |                          |
  |========= WebRTC DataChannel (direct P2P) ==========|
  |-- file chunks ---------------------------------->   |
  |                          |                          |
```

The signaling server **never** sees file data. It only facilitates WebRTC connection setup via room codes and signal relay.

## Quick Start (Local Dev)

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone

```bash
git clone https://github.com/farmanullah1/AirShare.git
cd AirShare
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The signaling server starts on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:3000`.

### 4. Open in Browser

Navigate to `http://localhost:3000`. Open a second tab or device on the same network to test file transfer.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `ROOM_EXPIRY_MINUTES` | `30` | Room auto-expiry time |
| `MAX_ROOMS` | `1000` | Maximum concurrent rooms |
| `NODE_ENV` | `development` | Environment mode |
| `VITE_BACKEND_URL` | `http://localhost:5000` | Backend URL for frontend |

## Deployment

### Frontend (Vercel)

1. Import the `frontend/` directory on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_BACKEND_URL=https://your-backend.railway.app`

### Frontend (GitHub Pages)

1. Set `base` in `vite.config.js` to your repo name: `base: '/AirShare/'`
2. Run `npm run build`
3. Deploy the `dist/` folder

### Backend (Railway)

1. Create a new project on [Railway](https://railway.app)
2. Point to the `backend/` directory
3. Set start command: `npm start`
4. Add environment variables:
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `NODE_ENV=production`

## Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 15+ |
| Edge | 90+ |

## Privacy

All file data flows directly between devices via WebRTC DataChannels. The server only sees room codes and WebSocket messages for connection negotiation. No files, filenames, or metadata are ever sent to or stored on the server.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS v3 + Framer Motion
- **Backend:** Node.js + Express + Socket.IO
- **P2P:** WebRTC DataChannels
- **QR:** qrcode.react
- **Icons:** lucide-react

## License

MIT
