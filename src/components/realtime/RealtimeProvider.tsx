import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "../../lib/toast";
import { playTing } from "../../lib/ting";
import { connectSocket, disconnectSocket, getSocket } from "../../lib/socket";
import { getAuthToken } from "../../lib/authToken";

type RealtimeContextValue = {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  // presence
  onlineMap: Record<string, boolean>;
  onlineUserIds: string[];
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used inside RealtimeProvider");
  return ctx;
}

function getToken() {
  return getAuthToken();
}

function getMyIdFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return payload?.sub || null;
  } catch {
    return null;
  }
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

  const onlineUserIds = useMemo(() => Object.keys(onlineMap), [onlineMap]);

  const value = useMemo(
    () => ({
      activeConversationId,
      setActiveConversationId,
      onlineMap,
      onlineUserIds,
    }),
    [activeConversationId, onlineMap, onlineUserIds]
  );

  // presence listeners
  useEffect(() => {
    const s = getSocket();

    const onSnap = (p: any) => {
      const ids = (p?.userIds || []) as string[];
      const next: Record<string, boolean> = {};
      ids.forEach((id) => (next[id] = true));
      setOnlineMap(next);
    };

    const onUpdate = (p: any) => {
      const uid = p?.userId as string | undefined;
      const online = !!p?.online;
      if (!uid) return;

      setOnlineMap((prev) => {
        if (online) return { ...prev, [uid]: true };
        const next = { ...prev };
        delete next[uid];
        return next;
      });
    };

    s.on("presence:snapshot", onSnap);
    s.on("presence:update", onUpdate);

    return () => {
      s.off("presence:snapshot", onSnap);
      s.off("presence:update", onUpdate);
    };
  }, []);

  // connect/disconnect by token (event-driven, no polling)
  useEffect(() => {
    let last = "";

    const sync = () => {
      const t = getToken();
      if (t === last) return;
      last = t;

      if (t) {
        connectSocket();
      } else {
        disconnectSocket();
        setOnlineMap({});
      }
    };

    // Initial sync
    sync();

    // Same-tab changes
    const onAuth = () => sync();
    window.addEventListener("auth:token", onAuth);

    // Other-tab changes
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "token" || e.key === "accessToken" || e.key === "access_token") sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth:token", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // toast listeners (chat only)
  useEffect(() => {
    const s = getSocket();

    const onChatNew = (payload: any) => {
      const convId = payload?.conversationId || payload?.message?.conversationId;
      const senderId = payload?.message?.senderId || payload?.senderId;

      const me = getMyIdFromToken();
      if (me && senderId && senderId === me) return;

      const same = convId && convId === activeConversationId && location.pathname.startsWith("/chat");
      if (same) return;

      const msg = payload?.message || {};
      const text =
        msg?.deletedAt
          ? "Tin nhắn đã được thu hồi"
          : (msg?.text || msg?.content || "") ||
            (msg?.type === "IMAGE"
              ? "[Hình ảnh]"
              : msg?.type === "FILE"
              ? "[Tệp đính kèm]"
              : "Tin nhắn mới");
      const senderName =
        msg?.sender?.name ||
        msg?.sender?.email ||
        payload?.sender?.name ||
        payload?.sender?.email ||
        "Ai đó";

      playTing();
      toast.success(`${senderName}: ${text}`);
    };

    s.on("chat:new", onChatNew);

    return () => {
      s.off("chat:new", onChatNew);
    };
  }, [activeConversationId, location.pathname]);

  // clear active ids when leaving page
  useEffect(() => {
    if (!location.pathname.startsWith("/chat")) setActiveConversationId(null);
  }, [location.pathname]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
