import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./Leaderboard.css";

type LBItem = {
  rank: number;
  userId: string;
  name: string;
  totalMinutes: number;
  maxStreak: number;
  isMe?: boolean;
};

function initials(name: string) {
  const s = (name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function heatEmoji(minutes: number) {
  if (minutes >= 180) return "🔥🔥🔥";
  if (minutes >= 90) return "🔥🔥";
  if (minutes >= 30) return "🔥";
  return "✨";
}

export default function Leaderboard() {
  const [type, setType] = useState<"week" | "month">("week");
  const [data, setData] = useState<LBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");

    try {
      // ưu tiên endpoint /me (có isMe)
      try {
        const res = await api.get<LBItem[]>(`/leaderboard/${type}/me`);
        setData(res.data ?? []);
        return;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status !== 401 && status !== 403) console.error("Failed /leaderboard/me", e);
      }

      const res2 = await api.get<LBItem[]>(`/leaderboard/${type}`);
      setData(res2.data ?? []);
    } catch (e) {
      console.error("Failed to load leaderboard", e);
      setData([]);
      setError("Không tải được BXH");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const top3 = useMemo(() => data.slice(0, 3), [data]);
  const rest = useMemo(() => data.slice(3), [data]);

  const maxMinutes = useMemo(() => {
    const m = Math.max(0, ...data.map((x) => x.totalMinutes ?? 0));
    return m || 1;
  }, [data]);

  const meInTop3 = useMemo(() => top3.some((x) => !!x.isMe), [top3]);

  useEffect(() => {
    if (!meInTop3) return;
    setShowConfetti(true);
    const t = window.setTimeout(() => setShowConfetti(false), 2600);
    return () => window.clearTimeout(t);
  }, [meInTop3]);

  // Podium order kiểu game: 2 - 1 - 3
  const podium = useMemo(() => {
    const r1 = top3.find((x) => x.rank === 1);
    const r2 = top3.find((x) => x.rank === 2);
    const r3 = top3.find((x) => x.rank === 3);
    return [r2, r1, r3].filter(Boolean) as LBItem[];
  }, [top3]);

  const renderConfetti = () => {
    if (!showConfetti) return null;
    const pieces = Array.from({ length: 18 }, (_, i) => i);
    return (
      <div className="lb-confetti" aria-hidden>
        {pieces.map((i) => (
          <span key={i} className={`lb-confetti-piece p${(i % 6) + 1}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="lb-page">
      {renderConfetti()}

      <div className="lb-header">
        <div className="lb-headLeft">
          <h1 className="lb-title">🏆 Bảng xếp hạng</h1>
          <div className="lb-sub">
            Xếp theo <b>phút học</b> (ưu tiên), tie-break theo <b>streak max</b>
          </div>
        </div>

        <button className="lb-refresh" onClick={fetchLeaderboard} disabled={loading}>
          ⟳ Làm mới
        </button>
      </div>

      <div className="lb-tabs">
        <button
          className={`lb-tab ${type === "week" ? "active" : ""}`}
          onClick={() => setType("week")}
          disabled={loading}
        >
          Tuần
        </button>
        <button
          className={`lb-tab ${type === "month" ? "active" : ""}`}
          onClick={() => setType("month")}
          disabled={loading}
        >
          Tháng
        </button>
      </div>

      {loading ? (
        <p className="lb-loading">Đang tải...</p>
      ) : error ? (
        <p className="lb-loading lb-error">{error}</p>
      ) : data.length === 0 ? (
        <p className="lb-loading">Chưa có dữ liệu</p>
      ) : (
        <>
          {/* ===== PODIUM GAME ===== */}
          <div className="lb-podiumGame">
            {podium.map((u) => {
              const percent = Math.round(((u.totalMinutes ?? 0) / maxMinutes) * 100);
              const isChampion = u.rank === 1;

              return (
                <div
                  key={u.userId}
                  className={[
                    "lb-podiumSlot",
                    isChampion ? "podium-1" : u.rank === 2 ? "podium-2" : "podium-3",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "lb-card",
                      isChampion ? "champion" : "",
                      u.isMe ? "meCard" : "",
                      percent >= 70 ? "hotCard" : "",
                    ].join(" ")}
                  >
                    <div className="lb-shimmer" />
                    <span className="lb-spark s1">✨</span>
                    <span className="lb-spark s2">✨</span>
                    <span className="ember" />

                    {isChampion && <div className="lb-badge gold">🔥 MVP</div>}
                    {u.isMe && <div className="lb-meTag">Bạn</div>}

                    <div className="lb-cardTop">
                      <div className={["lb-avatar", isChampion ? "gold" : "blue"].join(" ")} title="Avatar placeholder">
                        {initials(u.name)}
                        {(isChampion || percent >= 70) && (
                          <span className={`lb-flame ${isChampion ? "flicker" : ""}`}>🔥</span>
                        )}
                      </div>

                      <div className="lb-nameWrap">
                        <div className="lb-name">
                          {medal(u.rank)} {u.name} {u.isMe ? <span className="lb-meText">(bạn)</span> : null}
                        </div>
                        <div className="lb-meta">
                          #{u.rank} • <b>{u.totalMinutes ?? 0}</b> phút • streak max <b>{u.maxStreak ?? 0}</b>{" "}
                          <span className="lb-heat">{heatEmoji(u.totalMinutes ?? 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="lb-barWrap">
                      <div className="lb-bar">
                        <div
                          className={["lb-barFill", isChampion || percent >= 70 ? "hot" : "cool"].join(" ")}
                          style={{ width: `${percent}%` }}
                        />
                        <span className="lb-barGlow" />
                        <span className="lb-emberStream" aria-hidden />
                      </div>

                      <div className="lb-barText">{percent}% so với #1</div>
                    </div>

                    <div className={`lb-podiumBase base-${u.rank}`}>
                      <div className="lb-baseRank">#{u.rank}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== TABLE ===== */}
          <div className="lb-tableBox">
            <table className="lb-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>#</th>
                  <th>Tên</th>
                  <th style={{ width: 140 }}>Phút học</th>
                  <th style={{ width: 140 }}>Streak max</th>
                  <th style={{ width: 220 }}>Tiến độ</th>
                </tr>
              </thead>

              <tbody>
                {rest.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="lb-empty">
                      Chỉ có {top3.length} người
                    </td>
                  </tr>
                ) : (
                  rest.map((u) => {
                    const percent = Math.round(((u.totalMinutes ?? 0) / maxMinutes) * 100);
                    const hot = percent >= 70;

                    return (
                      <tr key={u.userId} className={u.isMe ? "meRow" : ""}>
                        <td className="lb-strong">
                          {u.rank} <span className="lb-heatTiny">{hot ? "🔥" : ""}</span>
                        </td>

                        <td>
                          <div className="lb-rowName">
                            <div className="lb-miniAvatar" title="Avatar placeholder">
                              {initials(u.name)}
                              {hot && <span className="lb-miniFlame">🔥</span>}
                            </div>
                            <span className="lb-rowNameText">
                              {u.name} {u.isMe ? <span className="lb-meText">(bạn)</span> : null}
                            </span>
                          </div>
                        </td>

                        <td>{u.totalMinutes ?? 0}</td>
                        <td>{u.maxStreak ?? 0}</td>

                        <td>
                          <div className="lb-bar small">
                            <div
                              className={["lb-barFill", hot ? "hot" : "cool"].join(" ")}
                              style={{ width: `${percent}%` }}
                            />
                            <span className="lb-barGlow" />
                            {hot && <span className="lb-emberStream" aria-hidden />}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
