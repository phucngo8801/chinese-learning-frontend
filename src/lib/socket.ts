import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./authToken";
import toast from "./toast";

type ServerToClientEvents = {
  "chat:new": (payload: any) => void;
  "chat:read": (payload: { conversationId: string; userId: string; readAt?: string }) => void;
  "chat:typing": (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  "chat:update": (payload: any) => void;

  // ✅ add these to match Chat.tsx listeners
  "chat:conversation_added": (payload: any) => void;
  "chat:conversation_updated": (payload: any) => void;
  "chat:members_updated": (payload: any) => void;
  "chat:conversation_removed": (payload: any) => void;
  "chat:conversation_deleted": (payload: any) => void;

  "presence:snapshot": (payload: { userIds: string[] }) => void;
  "presence:update": (payload: { userId: string; online: boolean }) => void;

  "room:new": (payload: any) => void;
  "room:update": (payload: any) => void;
  "room:delete": (payload: any) => void;
  "room:invited": (payload: any) => void;
};


type ClientToServerEvents = {
  "chat:join": (payload: { conversationId: string }) => void;
  "chat:leave": (payload: { conversationId: string }) => void;
  // conversationId is preferred (works for both DM + GROUP). otherUserId is a fallback for first-time DM.
  "chat:send": (
    payload: {
      conversationId?: string;
      otherUserId?: string;
      text?: string;
      type?: "TEXT" | "IMAGE" | "FILE";
      attachments?: any;
      clientMessageId?: string;
    },
    cb?: (res: { ok: boolean; conversationId?: string; messageId?: string; error?: string }) => void
  ) => void;
  "chat:read": (payload: { conversationId: string }) => void;
  "chat:typing": (payload: { conversationId: string; isTyping: boolean }) => void;

  "room:join": (payload: { roomId: string }) => void;
  "room:leave": (payload: { roomId: string }) => void;
  "room:send": (payload: { roomId: string; text: string }) => void;

  "presence:sync": () => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let lastHandshakeToken: string | null = null;
let lastConnectErrorAt = 0;
let lastConnectErrorMsg = "";
const SOCKET_TOAST_ID = "socket-conn";

function getToken() {
  return getAuthToken();
}
function getWsOrigin() {
  const api = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return api.replace(/\/api\/?$/, "");
}

export function getSocket() {
  if (socket) return socket;

  socket = io(getWsOrigin(), {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: false,
    auth: { token: getToken() },

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 400,
    reconnectionDelayMax: 2000,
    timeout: 8000,
  });

  socket.on("connect", () => {
    // connection restored
    toast.dismiss(SOCKET_TOAST_ID);
    try {
      socket?.emit("presence:sync");
    } catch {}
  });

  socket.on("connect_error", (err: any) => {
    const msg = String(err?.message || err || "websocket error");
    const now = Date.now();
    // throttle console/toast spam
    const shouldLog = now - lastConnectErrorAt > 4000 || msg !== lastConnectErrorMsg;
    if (shouldLog) {
      console.error("[socket] connect_error:", msg);
      toast.error("Mất kết nối chat realtime. Đang thử kết nối lại...", { id: SOCKET_TOAST_ID });
      lastConnectErrorAt = now;
      lastConnectErrorMsg = msg;
    }
  });

  // Track handshake token used by this socket instance
  lastHandshakeToken = getToken() || null;
  return socket;
}

/**
 * ✅ token đổi mà socket đang connected -> disconnect + connect lại để handshake chạy lại
 */
export function connectSocket() {
  const s = getSocket();
  const token = getToken();
  (s as any).auth = { token };

  if (!token) {
    try {
      if (s.connected) s.disconnect();
    } catch {}
    return s;
  }

  // If token changed while socket is already connected, force reconnect so server re-validates auth.
  if (token && lastHandshakeToken && token !== lastHandshakeToken) {
    try {
      if (s.connected) s.disconnect();
    } catch {}
  }

  if (token && !s.connected) s.connect();
  lastHandshakeToken = token || null;
  return s;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch {}
  socket = null;
  lastHandshakeToken = null;
  toast.dismiss(SOCKET_TOAST_ID);
}
