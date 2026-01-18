import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "../../lib/toast";
import "./VocabBook.css";

import { getDailyStats, getPronMap } from "../../lib/vocabLocal";

type Progress =
  | {
      box: number;
      nextReview: string;
      correct: number;
      wrong: number;
      lastSeen: string;
    }
  | null;

type Status = "new" | "learning" | "due" | "weak" | "mastered";

type CatalogItem = {
  id: number;
  zh: string;
  pinyin: string;
  vi: string;
  level: number;
  status: Status;
  selected: boolean;
  progress: Progress;
};

type CatalogResponse = {
  page: number;
  limit: number;
  total: number;
  items: CatalogItem[];
};

type FilterKey = "all" | "new" | "learning" | "due" | "weak" | "mastered" | "selected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Chưa học" },
  { key: "learning", label: "Đang học" },
  { key: "due", label: "Đến hạn ôn" },
  { key: "weak", label: "Yếu" },
  { key: "mastered", label: "Đã nhớ" },
  { key: "selected", label: "Danh sách của tôi" },
];

function statusLabel(s: Status) {
  switch (s) {
    case "new":
      return "NEW";
    case "learning":
      return "LEARNING";
    case "due":
      return "DUE";
    case "weak":
      return "WEAK";
    case "mastered":
      return "MASTERED";
    default:
      return String(s).toUpperCase();
  }
}

export default function VocabBook() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [active, setActive] = useState<CatalogItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ✅ modal add vocab
  const [openAdd, setOpenAdd] = useState(false);
  const [tab, setTab] = useState<"form" | "paste">("form");

  // form
  const [newZh, setNewZh] = useState("");
  const [newPinyin, setNewPinyin] = useState("");
  const [newVi, setNewVi] = useState("");
  const [newLevel, setNewLevel] = useState<number>(1);

  // paste
  const [bulkText, setBulkText] = useState("");
  const [delimiter, setDelimiter] = useState("|");
  const [bulkReport, setBulkReport] = useState<any>(null);

  const [saving, setSaving] = useState(false);

  // local stats + pron
  const [todayStats, setTodayStats] = useState(() => getDailyStats());
  const [pronMap, setPronMapState] = useState(() => getPronMap());

  const limit = 50;
  const debouncedQ = useMemo(() => q.trim(), [q]);

  const fetchPage = async (p: number, replace = false) => {
    try {
      setLoading(true);

      const res = await api.get<CatalogResponse>("/vocab/catalog", {
        params: { q: debouncedQ, filter, page: p, limit },
      });

      const data = res.data;
      setTotal(data.total);

      if (replace) {
        setItems(data.items);
        setHasMore(data.items.length < data.total);
      } else {
        setItems((prev) => {
          const merged = [...prev, ...data.items];
          setHasMore(merged.length < data.total);
          return merged;
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("❌ Không tải được sổ từ vựng");
    } finally {
      setLoading(false);
    }
  };

  // ✅ reload khi filter/q đổi
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setActive(null);
      fetchPage(1, true);
      setTodayStats(getDailyStats());
      setPronMapState(getPronMap());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedQ]);

  // ✅ quay lại tab/window thì refetch => status + pron + stats cập nhật ngay
  useEffect(() => {
    const onFocus = () => {
      fetchPage(1, true);
      setTodayStats(getDailyStats());
      setPronMapState(getPronMap());
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedQ]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          fetchPage(next, false);
        }
      },
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, filter, debouncedQ]);

  const toggleMyList = async (vocabId: number) => {
    setItems((prev) => prev.map((it) => (it.id === vocabId ? { ...it, selected: !it.selected } : it)));
    if (active?.id === vocabId) setActive({ ...active, selected: !active.selected });

    try {
      const res = await api.post("/vocab/my-list/toggle", { vocabId });
      const selected = !!res.data?.selected;

      setItems((prev) => prev.map((it) => (it.id === vocabId ? { ...it, selected } : it)));
      if (active?.id === vocabId) setActive({ ...active, selected });

      toast.success(selected ? "✅ Đã thêm vào danh sách học" : "🗑️ Đã bỏ khỏi danh sách");
    } catch (e) {
      console.error(e);
      toast.error("❌ Toggle thất bại");
      setItems((prev) => prev.map((it) => (it.id === vocabId ? { ...it, selected: !it.selected } : it)));
      if (active?.id === vocabId) setActive({ ...active, selected: !active.selected });
    }
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
  };

  const resetAddForm = () => {
    setNewZh("");
    setNewPinyin("");
    setNewVi("");
    setNewLevel(1);
  };

  const resetBulk = () => {
    setBulkText("");
    setDelimiter("|");
    setBulkReport(null);
  };

  const closeModal = () => {
    setOpenAdd(false);
    setTab("form");
    resetAddForm();
    resetBulk();
  };

  const submitAdd = async () => {
    const zh = newZh.trim();
    const vi = newVi.trim();
    const pinyin = newPinyin.trim();

    if (!zh || !vi) {
      toast.error("❌ Bắt buộc nhập chữ Hán (zh) và nghĩa (vi)");
      return;
    }

    try {
      setSaving(true);
      const res = await api.post("/vocab/create", {
        zh,
        pinyin,
        vi,
        level: newLevel || 1,
        addToMyList: true,
      });

      if (res.data?.ok === false) {
        toast.error(res.data?.message || "❌ Không tạo được từ");
        return;
      }

      const created = !!res.data?.created;
      toast.success(created ? "✅ Đã tạo từ mới + thêm vào danh sách" : "✅ Từ đã tồn tại, đã thêm vào danh sách");

      setPage(1);
      await fetchPage(1, true);
      closeModal();
    } catch (e) {
      console.error(e);
      toast.error("❌ Lưu từ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const submitBulk = async () => {
    const text = bulkText.trim();
    if (!text) {
      toast.error("❌ Chưa dán dữ liệu");
      return;
    }

    try {
      setSaving(true);
      setBulkReport(null);

      const res = await api.post("/vocab/bulk-create", {
        text,
        delimiter: delimiter || "|",
        addToMyList: true,
        defaultLevel: 1,
      });

      if (res.data?.ok === false) {
        toast.error(res.data?.message || "❌ Import thất bại");
        return;
      }

      setBulkReport(res.data);
      toast.success(`✅ Import xong: tạo ${res.data.createdCount}, đã có ${res.data.existedCount}`);

      setPage(1);
      await fetchPage(1, true);
    } catch (e) {
      console.error(e);
      toast.error("❌ Import thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vb-page">
      <div className="vb-header">
        <div>
          <h1>📒 Sổ từ vựng</h1>
          <p className="vb-sub">Tìm kiếm • chọn từ để học • thêm từ mới ngay tại đây</p>
          <p className="vb-sub" style={{ opacity: 0.9 }}>
            📊 Hôm nay: ✅ {todayStats.correct} • ❌ {todayStats.wrong} • Tổng {todayStats.total} • Từ đã làm: {todayStats.uniqueIds.length}
          </p>
        </div>

        <div className="vb-header-right">
          <button className="vb-add-new" onClick={() => setOpenAdd(true)}>
            ➕ Thêm từ
          </button>

          <button className="vb-add-new" onClick={() => nav("/learn-vocab?mode=selected")}>
            🃏 Học danh sách của tôi
          </button>

          <div className="vb-count">
            <span className="vb-count-num">{total}</span>
            <span className="vb-count-text">từ</span>
          </div>
        </div>
      </div>

      <div className="vb-controls">
        <input className="vb-search" placeholder="Tìm: 明天 / ming / ngày mai..." value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="vb-filters">
          {FILTERS.map((f) => (
            <button key={f.key} className={`vb-chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="vb-grid">
        <div className="vb-list">
          {items.map((it) => {
            const p = pronMap[it.id];
            return (
              <div key={it.id} className={`vb-item ${active?.id === it.id ? "active" : ""}`} onClick={() => setActive(it)}>
                <div className="vb-main">
                  <div className="vb-zh">{it.zh}</div>
                  <div className="vb-subline">
                    <span className="vb-py mono">{it.pinyin}</span>
                    <span className="vb-vi">{it.vi}</span>
                  </div>
                </div>

                <div className="vb-right">
                  <span className={`vb-badge ${it.status}`}>{statusLabel(it.status)}</span>

                  {p && (
                    <span
                      className="vb-badge"
                      style={{ marginLeft: 8, opacity: 0.9 }}
                      title={`Pron: last ${p.lastScore}% • best ${p.bestScore}% • avg ${p.avgScore}% • attempts ${p.attempts}`}
                    >
                      🎙 {p.lastScore}%
                    </span>
                  )}

                  <button
                    className={`vb-add ${it.selected ? "on" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMyList(it.id);
                    }}
                  >
                    {it.selected ? "✓ Đã chọn" : "+ Học"}
                  </button>
                </div>
              </div>
            );
          })}

          {loading && <div className="vb-loading">Đang tải...</div>}
          <div ref={sentinelRef} />
          {!hasMore && !loading && items.length > 0 && <div className="vb-end">Hết dữ liệu.</div>}
        </div>

        <div className="vb-panel">
          {!active ? (
            <div className="vb-panel-empty">Chọn 1 từ bên trái để xem chi tiết.</div>
          ) : (
            <div>
              <div className="vb-panel-top">
                <div className="vb-panel-zh">{active.zh}</div>
                <span className={`vb-badge big ${active.status}`}>{statusLabel(active.status)}</span>
              </div>

              <div className="vb-panel-row">
                <div className="vb-label">Pinyin</div>
                <div className="mono vb-value">{active.pinyin}</div>
              </div>

              <div className="vb-panel-row">
                <div className="vb-label">Nghĩa</div>
                <div className="vb-value">{active.vi}</div>
              </div>

              <div className="vb-panel-row">
                <div className="vb-label">Level</div>
                <div className="vb-value">{active.level}</div>
              </div>

              {active.progress && (
                <div className="vb-progress">
                  <div className="vb-progress-title">Progress</div>
                  <div className="vb-progress-grid">
                    <div>
                      <div className="vb-mini">Box</div>
                      <div className="vb-big">{active.progress.box}</div>
                    </div>
                    <div>
                      <div className="vb-mini">Correct</div>
                      <div className="vb-big">{active.progress.correct}</div>
                    </div>
                    <div>
                      <div className="vb-mini">Wrong</div>
                      <div className="vb-big">{active.progress.wrong}</div>
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const p = pronMap[active.id];
                if (!p) return null;
                return (
                  <div className="vb-progress" style={{ marginTop: 12 }}>
                    <div className="vb-progress-title">🎙 Phát âm (local)</div>
                    <div className="vb-progress-grid">
                      <div>
                        <div className="vb-mini">Last</div>
                        <div className="vb-big">{p.lastScore}%</div>
                      </div>
                      <div>
                        <div className="vb-mini">Best</div>
                        <div className="vb-big">{p.bestScore}%</div>
                      </div>
                      <div>
                        <div className="vb-mini">Avg</div>
                        <div className="vb-big">{p.avgScore}%</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, opacity: 0.8 }}>
                      Attempts: <b>{p.attempts}</b> • Last said: <span className="mono">{p.lastText}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="vb-actions">
                <button className="vb-btn" onClick={() => speak(active.zh)}>
                  🔊 Nghe
                </button>

                <button className={`vb-btn ${active.selected ? "ghost" : "primary"}`} onClick={() => toggleMyList(active.id)}>
                  {active.selected ? "🗑️ Bỏ khỏi danh sách" : "+ Thêm vào danh sách"}
                </button>

                <button className="vb-btn primary" onClick={() => nav(`/learn-vocab?mode=selected&focusId=${active.id}`)}>
                  🃏 Học từ này (trong list)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ADD */}
      {openAdd && (
        <div className="vb-modal-overlay" onMouseDown={closeModal}>
          <div className="vb-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="vb-modal-head">
              <div className="vb-modal-title">➕ Thêm từ vựng</div>
              <button className="vb-modal-x" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="vb-tabs">
              <button className={`vb-tab ${tab === "form" ? "active" : ""}`} onClick={() => setTab("form")}>
                Nhập thường
              </button>
              <button className={`vb-tab ${tab === "paste" ? "active" : ""}`} onClick={() => setTab("paste")}>
                Dán nhanh
              </button>
            </div>

            <div className="vb-modal-body">
              {tab === "form" ? (
                <>
                  <label className="vb-field">
                    <span>Chữ Hán (zh) *</span>
                    <input value={newZh} onChange={(e) => setNewZh(e.target.value)} placeholder="Ví dụ: 明天" />
                  </label>

                  <label className="vb-field">
                    <span>Phiên âm Pinyin</span>
                    <input value={newPinyin} onChange={(e) => setNewPinyin(e.target.value)} placeholder="Ví dụ: nǐ hǎo (hoặc ni3 hao3)" />
                  </label>

                  <label className="vb-field">
                    <span>Nghĩa (vi) *</span>
                    <input value={newVi} onChange={(e) => setNewVi(e.target.value)} placeholder="Ví dụ: ngày mai" />
                  </label>

                  <label className="vb-field">
                    <span>Mức độ</span>
                    <input type="number" min={1} max={6} value={newLevel} onChange={(e) => setNewLevel(Number(e.target.value || 1))} />
                  </label>

                  <div className="vb-modal-note">Sau khi lưu, từ sẽ tự động thêm vào “Danh sách của tôi” để học ngay.</div>

                  <div className="vb-modal-actions">
                    <button className="vb-btn" onClick={closeModal} disabled={saving}>
                      Hủy bỏ
                    </button>
                    <button className="vb-btn primary" onClick={submitAdd} disabled={saving}>
                      {saving ? "Đang lưu..." : "Lưu từ"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="vb-paste-help">
                    <div className="vb-paste-title">Dán nhiều dòng theo format:</div>
                    <div className="vb-code">
                      明天 | míng tiān | ngày mai | 1{"\n"}
                      你好 | nǐ hǎo | xin chào | 1{"\n"}
                      学习 | xué xí | học tập | 2
                    </div>
                    <div className="vb-paste-note">
                      Có thể bỏ level (mặc định 1). Có thể dán kiểu <b>zh | vi</b> nếu chưa có pinyin.
                    </div>
                  </div>

                  <div className="vb-paste-row">
                    <span>Delimiter</span>
                    <input className="vb-delim" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} placeholder="|" />
                  </div>

                  <textarea className="vb-textarea" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Dán dữ liệu ở đây..." rows={8} />

                  {bulkReport && (
                    <div className="vb-report">
                      ✅ Valid: <b>{bulkReport.validLines}</b> / {bulkReport.totalLines} • Tạo mới: <b>{bulkReport.createdCount}</b> • Đã có:{" "}
                      <b>{bulkReport.existedCount}</b>
                      {bulkReport.errors?.length > 0 && (
                        <div className="vb-report-err">
                          Có lỗi: <b>{bulkReport.errors.length}</b> dòng
                        </div>
                      )}
                    </div>
                  )}

                  <div className="vb-modal-actions">
                    <button className="vb-btn" onClick={closeModal} disabled={saving}>
                      Đóng
                    </button>
                    <button className="vb-btn primary" onClick={submitBulk} disabled={saving}>
                      {saving ? "Đang import..." : "Import"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
