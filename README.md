# Nexus Call — WebRTC 1-to-1 Video App

Pure WebRTC + WebSocket video calling. No third-party SDKs.

---

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + `ws` WebSocket server
- **Signaling**: Custom WebSocket signaling with room support
- **WebRTC**: Perfect negotiation pattern (RFC 8829)

---

## Folder Structure

```
webrtc-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoCall.tsx       ← Main UI page
│   │   │   ├── VideoTile.tsx       ← Local/remote video tile
│   │   │   ├── ControlButton.tsx   ← Mic/camera/end call buttons
│   │   │   ├── MicWave.tsx         ← Animated mic indicator
│   │   │   └── StatusBadge.tsx     ← Connection status badge
│   │   ├── hooks/
│   │   │   └── useVideoCall.ts     ← Orchestration hook
│   │   ├── services/
│   │   │   ├── SignalingService.ts  ← WebSocket + queue + reconnect
│   │   │   └── PeerService.ts      ← RTCPeerConnection (perfect negotiation)
│   │   ├── types/
│   │   │   └── signaling.ts        ← TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── tsconfig.json
│
└── backend/
    ├── src/
    │   └── server.ts               ← WebSocket signaling server
    ├── package.json
    └── tsconfig.json
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Server starts on `ws://localhost:8080`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## How to Start a Call

Open **two browser tabs/windows**:

| Tab | URL |
|-----|-----|
| Caller | `http://localhost:5173/#caller` |
| Receiver | `http://localhost:5173` |

The `#caller` hash determines who initiates the offer (the impolite peer in perfect negotiation).

> **Tip**: Use Chrome and an incognito window for two tabs on the same machine.

---

## Environment Variables

Frontend (`.env`):
```
VITE_WS_URL=ws://localhost:8080
```

For production, replace with your deployed WebSocket server URL, e.g.:
```
VITE_WS_URL=wss://your-server.com
```

Backend — optional `PORT` env var (default: `8080`).

---

## Room Support

The signaling server supports multiple concurrent rooms via URL path.  
Default room: `ws://localhost:8080/` → room `"default"`  
Custom room: `ws://localhost:8080/room-abc` → room `"room-abc"`

To use named rooms, set `VITE_WS_URL=ws://localhost:8080/my-room`.

---

## WebRTC Architecture

### Perfect Negotiation Pattern
- **Impolite peer** (`#caller`): ignores colliding offers
- **Polite peer** (no hash): rolls back and accepts remote offer on collision
- Eliminates all offer/answer race conditions

### ICE Candidates
- Sent immediately via WebSocket as they arrive (trickle ICE)
- Queued if WebSocket not yet open

### Signaling Flow
```
Caller                 Server                Receiver
  |──── offer ─────────→ |──── offer ────────→ |
  |                       |                     |──── setRemoteDescription
  |                       |                     |──── createAnswer
  |←─── answer ──────────|←─── answer ─────────|
  |──── setRemoteDescription                    |
  |←──→ ice-candidate ────|──→ ice-candidate ──→|
  |                       |                     |
  [WebRTC P2P established — media flows directly]
```

### Disconnect Handling
- Backend sends `{ type: "bye" }` to remaining peer on disconnect
- Frontend shows "Disconnected" status
- WebSocket auto-reconnects with 2s backoff

---

## Production Deployment

For production you need a **TURN server** for users behind symmetric NATs.

Add to `PeerService.ts`:
```ts
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:your-turn-server.com:3478",
    username: "user",
    credential: "password",
  },
];
```

Free TURN options: Metered (free tier), Twilio Network Traversal (pay-as-you-go).
