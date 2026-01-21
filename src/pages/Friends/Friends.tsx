import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { getAuthToken } from "../../lib/authToken";
import toast from "../../lib/toast";
import "./Friends.css";

type SafeUser = {
  id: string;
  name: string;
  email: string;
};

type IncomingReq = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  sender: SafeUser;
};

type SentReq = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  receiver: SafeUser;
};

type TabKey = "friends" | "find" | "incoming" | "sent";

function decodeUserIdFromToken(): string | null {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;

    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(json);
    return data?.sub ?? data?.id ?? null;
  } catch {
    return null;
  }
}

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] || "?").toUpperCase();
  return ((parts[0][0] || "?") + (parts[parts.length - 1][0] || "")).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return <div className="fr-avatar">{initials(name)}</div>;
}

export default function Friends() {
  const [tab, setTab] = useState<TabKey>("friends");
  const [loading, setLoading] = useState(false);

  const [friends, setFriends] = useState<SafeUser[]>([]);
  const [searchResults, setSearchResults] = useState<SafeUser[]>([]);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [incoming, setIncoming] = useState<IncomingReq[]>([]);
  const [sent, setSent] = useState<SentReq[]>([]);

  const [q, setQ] = useState("");
  const [myId, setMyId] = useState<string | null>(() => decodeUserIdFromToken());
  const [debouncedQ, setDebouncedQ] = useState<string>("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  // keep myId reactive when token changes (login/logout)
  useEffect(() => {
    const onToken = () => setMyId(decodeUserIdFromToken());
    window.addEventListener("auth:token", onToken as any);
    window.addEventListener("storage", onToken);
    return () => {
      window.removeEventListener("auth:token", onToken as any);
      window.removeEventListener("storage", onToken);
    };
  }, []);

  const refreshCore = async () => {
    setLoading(true);
    try {
      const [friendsRes, incomingRes, sentRes] = await Promise.all([
        api.get("/friends/list"),
        api.get("/friends/requests/incoming"),
        api.get("/friends/requests/sent"),
      ]);

      setFriends(friendsRes.data || []);
      setIncoming(incomingRes.data || []);
      setSent(sentRes.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không tải được dữ liệu bạn bè");
    } finally {
      setLoading(false);
    }
  };

  const searchUsersFirstPage = async () => {
    setSearchLoading(true);
    try {
      const res = await api.get("/users/search", {
        params: { q: debouncedQ, limit: 30 },
      });

      const items: SafeUser[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.items as SafeUser[]) || [];

      const nextCursor: string | null =
        Array.isArray(res.data) ? null : (res.data?.nextCursor as string | null) ?? null;

      setSearchResults(items || []);
      setSearchCursor(nextCursor);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không tải được danh sách người dùng");
      setSearchResults([]);
      setSearchCursor(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchUsersNextPage = async () => {
    if (!searchCursor || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await api.get("/users/search", {
        params: { q: debouncedQ, limit: 30, cursor: searchCursor },
      });

      const items: SafeUser[] = (res.data?.items as SafeUser[]) || [];
      const nextCursor: string | null = (res.data?.nextCursor as string | null) ?? null;

      setSearchResults((prev) => {
        const seen = new Set(prev.map((u) => u.id));
        const merged = [...prev];
        for (const u of items) {
          if (!seen.has(u.id)) {
            merged.push(u);
            seen.add(u.id);
          }
        }
        return merged;
      });
      setSearchCursor(nextCursor);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không tải thêm được");
    } finally {
      setSearchLoading(false);
    }
  };

  const refreshAll = async () => {
    await refreshCore();
    if (tab === "find") await searchUsersFirstPage();
  };

  useEffect(() => {
    refreshCore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "find") searchUsersFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedQ, myId]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);
  const incomingSenderIds = useMemo(() => new Set(incoming.map((r) => r.senderId)), [incoming]);
  const sentReceiverIds = useMemo(() => new Set(sent.map((r) => r.receiverId)), [sent]);

  const filteredUsers = useMemo(() => {
    return (searchResults || []).filter((u) => (myId ? u.id !== myId : true));
  }, [searchResults, myId]);

  const sendRequest = async (receiverId: string) => {
    try {
      await api.post("/friends/request", { receiverId });
      toast.success("Đã gửi lời mời");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không gửi được lời mời");
    }
  };

  const accept = async (senderId: string) => {
    try {
      await api.post("/friends/accept", { senderId });
      toast.success("Đã chấp nhận");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không chấp nhận được");
    }
  };

  const reject = async (senderId: string) => {
    try {
      await api.post("/friends/reject", { senderId });
      toast.success("Đã từ chối");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không từ chối được");
    }
  };

  return (
    <div className="friends-page">
      {/* HERO */}
      <div className="fr-hero">
        <div className="fr-heroLeft">
          <div className="fr-heroIcon" aria-hidden>
            👥
          </div>
          <div>
            <h1 className="fr-title">Kết nối bạn</h1>
            <p className="fr-sub">
              Kết bạn để theo dõi hoạt động học và streak của nhau.
              <span className="fr-subDot">•</span>
              <b>{friends.length}</b> bạn
              <span className="fr-subDot">•</span>
              <b>{incoming.length}</b> lời mời đến
              <span className="fr-subDot">•</span>
              <b>{sent.length}</b> đã gửi
            </p>
          </div>
        </div>

        <button className="fr-refreshBtn" onClick={refreshAll} disabled={loading}>
          {loading ? "⏳ Đang tải..." : "⟲ Làm mới"}
        </button>
      </div>

      {/* TABS */}
      <div className="fr-tabsWrap">
        <button className={`fr-tab ${tab === "friends" ? "active" : ""}`} onClick={() => setTab("friends")}>
          Bạn bè <span className="fr-badge">{friends.length}</span>
        </button>

        <button className={`fr-tab ${tab === "find" ? "active" : ""}`} onClick={() => setTab("find")}>
          Tìm người
        </button>

        <button className={`fr-tab ${tab === "incoming" ? "active" : ""}`} onClick={() => setTab("incoming")}>
          Lời mời đến <span className="fr-badge">{incoming.length}</span>
        </button>

        <button className={`fr-tab ${tab === "sent" ? "active" : ""}`} onClick={() => setTab("sent")}>
          Đã gửi <span className="fr-badge">{sent.length}</span>
        </button>
      </div>

      {/* ===== FRIEND LIST ===== */}
      {tab === "friends" && (
        <div className="fr-grid">
          {friends.length === 0 ? (
            <div className="fr-card fr-empty">
              <h3>Chưa có bạn bè</h3>
              <p className="fr-muted">
                Sang tab <b>Tìm người</b> để gửi lời mời kết bạn.
              </p>
            </div>
          ) : (
            friends.map((u) => (
              <div className="fr-card" key={u.id}>
                <div className="fr-left">
                  <Avatar name={u.name} />
                  <div className="fr-info">
                    <div className="fr-name">{u.name}</div>
                    <div className="fr-email">{u.email}</div>
                  </div>
                </div>
                <div className="fr-status ok">✅ Đã kết bạn</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== FIND USERS ===== */}
      {tab === "find" && (
        <div>
          <div className="fr-search">
            <span className="fr-searchIcon" aria-hidden>
              🔎
            </span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc email..." />
          </div>

          <div className="fr-muted" style={{ margin: "8px 2px 0" }}>
            {searchLoading ? "⏳ Đang tải..." : `Kết quả: ${filteredUsers.length}`}
          </div>

          <div className="fr-grid">
            {filteredUsers.length === 0 ? (
              <div className="fr-card fr-empty">
                <h3>Không có kết quả</h3>
                <p className="fr-muted">Thử tìm theo email/tên khác.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isFriend = friendIds.has(u.id);
                const isIncoming = incomingSenderIds.has(u.id);
                const isSent = sentReceiverIds.has(u.id);

                return (
                  <div className="fr-card" key={u.id}>
                    <div className="fr-left">
                      <Avatar name={u.name} />
                      <div className="fr-info">
                        <div className="fr-name">{u.name}</div>
                        <div className="fr-email">{u.email}</div>
                      </div>
                    </div>

                    <div className="fr-actions">
                      {isFriend && <div className="fr-status ok">Bạn bè</div>}

                      {!isFriend && isSent && <div className="fr-status pending">⏳ Đã gửi</div>}

                      {!isFriend && isIncoming && (
                        <>
                          <button className="fr-btn fr-btnPrimary" onClick={() => accept(u.id)}>
                            Chấp nhận
                          </button>
                          <button className="fr-btn fr-btnDanger" onClick={() => reject(u.id)}>
                            Từ chối
                          </button>
                        </>
                      )}

                      {!isFriend && !isSent && !isIncoming && (
                        <button className="fr-btn fr-btnPrimary" onClick={() => sendRequest(u.id)}>
                          Kết bạn
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {searchCursor && (
            <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
              <button
                className="fr-btn fr-btnPrimary"
                onClick={searchUsersNextPage}
                disabled={searchLoading}
                title="Tải thêm"
              >
                {searchLoading ? "⏳ Đang tải..." : "Tải thêm"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== INCOMING ===== */}
      {tab === "incoming" && (
        <div className="fr-grid">
          {incoming.length === 0 ? (
            <div className="fr-card fr-empty">
              <h3>Không có lời mời đến</h3>
              <p className="fr-muted">Khi ai đó gửi lời mời, nó sẽ hiện ở đây.</p>
            </div>
          ) : (
            incoming.map((r) => (
              <div className="fr-card" key={r.id}>
                <div className="fr-left">
                  <Avatar name={r.sender.name} />
                  <div className="fr-info">
                    <div className="fr-name">{r.sender.name}</div>
                    <div className="fr-email">{r.sender.email}</div>
                  </div>
                </div>

                <div className="fr-actions">
                  <button className="fr-btn fr-btnPrimary" onClick={() => accept(r.senderId)}>
                    Chấp nhận
                  </button>
                  <button className="fr-btn fr-btnDanger" onClick={() => reject(r.senderId)}>
                    Từ chối
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== SENT ===== */}
      {tab === "sent" && (
        <div className="fr-grid">
          {sent.length === 0 ? (
            <div className="fr-card fr-empty">
              <h3>Chưa gửi lời mời nào</h3>
              <p className="fr-muted">Sang tab Tìm người để gửi lời mời.</p>
            </div>
          ) : (
            sent.map((r) => (
              <div className="fr-card" key={r.id}>
                <div className="fr-left">
                  <Avatar name={r.receiver.name} />
                  <div className="fr-info">
                    <div className="fr-name">{r.receiver.name}</div>
                    <div className="fr-email">{r.receiver.email}</div>
                  </div>
                </div>

                <div className="fr-status pending">⏳ Đang chờ</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
