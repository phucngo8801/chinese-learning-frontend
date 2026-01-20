import { io, Socket } from "socket.io-client";

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
  "chat:send": (payload: { conversationId?: string; otherUserId?: string; text?: string; type?: "TEXT" | "IMAGE" | "FILE"; attachments?: any }) => void;
  "chat:read": (payload: { conversationId: string }) => void;
  "chat:typing": (payload: { conversationId: string; isTyping: boolean }) => void;

  "room:join": (payload: { roomId: string }) => void;
  "room:leave": (payload: { roomId: string }) => void;
  "room:send": (payload: { roomId: string; text: string }) => void;

  "presence:sync": () => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    ""
  );
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
    try {
      socket?.emit("presence:sync");
    } catch {}
  });

  socket.on("connect_error", (err: any) => {
    console.error("[socket] connect_error:", err?.message || err);
  });

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

  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch {}
  socket = null;
}
