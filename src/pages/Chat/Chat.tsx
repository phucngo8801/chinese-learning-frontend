import { useEffect, useMemo, useRef, useState } from "react";
import { getAuthToken } from "../../lib/authToken";
import api from "../../api/axios";
import toast from "../../lib/toast";
import { useRealtime } from "../../components/realtime/RealtimeProvider";
import { getSocket } from "../../lib/socket";
import "./Chat.css";

type UserMini = { id: string; name: string; email: string };

type Attachment = { url: string; name?: string; mime?: string; size?: number };

type Reaction = { id: string; emoji: string; userId: string; createdAt: string };

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string | null;
  text?: string;
  content?: string;
  type?: "TEXT" | "IMAGE" | "FILE";
  attachments?: Attachment[];
  reactions?: Reaction[];
  createdAt: string; // ✅ ALWAYS ISO
  isRead?: boolean;
  readAt?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  sender?: UserMini;
  senderDisplayName?: string | null; // nickname or user.name (backend)
  /** client-side delivery state (optimistic send) */
  clientStatus?: "queued" | "sending" | "failed";
  clientError?: string | null;
};

type Conversation =
  | {
      id: string;
      type: "DM";
      otherUser: UserMini;
      title?: null;
      membersCount?: null;
      lastMessage?: { content?: string; text?: string; createdAt: string; senderId?: string } | null;
      unread: number;
    }
  | {
      id: string;
      type: "GROUP";
      title: string;
      otherUser?: null;
      membersCount: number;
      lastMessage?: { content?: string; text?: string; createdAt: string; senderId?: string } | null;
      unread: number;
    };

type FriendMini = { id: string; name: string; email: string };

type MemberRow = {
  userId: string;
  nickname?: string | null;
  role?: string;
  user: UserMini;
};

function getToken() {
  return getAuthToken();
}
function decodeJwtPayload(token: string): any | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getMyIdFromToken(): string | null {
  const token = getToken();
  const payload = decodeJwtPayload(token);
  return payload?.sub || payload?.id || null;
}

function makeClientMessageId(): string {
  try {
    // modern browsers
    return crypto.randomUUID();
  } catch {
    // fallback (still unique enough for client retry)
    return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

const msgText = (m: any) => (m?.content ?? m?.text ?? "").toString();

function apiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

/** ✅ Convert ANY date-ish value to ISO string */
function toIso(input: any): string {
  if (input == null) return new Date().toISOString();

  if (input instanceof Date) {
    const t = input.getTime();
    return Number.isNaN(t) ? new Date().toISOString() : input.toISOString();
  }

  if (typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return new Date().toISOString();
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  // common wrappers
  if (input?.$date) return toIso(input.$date);
  if (input?.date) return toIso(input.date);
  if (input?.createdAt) return toIso(input.createdAt);

  if (typeof input?.toISOString === "function") {
    try {
      return toIso(input.toISOString());
    } catch {
      return new Date().toISOString();
    }
  }

  return new Date().toISOString();
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/**
 * ✅ IMPORTANT FIX:
 * - Backend thường trả id dạng `_id` (Mongo) hoặc `messageId`
 * - Nếu không lấy được id thật -> UI sinh tmp_ -> reaction gọi API /tmp_... => 404
 */
function ensureMessageId(r: any, createdAtIso: string) {
  const realId = r?.id ?? r?._id ?? r?.messageId;
  if (realId) return String(realId);

  const base = [
    r?.conversationId || "c",
    r?.senderId || "u",
    createdAtIso,
    (r?.content ?? r?.text ?? "").toString(),
    JSON.stringify(r?.attachments ?? []),
    r?.type ?? "TEXT",
  ].join("|");

  return `tmp_${hashStr(base)}`;
}

function normalizeReactions(raw: any): Reaction[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((x: any) => ({
      id: String(x?.id ?? x?._id ?? `${x?.emoji || "?"}_${x?.userId || "u"}_${toIso(x?.createdAt)}`),
      emoji: String(x?.emoji ?? ""),
      userId: String(x?.userId ?? ""),
      createdAt: toIso(x?.createdAt),
    }))
    .filter((x) => x.emoji && x.userId);
}

function normalizeAttachments(raw: any): Attachment[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((a: any) => ({
      url: String(a?.url ?? ""),
      name: a?.name ? String(a.name) : undefined,
      mime: a?.mime ? String(a.mime) : undefined,
      size: typeof a?.size === "number" ? a.size : undefined,
    }))
    .filter((a) => !!a.url);
}

function normalizeMessage(raw: any): Message {
  const r = raw || {};
  const createdAtIso = toIso(r?.createdAt);

  return {
    ...r,
    id: ensureMessageId(r, createdAtIso),
    conversationId: String(r?.conversationId ?? ""),
    senderId: String(r?.senderId ?? ""),
    receiverId: r?.receiverId ?? null,

    text: (r?.text ?? r?.content ?? "").toString(),
    content: (r?.content ?? r?.text ?? "").toString(),
    type: (r?.type ?? "TEXT") as any,

    attachments: normalizeAttachments(r?.attachments),
    reactions: normalizeReactions(r?.reactions),

    senderDisplayName: r?.senderDisplayName ?? null,
    createdAt: createdAtIso,

    isRead: !!r?.isRead,
    readAt: r?.readAt ? toIso(r.readAt) : null,
    editedAt: r?.editedAt ? toIso(r.editedAt) : null,
    deletedAt: r?.deletedAt ? toIso(r.deletedAt) : null,

    sender: r?.sender,
  };
}

function formatTime(iso: string) {
  try {
    const d = new Date(toIso(iso));
    if (Number.isNaN(d.getTime())) return "";
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

function formatDayLabel(iso: string) {
  try {
    const d = new Date(toIso(iso));
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();

    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) return "Hôm nay";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    if (isYesterday) return "Hôm qua";

    return d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function groupReactions(reactions?: Reaction[]) {
  const map = new Map<string, number>();
  (reactions || []).forEach((r) => map.set(r.emoji, (map.get(r.emoji) || 0) + 1));
  return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
}

const REACTION_SET = ["👍", "❤️", "😂", "😮", "😢", "😡"];

function convTitle(c: Conversation): string {
  if (c.type === "GROUP") return c.title || "Nhóm chat";
  return c.otherUser?.name || "Chat";
}

export default function Chat() {
  const { onlineUserIds, setActiveConversationId } = useRealtime();
  const onlineIds = useMemo<string[]>(() => (Array.isArray(onlineUserIds) ? onlineUserIds : []), [onlineUserIds]);

  const myId = useMemo(() => getMyIdFromToken(), []);
  const socket = useMemo(() => getSocket(), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [search, setSearch] = useState("");
  const [atBottom, setAtBottom] = useState(true);

  const [openNew, setOpenNew] = useState(false);
  const [newTab, setNewTab] = useState<"DM" | "GROUP">("DM");
  const [friends, setFriends] = useState<FriendMini[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const [members, setMembers] = useState<MemberRow[]>([]);
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.userId, (m.nickname || m.user?.name || "U").toString()));
    return map;
  }, [members]);

  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});

  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  // outbox for optimistic sends (retry on reconnect)
  const outboxRef = useRef<Record<string, { payload: any; attempts: number }>>({});

  const setMsgStatus = (id: string, status?: Message["clientStatus"], err?: string | null) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? ({ ...m, clientStatus: status, clientError: err ?? null } as any) : m))
    );
  };

  const clearOutboxItem = (id: string) => {
    if (outboxRef.current[id]) delete outboxRef.current[id];
  };

  const trySendOutboxItem = (id: string) => {
    const item = outboxRef.current[id];
    if (!item) return;

    // hard cap to avoid infinite loops
    if (item.attempts >= 3) {
      setMsgStatus(id, "failed", "Gửi thất bại (quá nhiều lần thử).");
      clearOutboxItem(id);
      return;
    }

    if (!socket || !(socket as any).connected) {
      setMsgStatus(id, "queued", null);
      return;
    }

    item.attempts += 1;
    setMsgStatus(id, "sending", null);

    try {
      socket.emit("chat:send", item.payload, (ack: any) => {
        if (ack?.ok) {
          clearOutboxItem(id);
          // message will be merged/replaced via chat:new; still clear local state early
          setMsgStatus(id, undefined, null);
          return;
        }

        const err = String(ack?.error || "Gửi thất bại");
        setMsgStatus(id, "failed", err);
      });
    } catch (e: any) {
      setMsgStatus(id, "failed", String(e?.message || "Gửi thất bại"));
    }
  };

  const flushOutbox = () => {
    const ids = Object.keys(outboxRef.current || {});
    ids.forEach((id) => trySendOutboxItem(id));
  };

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  }, [selected?.id]);

  useEffect(() => {
    setActiveConversationId(selected?.id ?? null);
    return () => setActiveConversationId(null);
  }, [selected?.id, setActiveConversationId]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".msg-menu") && !t.closest(".msg-menu-btn")) setOpenMenuId(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const selectedOtherId = (selected && selected.type === "DM" ? selected.otherUser?.id : null) || null;
  const isOtherOnline = useMemo(() => {
    if (!selectedOtherId) return false;
    return onlineIds.includes(selectedOtherId);
  }, [onlineIds, selectedOtherId]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = convTitle(c).toLowerCase();
      const email = c.type === "DM" ? (c.otherUser?.email || "").toLowerCase() : "";
      const prev = (msgText(c.lastMessage) || "").toLowerCase();
      return name.includes(q) || email.includes(q) || prev.includes(q);
    });
  }, [conversations, search]);

  const filteredFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [friends, friendQuery]);

  const loadFriends = async () => {
    try {
      const res = await api.get("/friends/list");
      setFriends(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFriends([]);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      const raw = Array.isArray(res.data) ? res.data : [];

      const list: Conversation[] = raw
        .map((c: any) => {
          if (c?.type === "GROUP") {
            return {
              id: String(c?.id ?? c?._id ?? ""),
              type: "GROUP",
              title: c?.title || "Nhóm chat",
              membersCount: Number(c?.membersCount || 0),
              lastMessage: c?.lastMessage
                ? { ...c.lastMessage, createdAt: toIso(c.lastMessage.createdAt) }
                : null,
              unread: Number(c?.unread || 0),
            } as Conversation;
          }

          return {
            id: String(c?.id ?? c?._id ?? ""),
            type: "DM",
            otherUser: c?.otherUser,
            lastMessage: c?.lastMessage
              ? { ...c.lastMessage, createdAt: toIso(c.lastMessage.createdAt) }
              : null,
            unread: Number(c?.unread || 0),
          } as Conversation;
        })
        .filter((c: any) => c?.id && (c.type === "GROUP" || c?.otherUser?.id));

      setConversations(list);

      setSelected((prev) => {
        if (prev?.id) return prev;
        return list.length ? list[0] : null;
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không tải được danh sách chat");
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // join/leave room
  useEffect(() => {
    if (!selected?.id) return;
    try {
      socket.emit("chat:join", { conversationId: selected.id });
    } catch {}
    return () => {
      try {
        socket.emit("chat:leave", { conversationId: selected.id });
      } catch {}
    };
  }, [selected?.id, socket]);

  // load members
  useEffect(() => {
    if (!selected?.id) return;
    (async () => {
      try {
        const res = await api.get(`/chat/conversations/${selected.id}/members`);
        setMembers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setMembers([]);
      }
    })();
  }, [selected?.id]);

  // load messages
  useEffect(() => {
    if (!selected?.id) return;

    setMessages([]);
    setHasMore(true);
    setTypingMap({});
    setOpenMenuId(null);
    setEditingId(null);
    setEditText("");

    (async () => {
      setLoadingMsgs(true);
      try {
        const res = await api.get(`/chat/conversations/${selected.id}/messages`, { params: { limit: 40 } });
        const raw = Array.isArray(res.data) ? res.data : [];
        const list = raw.map(normalizeMessage);
        setMessages(list);

        try {
          socket.emit("chat:read", { conversationId: selected.id });
        } catch {}

        setConversations((prev) => prev.map((c) => (c.id === selected.id ? { ...c, unread: 0 } : c)));

        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được tin nhắn");
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, [selected?.id, socket]);

  // socket listeners
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      try {
        flushOutbox();
      } catch {}
    };
    socket.on("connect", onConnect);

    const onDisconnect = () => {
      // mark all pending as queued so user knows it will retry on reconnect
      try {
        Object.keys(outboxRef.current || {}).forEach((id) => setMsgStatus(id, "queued", null));
      } catch {}
    };
    socket.on("disconnect", onDisconnect);

    const onNew = (payload: any) => {
      const msg = normalizeMessage(payload?.message || payload);
      const selectedId = selectedIdRef.current;

      if (selectedId && msg.conversationId === selectedId) {
        // Merge with optimistic placeholder if exists
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === msg.id);
          if (idx >= 0) {
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...msg, clientStatus: undefined, clientError: null } as any;
            return copy;
          }
          return [...prev, msg];
        });

        // if this was an optimistic send, clear outbox entry
        try {
          if (msg?.id) clearOutboxItem(msg.id);
        } catch {}

        if (myId && msg.senderId !== myId) {
          try {
            socket.emit("chat:read", { conversationId: selectedId });
          } catch {}
        }

        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
      }

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === msg.conversationId);
        if (!exists) return prev;

        return prev.map((c) => {
          if (c.id !== msg.conversationId) return c;
          const isSelected = c.id === selectedId;
          const incUnread = msg.senderId === myId ? 0 : 1;

          return {
            ...c,
            lastMessage: { content: msgText(msg), createdAt: msg.createdAt, senderId: msg.senderId },
            unread: isSelected ? 0 : Number((c as any).unread || 0) + incUnread,
          } as Conversation;
        });
      });
    };

    const onRead = (payload: any) => {
      const { conversationId, userId, readAt, conversationType } = payload || {};
      const selectedId = selectedIdRef.current;
      if (!conversationId || !selectedId || conversationId !== selectedId) return;
      if (conversationType !== "DM") return;

      if (myId && userId && userId !== myId) {
        const readIso = readAt ? toIso(readAt) : null;
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === myId ? { ...m, isRead: true, readAt: readIso || m.readAt || null } : m
          )
        );
      }
    };

    const onTyping = (payload: any) => {
      const { conversationId, userId, isTyping } = payload || {};
      const selectedId = selectedIdRef.current;
      if (!selectedId || conversationId !== selectedId) return;
      if (myId && userId && userId !== myId) {
        setTypingMap((prev) => ({ ...prev, [userId]: !!isTyping }));
      }
    };

    const onUpdate = (payload: any) => {
      const { type, conversationId } = payload || {};
      const selectedId = selectedIdRef.current;
      if (!conversationId) return;

      if (type === "EDIT" || type === "DELETE") {
        const updated = normalizeMessage(payload?.message);
        if (selectedId && conversationId === selectedId) {
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              lastMessage: c.lastMessage
                ? {
                    ...c.lastMessage,
                    content: msgText(updated),
                    createdAt: updated.createdAt || c.lastMessage.createdAt,
                    senderId: updated.senderId || c.lastMessage.senderId,
                  }
                : c.lastMessage,
            } as Conversation;
          })
        );
      }

      if (type === "REACTIONS") {
        const { messageId, reactions } = payload || {};
        if (!messageId) return;
        if (selectedId && conversationId === selectedId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === String(messageId) ? { ...m, reactions: normalizeReactions(reactions) } : m
            )
          );
        }
      }

      if (type === "HIDDEN") {
        const { messageId } = payload || {};
        if (!messageId) return;
        if (selectedId && conversationId === selectedId) {
          setMessages((prev) => prev.filter((m) => m.id !== String(messageId)));
        }
      }
    };

    const onConvAdded = (payload: any) => {
      const item = payload?.item || payload;
      if (!item?.id && !item?._id) return;
      const normalized = {
        ...item,
        id: String(item?.id ?? item?._id),
        lastMessage: item?.lastMessage
          ? { ...item.lastMessage, createdAt: toIso(item.lastMessage.createdAt) }
          : null,
      } as Conversation;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === normalized.id);
        if (exists) return prev.map((c) => (c.id === normalized.id ? ({ ...c, ...normalized } as any) : c));
        return [normalized, ...prev];
      });
    };

    const onConvUpdated = (payload: any) => {
      const item = payload?.item || payload;
      if (!item?.id && !item?._id) return;

      const normalized = {
        ...item,
        id: String(item?.id ?? item?._id),
        lastMessage: item?.lastMessage
          ? { ...item.lastMessage, createdAt: toIso(item.lastMessage.createdAt) }
          : null,
      } as any;

      setConversations((prev) => prev.map((c) => (c.id === normalized.id ? ({ ...c, ...normalized } as any) : c)));
      setSelected((prev) => (prev?.id === normalized.id ? ({ ...(prev as any), ...normalized } as any) : prev));
    };

    const onMembersUpdated = (payload: any) => {
      const { conversationId } = payload || {};
      const selectedId = selectedIdRef.current;
      if (!selectedId || conversationId !== selectedId) return;

      api
        .get(`/chat/conversations/${selectedId}/members`)
        .then((res) => setMembers(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    };

    const onConvRemoved = (payload: any) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;
      setConversations((prev) => prev.filter((c) => c.id !== String(conversationId)));
      setSelected((prev) => (prev?.id === String(conversationId) ? null : prev));
      const selectedId = selectedIdRef.current;
      if (selectedId === String(conversationId)) {
        setMessages([]);
        setMembers([]);
      }
    };

    const onConvDeleted = (payload: any) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;
      setConversations((prev) => prev.filter((c) => c.id !== String(conversationId)));
      setSelected((prev) => (prev?.id === String(conversationId) ? null : prev));
      const selectedId = selectedIdRef.current;
      if (selectedId === String(conversationId)) {
        setMessages([]);
        setMembers([]);
      }
    };

    socket.on("chat:new", onNew);
    socket.on("chat:read", onRead);
    socket.on("chat:typing", onTyping);
    socket.on("chat:update", onUpdate);
    socket.on("chat:conversation_added", onConvAdded);
    socket.on("chat:conversation_updated", onConvUpdated);
    socket.on("chat:members_updated", onMembersUpdated);
    socket.on("chat:conversation_removed", onConvRemoved);
    socket.on("chat:conversation_deleted", onConvDeleted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:new", onNew);
      socket.off("chat:read", onRead);
      socket.off("chat:typing", onTyping);
      socket.off("chat:update", onUpdate);
      socket.off("chat:conversation_added", onConvAdded);
      socket.off("chat:conversation_updated", onConvUpdated);
      socket.off("chat:members_updated", onMembersUpdated);
      socket.off("chat:conversation_removed", onConvRemoved);
      socket.off("chat:conversation_deleted", onConvDeleted);
    };
  }, [socket, myId]);

  // infinite older
  useEffect(() => {
    const el = listRef.current;
    if (!el || !selected?.id) return;

    const onScroll = async () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setAtBottom(nearBottom);

      if (loadingOlder || !hasMore) return;
      if (el.scrollTop > 60) return;

      const first = messages[0];
      if (!first?.createdAt) return;

      setLoadingOlder(true);
      const prevHeight = el.scrollHeight;

      try {
        const res = await api.get(`/chat/conversations/${selected.id}/messages`, {
          params: { limit: 40, before: toIso(first.createdAt) },
        });
        const raw = Array.isArray(res.data) ? res.data : [];
        const list = raw.map(normalizeMessage);

        if (!list.length) {
          setHasMore(false);
          return;
        }

        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...list.filter((m) => !ids.has(m.id)), ...prev];
        });

        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight;
        });
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được tin nhắn cũ");
      } finally {
        setLoadingOlder(false);
      }
    };

    requestAnimationFrame(() => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setAtBottom(nearBottom);
    });

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages, selected?.id, loadingOlder, hasMore]);

  const handleTyping = (val: string) => {
    setText(val);
    if (!selected?.id) return;

    try {
      socket.emit("chat:typing", { conversationId: selected.id, isTyping: true });
    } catch {}

    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      try {
        socket.emit("chat:typing", { conversationId: selected.id, isTyping: false });
      } catch {}
    }, 800);
  };

  const uploadFiles = async (files: File[]) => {
    const out: Attachment[] = [];
    for (const f of files) {
      const form = new FormData();
      form.append("file", f);
      const res = await api.post("/chat/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
      const att = res.data?.attachment;
      if (att?.url) out.push(att);
    }
    return out;
  };

  const send = async () => {
    if (!selected) return;
    if (!myId) {
      toast.error("Bạn chưa đăng nhập");
      return;
    }

    const trimmed = text.trim();
    const hasText = !!trimmed;
    const hasFiles = pendingFiles.length > 0;
    if (!hasText && !hasFiles) return;

    let attachments: Attachment[] = [];
    let type: "TEXT" | "IMAGE" | "FILE" = "TEXT";

    try {
      if (hasFiles) {
        setUploading(true);
        attachments = await uploadFiles(pendingFiles);
        const allImages = attachments.length > 0 && attachments.every((a) => (a.mime || "").startsWith("image/"));
        type = allImages ? "IMAGE" : "FILE";
      }

      const clientMessageId = makeClientMessageId();
      const nowIso = new Date().toISOString();

      // optimistic append (so UI feels instant and safe on reconnect)
      const optimistic = normalizeMessage({
        id: clientMessageId,
        conversationId: selected.id,
        senderId: myId,
        receiverId: selected.type === "DM" ? selected.otherUser?.id : null,
        text: hasText ? trimmed : "",
        content: hasText ? trimmed : "",
        type,
        attachments,
        createdAt: nowIso,
        isRead: false,
        clientStatus: socket && (socket as any).connected ? "sending" : "queued",
        clientError: null,
      } as any);

      setMessages((prev) => (prev.some((m) => m.id === optimistic.id) ? prev : [...prev, optimistic]));

      setText("");
      setPendingFiles([]);

      const payload = {
        conversationId: selected.id,
        text: hasText ? trimmed : undefined,
        type,
        attachments,
        clientMessageId,
      } as any;

      // queue + try send (idempotent via message id)
      outboxRef.current[clientMessageId] = { payload, attempts: 0 };
      trySendOutboxItem(clientMessageId);

      try {
        socket.emit("chat:typing", { conversationId: selected.id, isTyping: false });
      } catch {}

      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gửi tin nhắn thất bại");
    } finally {
      setUploading(false);
    }
  };


  const retrySend = (m: Message) => {
    if (!m?.id) return;

    if (!outboxRef.current[m.id]) {
      // rebuild payload from message snapshot (best-effort)
      outboxRef.current[m.id] = {
        attempts: 0,
        payload: {
          conversationId: m.conversationId,
          text: msgText(m) ? msgText(m) : undefined,
          type: (m.type || "TEXT") as any,
          attachments: m.attachments || [],
          clientMessageId: m.id,
        },
      };
    }

    trySendOutboxItem(m.id);
  };

  const startEdit = (m: Message) => {
    if ((m as any).clientStatus) {
      toast.error("Tin nhắn chưa gửi xong.");
      return;
    }
    setOpenMenuId(null);
    setEditingId(m.id);
    setEditText(msgText(m));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (m: Message) => {
    if ((m as any).clientStatus) {
      toast.error("Tin nhắn chưa gửi xong.");
      return;
    }
    const newText = editText.trim();
    if (!newText) return;
    try {
      await api.patch(`/chat/messages/${m.id}`, { text: newText });
      setEditingId(null);
      setEditText("");
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, text: newText, content: newText, editedAt: new Date().toISOString() } : x))
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Sửa tin nhắn thất bại");
    }
  };

  const revokeMsg = async (m: Message) => {
    setOpenMenuId(null);
    if ((m as any).clientStatus) {
      toast.error("Tin nhắn chưa gửi xong.");
      return;
    }
    try {
      await api.delete(`/chat/messages/${m.id}`);
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, deletedAt: new Date().toISOString(), text: "", content: "" } : x))
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Thu hồi thất bại");
    }
  };

  const hideMsg = async (m: Message) => {
    setOpenMenuId(null);
    if ((m as any).clientStatus) {
      toast.error("Tin nhắn chưa gửi xong.");
      return;
    }
    try {
      await api.post(`/chat/messages/${m.id}/hide`);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Xóa với tôi thất bại");
    }
  };

  // ✅ FIX: chặn action khi tin nhắn chưa có trên server (tránh spam 404)
  const react = async (m: Message, emoji: string) => {
    if ((m as any).clientStatus) {
      toast.error("Tin nhắn chưa gửi xong (đang đồng bộ).");
      return;
    }
    if (!m?.id || String(m.id).startsWith("tmp_")) {
      toast.error("Tin nhắn chưa có ID từ server (đang đồng bộ).");
      return;
    }
    try {
      await api.post(`/chat/messages/${m.id}/reactions`, { emoji });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Thả reaction thất bại");
    }
  };

  const typingLine = useMemo(() => {
    if (!selected?.id) return null;

    const typingUserIds = Object.keys(typingMap).filter((k) => typingMap[k]);
    if (typingUserIds.length === 0) return null;

    if (selected.type === "DM") return "đang nhập…";

    const names = typingUserIds.map((uid) => memberNameMap.get(uid) || "Ai đó").slice(0, 3);
    const extra = typingUserIds.length > 3 ? ` +${typingUserIds.length - 3}` : "";

    return `${names.join(", ")}${extra} đang nhập…`;
  }, [typingMap, selected?.id, selected?.type, memberNameMap]);

  const lastSeenLine = useMemo(() => {
    if (!myId) return null;
    if (!selected || selected.type !== "DM") return null;

    const myMsgs = messages.filter((m) => m.senderId === myId);
    if (!myMsgs.length) return null;
    const last = myMsgs[myMsgs.length - 1];
    if (!last?.isRead && !last?.readAt) return null;
    const t = last.readAt ? formatTime(last.readAt) : "";
    return t ? `Đã xem • ${t}` : "Đã xem";
  }, [messages, myId, selected]);

  // ✅ ALWAYS stable ids for React keys
  const rendered = useMemo(() => {
    const items: Array<{ kind: "day" | "msg"; id: string; day?: string; msg?: Message }> = [];
    let lastDayKey = "";

    for (const m0 of messages) {
      const m = normalizeMessage(m0); // re-normalize safety (id/createdAt)
      const d = new Date(m.createdAt);
      const dayKey = Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

      if (dayKey && dayKey !== lastDayKey) {
        items.push({ kind: "day", id: `day-${dayKey}`, day: formatDayLabel(m.createdAt) });
        lastDayKey = dayKey;
      }

      items.push({ kind: "msg", id: m.id, msg: m });
    }

    return items;
  }, [messages]);

  const openNewModal = async () => {
    setOpenNew(true);
    setNewTab("DM");
    setFriendQuery("");
    setGroupTitle("");
    setPicked([]);
    await loadFriends();
  };

  const createDmWith = async (user: FriendMini) => {
    try {
      const res = await api.post(`/chat/with/${user.id}`);
      const item = res.data as Conversation;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === item.id);
        if (exists) return prev.map((c) => (c.id === item.id ? ({ ...c, ...item } as any) : c));
        return [item, ...prev];
      });

      setSelected(item);
      setOpenNew(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không tạo được cuộc trò chuyện");
    }
  };

  const togglePick = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createGroup = async () => {
    const title = groupTitle.trim();
    if (!title) return toast.error("Nhập tên nhóm");
    if (picked.length < 2) return toast.error("Nhóm cần ít nhất 3 người (bạn + 2 người khác)");
    try {
      await api.post("/chat/groups", { title, memberIds: picked });
      setOpenNew(false);
      setGroupTitle("");
      setPicked([]);
      window.setTimeout(() => loadConversations(), 500);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Tạo nhóm thất bại");
    }
  };

  const groupActions = async () => {
    if (!selected) return;

    if (selected.type === "DM") {
      const nickname = window.prompt("Biệt danh của bạn trong cuộc chat này (để trống để xóa):", "");
      if (nickname === null) return;
      try {
        await api.patch(`/chat/conversations/${selected.id}/nickname`, { nickname });
        toast.success("Đã lưu biệt danh");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Lưu biệt danh thất bại");
      }
      return;
    }

    const choice = window.prompt(
      "Nhập số thao tác:\n1) Đổi tên nhóm\n2) Thêm thành viên\n3) Rời nhóm\n4) Đặt biệt danh của bạn",
      "1"
    );
    if (!choice) return;

    if (choice === "1") {
      const t = window.prompt("Tên nhóm mới:", selected.title);
      if (t === null) return;
      try {
        await api.patch(`/chat/conversations/${selected.id}`, { title: t });
        toast.success("Đã đổi tên nhóm");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Đổi tên thất bại");
      }
    }

    if (choice === "2") {
      await loadFriends();
      const ids = window.prompt(
        `Nhập userId để thêm (có thể nhiều id, cách nhau bởi dấu phẩy)\nGợi ý: bạn bè có trong /friends/list`,
        ""
      );
      if (ids === null) return;
      const arr = ids.split(",").map((x) => x.trim()).filter(Boolean);
      if (!arr.length) return;

      try {
        await api.post(`/chat/conversations/${selected.id}/members`, { userIds: arr });
        toast.success("Đã thêm thành viên");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Thêm thành viên thất bại");
      }
    }

    if (choice === "3") {
      const ok = window.confirm("Rời nhóm? Nếu bạn là chủ nhóm thì phải chuyển quyền (backend chặn).");
      if (!ok) return;
      try {
        await api.post(`/chat/conversations/${selected.id}/leave`);
        toast.success("Đã rời nhóm");
        setSelected(null);
        await loadConversations();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Rời nhóm thất bại");
      }
    }

    if (choice === "4") {
      const nickname = window.prompt("Biệt danh của bạn trong nhóm (để trống để xóa):", "");
      if (nickname === null) return;
      try {
        await api.patch(`/chat/conversations/${selected.id}/nickname`, { nickname });
        toast.success("Đã lưu biệt danh");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Lưu biệt danh thất bại");
      }
    }
  };

  const displayNameForMessage = (m: Message) => {
    const sd = (m.senderDisplayName || "").trim();
    if (sd) return sd;

    const nm = (m.sender?.name || "").trim();
    if (nm) return nm;

    const mm = memberNameMap.get(m.senderId);
    if (mm) return mm;

    if (selected?.type === "DM" && selected.otherUser?.id && m.senderId === selected.otherUser.id) {
      return selected.otherUser.name || "Người dùng";
    }

    return "Người dùng";
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="sb-title">Chats</div>

          <div className="sb-search">
            <span className="sb-search-ico">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên / email / nội dung…"
            />
          </div>

          <button className="sb-new-btn" onClick={openNewModal} title="Tạo chat / nhóm">
            ＋
          </button>
        </div>

        <div className="chat-conversation-list">
          {filteredConversations.length === 0 ? (
            <div className="sb-empty">
              <div className="sb-empty-title">Không có cuộc trò chuyện</div>
              <div className="sb-empty-sub">Bấm ＋ để tạo chat mới (với bạn bè) hoặc tạo nhóm.</div>
            </div>
          ) : (
            filteredConversations.map((c) => {
              if (!c?.id) return null;

              const active = selected?.id === c.id;
              const preview = c.lastMessage ? msgText(c.lastMessage) : "Chưa có tin nhắn";
              const online = c.type === "DM" ? onlineIds.includes(c.otherUser.id) : false;

              return (
                <button
                  key={c.id}
                  className={`chat-conversation-item ${active ? "active" : ""}`}
                  onClick={() => setSelected(c)}
                >
                  <div className={`avatar ${online ? "ring" : ""}`}>{convTitle(c).slice(0, 1).toUpperCase()}</div>

                  <div className="chat-conversation-meta">
                    <div className="row1">
                      <div className="name">
                        {convTitle(c)}
                        {c.type === "DM" ? <span className={`dot ${online ? "online" : "offline"}`} /> : null}
                        {c.type === "GROUP" ? <span className="group-pill">Nhóm</span> : null}
                      </div>
                      {(c as any).unread > 0 && <div className="badge">{(c as any).unread}</div>}
                    </div>
                    <div className="preview">{preview}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-main">
        {!selected ? (
          <div className="chat-empty">
            <div className="empty-card">
              <div className="empty-title">Chọn một cuộc trò chuyện</div>
              <div className="empty-sub">Bên trái là danh sách chat. Bấm ＋ để tạo chat mới.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="header-left">
                <div className={`avatar big ${isOtherOnline ? "ring" : ""}`}>{convTitle(selected).slice(0, 1).toUpperCase()}</div>
                <div className="header-meta">
                  <div className="title">{convTitle(selected)}</div>
                  <div className="sub">
                    {selected.type === "DM" ? (
                      <span className={`status ${isOtherOnline ? "on" : "off"}`}>
                        {isOtherOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                      </span>
                    ) : (
                      <span className="status on">{selected.membersCount} thành viên</span>
                    )}
                    {typingLine ? <span className="typing"> • {typingLine}</span> : null}
                  </div>
                </div>
              </div>

              <div className="header-actions">
                <button className="icon-btn" onClick={groupActions} title="Tùy chọn">
                  ⋯
                </button>

                <button
                  className="icon-btn"
                  onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                  title="Về cuối"
                >
                  ⤵
                </button>
              </div>
            </div>

            <div className="chat-messages" ref={listRef}>
              {loadingOlder && <div className="older-loading">Đang tải tin nhắn cũ…</div>}
              {loadingMsgs && <div className="older-loading">Đang tải…</div>}

              {rendered.map((it) => {
                if (it.kind === "day") {
                  return (
                    <div key={it.id} className="day-divider">
                      <span>{it.day}</span>
                    </div>
                  );
                }

                const m = it.msg!;
                const mine = !!(myId && m.senderId === myId);
                const deleted = !!m.deletedAt;
                const editing = editingId === m.id;

                const attachments: Attachment[] = Array.isArray(m.attachments) ? m.attachments : [];
                const isImage = (a: Attachment) => (a.mime || "").startsWith("image/");
                const grouped = groupReactions(m.reactions);

                return (
                  <div key={m.id} className={`msg-row ${mine ? "mine" : "other"}`}>
                    {!mine && <div className="avatar small">{displayNameForMessage(m).slice(0, 1).toUpperCase()}</div>}

                    <div className="msg-col">
                      {!mine && !deleted && <div className="sender-line">{displayNameForMessage(m)}</div>}

                      <div className={`bubble ${mine ? "mine" : "other"} ${deleted ? "deleted" : ""}`}>
                        {!deleted && (
                          <button
                            className="msg-menu-btn"
                            onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                            aria-label="menu"
                          >
                            ⋯
                          </button>
                        )}

                        {openMenuId === m.id && !deleted && (
                          <div className="msg-menu">
                            {mine && m.type === "TEXT" && <button onClick={() => startEdit(m)}>Sửa</button>}
                            {mine ? (
                              <button onClick={() => revokeMsg(m)}>Thu hồi</button>
                            ) : (
                              <button onClick={() => hideMsg(m)}>Xóa với tôi</button>
                            )}
                          </div>
                        )}

                        {deleted ? (
                          <div className="deleted-text">Tin nhắn đã được thu hồi</div>
                        ) : editing ? (
                          <div className="edit-box">
                            <input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(m);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button onClick={() => saveEdit(m)}>Lưu</button>
                              <button onClick={cancelEdit}>Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {!!msgText(m) && <div className="text">{msgText(m)}</div>}

                            {!!attachments.length && (
                              <div className="attachments">
                                {attachments.map((a, idx) => (
                                  <div key={`${m.id}-att-${idx}`} className="att-item">
                                    {isImage(a) ? (
                                      <img
                                        src={`${apiOrigin()}${a.url}`}
                                        alt={a.name || "image"}
                                        className="att-img"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <a
                                        href={`${apiOrigin()}${a.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="att-file"
                                      >
                                        📎 {a.name || "file"}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {m.editedAt && <div className="edited">(đã chỉnh sửa)</div>}
                          </>
                        )}

                        {!deleted && <span className={`tail ${mine ? "mine" : "other"}`} />}
                      </div>

                      {!deleted && grouped.length > 0 && (
                        <div className="reaction-summary">
                          {grouped.map((g) => (
                            <span key={`${m.id}-rc-${g.emoji}`} className="reaction-chip">
                              {g.emoji} {g.count}
                            </span>
                          ))}
                        </div>
                      )}

                      {!deleted && (
                        <div className="reaction-picker">
                          {REACTION_SET.map((e) => (
                            <button key={`${m.id}-pick-${e}`} onClick={() => react(m, e)} title="Reaction">
                              {e}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="meta">
                        <span className="time">{formatTime(m.createdAt)}</span>

                        {mine && (m as any).clientStatus && (
                          <button
                            className={`send-state ${(m as any).clientStatus === "failed" ? "failed" : ""}`}
                            title={(m as any).clientError || ""}
                            disabled={(m as any).clientStatus === "sending"}
                            onClick={() => {
                              if ((m as any).clientStatus === "failed" || (m as any).clientStatus === "queued") retrySend(m);
                            }}
                          >
                            {(m as any).clientStatus === "sending"
                              ? "Đang gửi…"
                              : (m as any).clientStatus === "queued"
                              ? "Đang chờ…"
                              : "Lỗi • thử lại"}
                          </button>
                        )}

                        {mine && selected.type === "DM" && (
                          <span className="seen">{m.isRead || m.readAt ? "✓✓" : "✓"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!!lastSeenLine && <div className="last-seen">{lastSeenLine}</div>}
              <div ref={bottomRef} />
            </div>

            {!atBottom && (
              <button
                className="scroll-bottom"
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                title="Về cuối"
              >
                ⤵
              </button>
            )}

            <div className="chat-compose">
              <label className="file-btn" title="Đính kèm">
                📎
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) setPendingFiles((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
              </label>

              <textarea
                className="chat-input"
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Nhập tin nhắn… (Enter để gửi • Shift+Enter xuống dòng)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={uploading}
                rows={1}
              />

              <button className="send-btn" onClick={send} disabled={uploading}>
                {uploading ? "Đang gửi…" : "Gửi"}
              </button>
            </div>

            {!!pendingFiles.length && (
              <div className="pending-files">
                <div className="pending-title">Đính kèm ({pendingFiles.length})</div>
                <div className="pending-list">
                  {pendingFiles.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="pending-item">
                      <span className="pending-name">{f.name}</span>
                      <button onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {openNew && (
        <div className="chat-modal">
          <div className="chat-modal-card">
            <div className="chat-modal-head">
              <div className="chat-modal-title">Tạo chat</div>
              <button className="icon-btn" onClick={() => setOpenNew(false)} title="Đóng">
                ✕
              </button>
            </div>

            <div className="chat-modal-tabs">
              <button className={newTab === "DM" ? "active" : ""} onClick={() => setNewTab("DM")}>
                Tin nhắn mới
              </button>
              <button className={newTab === "GROUP" ? "active" : ""} onClick={() => setNewTab("GROUP")}>
                Nhóm mới
              </button>
            </div>

            <div className="chat-modal-body">
              <div className="chat-modal-search">
                <input
                  value={friendQuery}
                  onChange={(e) => setFriendQuery(e.target.value)}
                  placeholder="Tìm bạn bè theo tên/email…"
                />
              </div>

              {newTab === "GROUP" && (
                <div className="chat-modal-groupTitle">
                  <input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="Tên nhóm…" />
                </div>
              )}

              <div className="chat-modal-list">
                {filteredFriends.length === 0 ? (
                  <div className="chat-modal-empty">Bạn chưa có bạn bè hoặc không tìm thấy.</div>
                ) : (
                  filteredFriends.map((u) => {
                    const checked = picked.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        className={`chat-modal-user ${checked ? "checked" : ""}`}
                        onClick={() => (newTab === "DM" ? createDmWith(u) : togglePick(u.id))}
                      >
                        <div className="avatar">{(u.name || "U").slice(0, 1).toUpperCase()}</div>
                        <div className="meta">
                          <div className="name">{u.name}</div>
                          <div className="email">{u.email}</div>
                        </div>
                        {newTab === "GROUP" && <div className="check">{checked ? "✓" : ""}</div>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="chat-modal-foot">
              <button className="btn" onClick={() => setOpenNew(false)}>
                Hủy
              </button>
              {newTab === "GROUP" && (
                <button className="btn primary" onClick={createGroup}>
                  Tạo nhóm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}