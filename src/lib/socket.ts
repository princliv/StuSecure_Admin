import { io, type Socket } from 'socket.io-client';

// The backend exposes Socket.IO on the same origin as the REST API, one
// level up from the `/api` prefix (see StuSecure_Backend/src/server.ts +
// realtime.ts — Express and Socket.IO share the same HTTP server). Derive it
// from VITE_API_URL rather than adding a new env var.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;
let pendingOrgId: string | null = null;

/**
 * Returns a lazily-created, shared Socket.IO client singleton. The server
 * (see realtime.ts) does not currently authenticate sockets at all — it only
 * expects an `org:join` emit with the organization id — so no auth token is
 * attached here. socket.io-client reconnects automatically by default.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    // Room membership lives on the server-side socket connection, so it is
    // lost on every disconnect/reconnect — rejoin on every (re)connect.
    socket.on('connect', () => {
      if (pendingOrgId) {
        socket?.emit('org:join', pendingOrgId);
      }
    });
  }
  return socket;
}

/** Joins (and remembers, for future reconnects) the room for `orgId`. */
export function joinOrgRoom(orgId: string) {
  pendingOrgId = orgId;
  const s = getSocket();
  if (s.connected) {
    s.emit('org:join', orgId);
  }
}
