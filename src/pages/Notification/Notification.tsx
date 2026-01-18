import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./Notification.css";

type NotiType =
  | "GENERAL"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "STREAK"
  | "ACHIEVEMENT"
  | "SYSTEM";

type NotificationItem = {
  id: string;
  type?: NotiType;
  title?: string | null;
  message: string;
  link?: string | null;
  data?: any;
  readAt?: string | null; // ISO
  createdAt: string; // ISO
};

type ListResponse = {
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
  items: NotificationItem[];
};

type Filter = "all" | "unread" | "read";

function safeType(t?: string | null): NotiType {
  const x = (t || "GENERAL").toUpperCase();
  const ok: Record<string, NotiType> = {
    GENERAL: "GENERAL",
    FRIEND_REQUEST: "FRIEND_REQUEST",
    FRIEND_ACCEPTED: "FRIEND_ACCEPTED",
    STREAK: "STREAK",
    ACHIEVEMENT: "ACHIEVEMENT",
    SYSTEM: "SYSTEM",
  };
  return ok[x] ?? "GENERAL";
}

function iconForType(t: NotiType) {
  switch (t) {
    case "FRIEND_REQUEST":
      return "🤝";
    case "FRIEND_ACCEPTED":
      return "✅";
    case "STREAK":
      return "🔥";
    case "ACHIEVEMENT":
      return "🏆";
    case "SYSTEM":
      return "🛡️";
    default:
      return "🔔";
  }
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return "";
  const diff = Math.floor((Date.now() - d) / 1000);

  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  const mins = Math.floor(diff / 60);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);

  if (diff < 30) return "vừa xong";
  if (mins < 60) return rtf.format(-mins, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-days, "day");
}

export default function Notification() {
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const hasMore = useMemo(() => items.length < total, [items.length, total]);

  const fetchList = async (opts?: { reset?: boolean; page?: number }) => {
    const reset = !!opts?.reset;
    const p = opts?.page ?? (reset ? 1 : page);

    setLoading(true);
    setError("");

    try {
      const res = await api.get<ListResponse>("/notification", {
        params: { filter, page: p, limit },
      });

      const data = res.data as any;
      const nextItems: NotificationItem[] = (data?.items ?? []).map((n: any) => ({
        id: String(n.id),
        type: safeType(n.type),
        title: n.title ?? null,
        message: String(n.message ?? ""),
        link: n.link ?? null,
        data: n.data ?? null,
        readAt: n.readAt ?? null,
        createdAt: String(n.createdAt ?? new Date().toISOString()),
      }));

      setTotal(Number(data?.total ?? 0));
      setUnreadCount(Number(data?.unreadCount ?? 0));

      if (reset) {
        setItems(nextItems);
        setPage(1);
      } else {
        setItems((prev) => {
          const merged = [...prev, ...nextItems];
          // chống duplicate nếu bấm load/refresh nhanh
          const seen = new Set<string>();
          return merged.filter((x) => {
            if (seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
          });
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không tải được thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // đổi filter => reset list
    fetchList({ reset: true, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const refresh = async () => {
    await fetchList({ reset: true, page: 1 });
  };

  const loadMore = async () => {
    const next = page + 1;
    setPage(next);
    await fetchList({ reset: false, page: next });
  };

  const markOneRead = async (id: string) => {
    try {
      // optimistic UI
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x)),
      );
      await api.post(`/notification/${id}/read`);
      // refresh count nhẹ
      await fetchList({ reset: true, page: 1 });
    } catch (e) {
      // rollback nếu fail
      await refresh();
    }
  };

  const markAllRead = async () => {
    if (busyAction) return;
    setBusyAction(true);
    try {
      await api.post("/notification/read-all");
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không đọc được tất cả");
    } finally {
      setBusyAction(false);
    }
  };

  const removeOne = async (id: string) => {
    if (busyAction) return;
    setBusyAction(true);
    try {
      setItems((prev) => prev.filter((x) => x.id !== id));
      await api.delete(`/notification/${id}`);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không xoá được");
      await refresh();
    } finally {
      setBusyAction(false);
    }
  };

  const clearRead = async () => {
    if (busyAction) return;
    setBusyAction(true);
    try {
      await api.delete("/notification/clear", { params: { mode: "read" } });
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không xoá được thông báo đã đọc");
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="noti-page">
      {/* Header */}
      <div className="noti-header">
        <div className="noti-titleBlock">
          <h1 className="noti-title">
            🔔 Thông báo{" "}
            {unreadCount > 0 ? <span className="noti-pill">{unreadCount} mới</span> : null}
          </h1>
          <div className="noti-sub">Gom tất cả sự kiện: bạn bè • streak • hệ thống • thành tích</div>
        </div>

        <div className="noti-actions">
          <button className="noti-btn ghost" onClick={refresh} disabled={loading || busyAction}>
            ⟳ Làm mới
          </button>
          <button className="noti-btn" onClick={markAllRead} disabled={loading || busyAction || unreadCount === 0}>
            ✓ Đọc tất cả
          </button>
          <button className="noti-btn danger" onClick={clearRead} disabled={loading || busyAction}>
            🧹 Xoá đã đọc
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="noti-tabs">
        <button
          className={`noti-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
          disabled={loading}
        >
          Tất cả
        </button>
        <button
          className={`noti-tab ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
          disabled={loading}
        >
          Chưa đọc {unreadCount > 0 ? <span className="noti-dot" /> : null}
        </button>
        <button
          className={`noti-tab ${filter === "read" ? "active" : ""}`}
          onClick={() => setFilter("read")}
          disabled={loading}
        >
          Đã đọc
        </button>
      </div>

      {/* Content */}
      {loading && items.length === 0 ? (
        <div className="noti-state">
          <div className="noti-spinner" />
          <div>Đang tải…</div>
        </div>
      ) : error ? (
        <div className="noti-state error">{error}</div>
      ) : items.length === 0 ? (
        <div className="noti-state">
          <div className="noti-empty">Chưa có thông báo.</div>
        </div>
      ) : (
        <div className="noti-list">
          {items.map((n) => {
            const type = safeType(n.type);
            const unread = !n.readAt; // nếu backend chưa có readAt => xem như chưa đọc

            return (
              <div key={n.id} className={`noti-item ${unread ? "unread" : "read"}`}>
                <div className={`noti-icon ${type === "STREAK" ? "fire" : ""}`}>
                  <span className="noti-iconEmoji">{iconForType(type)}</span>
                  {type === "STREAK" ? <span className="noti-flame" aria-hidden>🔥</span> : null}
                </div>

                <div className="noti-content">
                  <div className="noti-topline">
                    <div className="noti-itemTitle">
                      {n.title?.trim() ? n.title : "Thông báo"}
                      {unread ? <span className="noti-new">NEW</span> : null}
                    </div>
                    <div className="noti-time">{timeAgo(n.createdAt)}</div>
                  </div>

                  <div className="noti-message">{n.message}</div>

                  <div className="noti-rowActions">
                    {unread ? (
                      <button className="noti-mini" onClick={() => markOneRead(n.id)} disabled={busyAction}>
                        ✓ Đánh dấu đã đọc
                      </button>
                    ) : (
                      <span className="noti-readMark">Đã đọc</span>
                    )}

                    {n.link ? (
                      <a className="noti-mini link" href={n.link} target="_blank" rel="noreferrer">
                        ↗ Mở
                      </a>
                    ) : null}

                    <button className="noti-mini danger" onClick={() => removeOne(n.id)} disabled={busyAction}>
                      🗑 Xoá
                    </button>
                  </div>
                </div>

                {/* glow */}
                {unread ? <span className="noti-glow" aria-hidden /> : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="noti-footer">
        <div className="noti-footLeft">
          Tổng: <b>{total}</b> • Đang hiện: <b>{items.length}</b>
        </div>

        <div className="noti-footRight">
          {hasMore ? (
            <button className="noti-btn ghost" onClick={loadMore} disabled={loading || busyAction}>
              Tải thêm
            </button>
          ) : (
            <span className="noti-footHint">Hết rồi 😄</span>
          )}
        </div>
      </div>
    </div>
  );
}
