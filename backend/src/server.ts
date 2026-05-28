import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

const PORT = parseInt(process.env.PORT ?? "8080", 10);

interface Room {
  peers: WebSocket[];
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(id: string): Room {
  if (!rooms.has(id)) rooms.set(id, { peers: [] });
  return rooms.get(id)!;
}

function relayToOthers(from: WebSocket, room: Room, data: string) {
  for (const peer of room.peers) {
    if (peer !== from && peer.readyState === WebSocket.OPEN) {
      peer.send(data);
    }
  }
}

const wss = new WebSocketServer({ port: PORT });
console.log(`[Signaling] WebSocket server listening on ws://0.0.0.0:${PORT}`);

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  // Room ID from URL path — default "default"
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const roomId = pathname.replace(/^\/+|\/+$/g, "") || "default";

  const room = getOrCreateRoom(roomId);

  if (room.peers.length >= 2) {
    console.log(`[Room:${roomId}] Full — rejecting connection`);
    ws.send(JSON.stringify({ type: "error", message: "Room is full (max 2 peers)" }));
    ws.close(1008, "Room full");
    return;
  }

  room.peers.push(ws);
  const peerIndex = room.peers.length; // 1 or 2
  console.log(`[Room:${roomId}] Peer ${peerIndex} joined (${room.peers.length}/2)`);

  ws.on("message", (data: Buffer) => {
    const raw = data.toString();
    // Debug: log type only (avoid logging full SDP)
    try {
      const parsed = JSON.parse(raw) as { type?: string };
      console.log(`[Room:${roomId}] Relaying: ${parsed.type}`);
    } catch { /* non-JSON */ }
    relayToOthers(ws, room, raw);
  });

  ws.on("close", (code) => {
    room.peers = room.peers.filter((p) => p !== ws);
    console.log(`[Room:${roomId}] Peer disconnected (code ${code}), ${room.peers.length} remaining`);

    // Notify remaining peer
    for (const peer of room.peers) {
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify({ type: "bye" }));
      }
    }

    // Clean up empty rooms
    if (room.peers.length === 0) {
      rooms.delete(roomId);
      console.log(`[Room:${roomId}] Deleted`);
    }
  });

  ws.on("error", (err) => {
    console.error(`[Room:${roomId}] WebSocket error:`, err.message);
  });
});
