import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import "./Activity.css";

type FriendToday = {
  user: { id: string; name: string; email: string };
  minutesToday: number;
  vocabCorrect: number;
  vocabWrong: number;
  sentenceTotal: number;
  sentenceCorrect: number;
  sentenceWrong: number;
};

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return ((parts[0][0] ?? "?") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function heatLevel(minutes: number, totalItems: number) {
  // totalItems = vocabTotal + sentenceTotal
  const score = minutes * 2 + totalItems * 3;
  if (score >= 220) return { label: "RỰC CHÁY", emoji: "🔥🔥🔥", cls: "hot3" as const };
  if (score >= 120) return { label: "NÓNG", emoji: "🔥🔥", cls: "hot2" as const };
  if (score >= 40) return { label: "ẤM", emoji: "🔥", cls: "hot1" as const };
  return { label: "NHẸ", emoji: "✨", cls: "cool" as const };
}

function hasActivity(r: FriendToday) {
  const vTotal = (r.vocabCorrect ?? 0) + (r.vocabWrong ?? 0);
  const sTotal = r.sentenceTotal ?? 0;
  return (r.minutesToday ?? 0) > 0 || vTotal > 0 || sTotal > 0;
}

export default function Activity() {
  const [rows, setRows] = useState<FriendToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlightRef = useRef(false);

  const load = async (silent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!silent) setLoading(true);
    setErr("");

    try {
      const res = await api.get("/study/friends/today");
      setRows(res.data || []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Không tải được dữ liệu");
    } finally {
      if (!silent) setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    load(false);

    // Poll nhẹ hơn (đỡ spam API), vẫn “live” đủ mượt
    const t = window.setInterval(() => {
      // nếu tab ẩn thì khỏi poll
      if (document.visibilityState === "hidden") return;
      load(true);
    }, 6000);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStudying = useMemo(() => rows.filter(hasActivity).length, [rows]);
  const totalFriends = rows.length;

  const activeSorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      // ưu tiên: minutes, rồi tổng items
      const aItems = (a.vocabCorrect + a.vocabWrong) + a.sentenceTotal;
      const bItems = (b.vocabCorrect + b.vocabWrong) + b.sentenceTotal;
      return (b.minutesToday - a.minutesToday) || (bItems - aItems);
    });
    return copy;
  }, [rows]);

  return (
    <div className="act-page">
      {/* header */}
      <div className="act-header">
        <div className="act-titleWrap">
          <h1 className="act-title">
            <span className="act-icon">📣</span>
            Theo dõi bạn bè
            <span className="act-glowDot" aria-hidden />
          </h1>

          <div className="act-sub">
            <span className="act-subPill">
              <b>{totalStudying}</b>/<b>{totalFriends}</b> có hoạt động hôm nay
            </span>

            {lastUpdated && (
              <span className="act-updated">
                Cập nhật:{" "}
                <b>
                  {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </b>
              </span>
            )}
          </div>
        </div>

        <div className="act-actions">
          <button
            className="act-refresh"
            onClick={() => load(false)}
            disabled={loading}
            title="Làm mới"
          >
            <span className={loading ? "spin" : ""}>⟳</span> Làm mới
          </button>
        </div>
      </div>

      {/* state */}
      {loading ? (
        <div className="act-loading">
          <div className="act-skeletonHeader" />
          <div className="act-skeletonGrid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="act-skeletonCard" key={i} />
            ))}
          </div>
        </div>
      ) : err ? (
        <div className="act-error">
          <div className="act-errorTitle">⚠️ Có lỗi</div>
          <div className="act-errorMsg">{err}</div>
          <button className="act-refresh ghost" onClick={() => load(false)}>
            ⟳ Thử lại
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="act-empty">
          <div className="act-emptyTitle">Bạn chưa có bạn bè.</div>
          <div className="act-emptySub">Qua tab Bạn bè để kết bạn trước nhé.</div>
        </div>
      ) : (
        <>
          <div className="act-grid">
            {activeSorted.map((r) => {
              const vTotal = (r.vocabCorrect ?? 0) + (r.vocabWrong ?? 0);
              const sTotal = r.sentenceTotal ?? 0;
              const totalItems = vTotal + sTotal;

              const heat = heatLevel(r.minutesToday ?? 0, totalItems);
              const active = hasActivity(r);

              // % bar: so với người top minutes (đỡ phải gọi API khác)
              const maxMin = Math.max(1, ...rows.map((x) => x.minutesToday ?? 0));
              const barPct = Math.min(100, Math.round(((r.minutesToday ?? 0) / maxMin) * 100));

              return (
                <div
                  key={r.user.id}
                  className={[
                    "act-card",
                    active ? "active" : "idle",
                    `heat-${heat.cls}`,
                  ].join(" ")}
                >
                  <div className="act-cardGlow" aria-hidden />
                  <div className="act-cardTop">
                    <div className="act-avatar" title={r.user.email}>
                      {initials(r.user.name)}
                      {active && <span className="act-flame" aria-hidden>🔥</span>}
                    </div>

                    <div className="act-user">
                      <div className="act-nameRow">
                        <div className="act-name">{r.user.name}</div>
                        <span className={`act-heatBadge ${heat.cls}`}>
                          {heat.emoji} {heat.label}
                        </span>
                      </div>
                      <div className="act-email">{r.user.email}</div>
                    </div>

                    <div className={`act-minBadge ${active ? "on" : "off"}`}>
                      {r.minutesToday > 0 ? (
                        <>
                          <span className="act-minIcon">⏱</span>
                          <b>{r.minutesToday}</b> phút
                        </>
                      ) : (
                        "Chưa có phút"
                      )}
                    </div>
                  </div>

                  {/* progress */}
                  <div className="act-progress">
                    <div className="act-bar">
                      <div className="act-barFill" style={{ width: `${barPct}%` }} />
                      <span className="act-barGlow" aria-hidden />
                    </div>
                    <div className="act-progressText">
                      Tiến độ thời gian học: <b>{barPct}%</b> so với top
                    </div>
                  </div>

                  <div className="act-stats">
                    <div className="act-box">
                      <div className="act-boxTitle">Từ vựng</div>
                      <div className="act-boxValue">{vTotal} từ</div>
                      <div className="act-boxMeta">
                        <span className="ok">✅ {r.vocabCorrect}</span>
                        <span className="bad">❌ {r.vocabWrong}</span>
                      </div>
                    </div>

                    <div className="act-box">
                      <div className="act-boxTitle">Học câu</div>
                      <div className="act-boxValue">{sTotal} câu</div>
                      <div className="act-boxMeta">
                        <span className="ok">✅ {r.sentenceCorrect}</span>
                        <span className="bad">❌ {r.sentenceWrong}</span>
                      </div>
                    </div>
                  </div>

                  <div className="act-footnote">
                    * Avatar đang là placeholder (sau này login/profile cập nhật ảnh thật).
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
