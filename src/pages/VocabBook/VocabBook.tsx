import { startTransition, useEffect, useMemo, useRef, useState } from "react";
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
  level: number; // dùng như "HSK" / chủ đề
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

type HskFilter = "all" | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Chưa học" },
  { key: "learning", label: "Đang học" },
  { key: "due", label: "Đến hạn ôn" },
  { key: "weak", label: "Yếu" },
  { key: "mastered", label: "Đã nhớ" },
  { key: "selected", label: "Danh sách của tôi" },
];

const HSKS: HskFilter[] = ["all", 1, 2, 3, 4, 5, 6];

// HSK chỉ 1-6. Dữ liệu cũ có thể bị "level" lớn (ví dụ 49/100) => coi là invalid và mặc định 1.
function clampHsk(n: any): 1 | 2 | 3 | 4 | 5 | 6 {
  const v = parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(v) || v < 1 || v > 6) return 1;
  return v as 1 | 2 | 3 | 4 | 5 | 6;
}

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
  const [hsk, setHsk] = useState<HskFilter>("all");

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // bulk tick + bulk actions (chọn nhiều để bỏ khỏi danh sách)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // Cho phép user bỏ chọn trong lúc đang bulk add/remove mà không bị khóa UI.
  // (Không hủy request đang chạy, chỉ tránh disable các nút chọn/bỏ chọn.)
  const bulkAbortRef = useRef({ aborted: false });

  const [active, setActive] = useState<CatalogItem | null>(null);

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
  const qTrim = useMemo(() => q.trim(), [q]);
  const [qDebounced, setQDebounced] = useState(qTrim);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  // Debounce ONLY the search query. HSK/filter switching should be immediate.
  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(qTrim), 250);
    return () => window.clearTimeout(t);
  }, [qTrim]);

  const abortRef = useRef<AbortController | null>(null);
  const reqSeqRef = useRef(0);
  const catalogCacheRef = useRef(new Map<string, { ts: number; value: CatalogResponse }>());
  const loadingTimerRef = useRef<number | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = async (p: number) => {
  const key = `${filter}|${hsk}|${qDebounced}|${p}`;

  // Serve from cache for fast tab switching
  const cached = catalogCacheRef.current.get(key);
  // Cache a little longer so switching HSK tabs feels instant.
  if (cached && Date.now() - cached.ts < 120_000) {
    const data = cached.value;
    setLoading(false);
    startTransition(() => {
      setItems(data.items || []);
      setTotal(data.total || 0);
      const serverPage = data.page ?? p;
      setPage(serverPage);
      setPageInput(String(serverPage));
    });
    return;
  }

  // Abort previous request
  abortRef.current?.abort();
  const ac = new AbortController();
  abortRef.current = ac;

  const seq = ++reqSeqRef.current;

  try {
    // Avoid spinner flicker for very fast responses
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => {
      if (seq === reqSeqRef.current) setLoading(true);
    }, 120);

    const params: any = { q: qDebounced, filter, page: p, limit };
    if (hsk !== "all") params.hsk = hsk;

    const res = await api.get<CatalogResponse>("/vocab/catalog", {
      params,
      signal: ac.signal as any,
    });
    const data = res.data;

    // Ignore stale responses
    if (seq !== reqSeqRef.current) return;

    startTransition(() => {
      setItems(data.items || []);
      setTotal(data.total || 0);

      const serverPage = data.page ?? p;
      setPage(serverPage);
      setPageInput(String(serverPage));
    });

    catalogCacheRef.current.set(key, { ts: Date.now(), value: data });
  } catch (e: any) {
    if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
    console.error(e);
    toast.error("❌ Không tải được sổ từ vựng");
    setItems([]);
    setTotal(0);
  } finally {
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    if (seq === reqSeqRef.current) setLoading(false);
  }
  };

  const gotoPage = (p: number) => {
    const next = Math.min(Math.max(p, 1), totalPages);
    setActive(null);
    setPage(next);
    setPageInput(String(next));
    fetchPage(next);
  };

  // ✅ reload khi filter/hsk/search (debounced) đổi
  useEffect(() => {
    setActive(null);
    setCheckedIds(new Set());
    setPage(1);
    setPageInput("1");
    listScrollRef.current?.scrollTo({ top: 0 });
    fetchPage(1);
    setTodayStats(getDailyStats());
    // NOTE: pronMap đọc localStorage + parse JSON khá nặng => chỉ update khi focus (bên dưới)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, hsk, qDebounced]);

  // ✅ quay lại tab/window thì refetch => status + pron + stats cập nhật ngay
  useEffect(() => {
    const onFocus = () => {
      fetchPage(page);
      setTodayStats(getDailyStats());
      setPronMapState(getPronMap());
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, hsk, qDebounced, page]);

  // nếu total giảm làm page vượt trần (ví dụ lọc hsk) => clamp
  useEffect(() => {
    if (page > totalPages) {
      gotoPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const toggleMyList = async (vocabId: number) => {
    setItems((prev) => prev.map((it) => (it.id === vocabId ? { ...it, selected: !it.selected } : it)));
    if (active?.id === vocabId) setActive({ ...active, selected: !active.selected });
    // data đã thay đổi => cache trang cũ có thể stale
    catalogCacheRef.current.clear();

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

  const setChecked = (id: number, on: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const tickAllInPage = () => {
    // Chỉ cập nhật state 1 lần (không loop setState), giúp mượt.
    const ids = items.map((it) => it.id);
    setCheckedIds(new Set(ids));
  };

  const clearTick = () => {
    setCheckedIds(new Set());
    // Cho UX: user bấm bỏ chọn trong lúc bulk đang chạy vẫn ok.
    bulkAbortRef.current.aborted = true;
  };

  const bulkSetMyList = async (ids: number[], add: boolean) => {
    const vocabIds = Array.from(new Set(ids))
      .map((x) => Math.round(Number(x)))
      .filter((x) => Number.isFinite(x) && x > 0);

    if (!vocabIds.length) return;

    const idSet = new Set(vocabIds);

    setBulkBusy(true);

    // Optimistic UI (instant)
    setItems((prev) => prev.map((it) => (idSet.has(it.id) ? { ...it, selected: add } : it)));
    if (active && idSet.has(active.id)) setActive({ ...active, selected: add });

    try {
      await api.post("/vocab/my-list/bulk", {
        action: add ? "add" : "remove",
        vocabIds,
      });

      // data đã thay đổi => cache trang cũ có thể stale
      catalogCacheRef.current.clear();

      // keep checkbox selection coherent
      if (!add) {
        setCheckedIds((prev) => {
          const next = new Set(prev);
          for (const id of vocabIds) next.delete(id);
          return next;
        });
      }

      toast.success(add ? `✅ Đã thêm ${vocabIds.length} từ vào My List` : `🗑️ Đã bỏ ${vocabIds.length} từ khỏi My List`);
    } catch (e) {
      console.error(e);
      toast.error("❌ Không cập nhật được My List");
      // rollback by refetch current page
      await fetchPage(page);
    } finally {
      setBulkBusy(false);
    }
  };


  const bulkRemoveChecked = async () => {
    const ids = Array.from(checkedIds);
    await bulkSetMyList(ids, false);
    clearTick();
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
        level: clampHsk(newLevel), // HSK/chủ đề chỉ 1-6
        addToMyList: true,
      });

      if (res.data?.ok === false) {
        toast.error(res.data?.message || "❌ Không tạo được từ");
        return;
      }

      const created = !!res.data?.created;
      toast.success(created ? "✅ Đã tạo từ mới + thêm vào danh sách" : "✅ Từ đã tồn tại, đã thêm vào danh sách");

      gotoPage(1);
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

      gotoPage(1);
    } catch (e) {
      console.error(e);
      toast.error("❌ Import thất bại");
    } finally {
      setSaving(false);
    }
  };

  const pager = (
    <div className="vb-pager" aria-label="Pagination">
      <button className="vb-page-btn" onClick={() => gotoPage(1)} disabled={page <= 1 || loading}>
        ⏮
      </button>
      <button className="vb-page-btn" onClick={() => gotoPage(page - 1)} disabled={page <= 1 || loading}>
        ◀
      </button>

      <div className="vb-page-mid">
        Trang <b>{page}</b>/<span>{totalPages}</span>
      </div>

      <div className="vb-page-jump">
        <input
          className="vb-page-input"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Nhập số trang"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const n = parseInt(pageInput, 10);
              if (Number.isFinite(n)) gotoPage(n);
            }
          }}
        />
        <button
          className="vb-page-go"
          disabled={loading}
          onClick={() => {
            const n = parseInt(pageInput, 10);
            if (!Number.isFinite(n)) return;
            gotoPage(n);
          }}
        >
          Đi
        </button>
      </div>

      <button className="vb-page-btn" onClick={() => gotoPage(page + 1)} disabled={page >= totalPages || loading}>
        ▶
      </button>
      <button className="vb-page-btn" onClick={() => gotoPage(totalPages)} disabled={page >= totalPages || loading}>
        ⏭
      </button>
    </div>
  );

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

          <button className="vb-add-new" onClick={() => nav("/learn-vocab?mode=selected")}
          >
            🃏 Học danh sách của tôi
          </button>

          <button className="vb-add-new" onClick={() => nav("/pinyin-lab")}>
            🔤 Pinyin Lab
          </button>

          <div className="vb-count">
            <span className="vb-count-num">{total}</span>
            <span className="vb-count-text">từ</span>
          </div>
        </div>
      </div>

      <div className="vb-controls">
        <input className="vb-search" placeholder="Tìm: 明天 / ming / ngày mai..." value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="vb-filter-block">
          <div className="vb-filter-title">Trạng thái</div>
          <div className="vb-filters">
            {FILTERS.map((f) => (
              <button key={f.key} className={`vb-chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="vb-filter-block">
          <div className="vb-filter-title">Chủ đề (HSK)</div>
          <div className="vb-filters vb-filters-hsk">
            {HSKS.map((k) => {
              const isActive = hsk === k;
              const label = k === "all" ? "Tất cả" : `HSK ${k}`;
              return (
                <button key={String(k)} className={`vb-chip ${isActive ? "active" : ""}`} onClick={() => setHsk(k)}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="vb-grid">
        <div className="vb-list">
          <div className="vb-bulkbar" aria-label="Bulk actions">
            <div className="vb-bulk-left">
              Đã chọn: <b>{checkedIds.size}</b>
            </div>
            <div className="vb-bulk-actions">
              {/* Chọn/Bỏ chọn chỉ là UI, không nên bị khóa khi đang bulk add/remove */}
              <button className="vb-bulk-btn" onClick={tickAllInPage} disabled={loading || items.length === 0}>
                Chọn tất cả
              </button>
              <button className="vb-bulk-btn" onClick={clearTick} disabled={loading || checkedIds.size === 0}>
                Bỏ chọn
              </button>
              <button className="vb-bulk-btn danger" onClick={bulkRemoveChecked} disabled={loading || bulkBusy || checkedIds.size === 0}>
                🗑️ Xóa (đã chọn)
              </button>

              <span className="vb-bulk-sep" />

              <button
                className="vb-bulk-btn"
                onClick={() => bulkSetMyList(items.map((it) => it.id), true)}
                disabled={loading || bulkBusy || items.length === 0}
                title="Thêm tất cả mục đang hiển thị vào Danh sách của tôi"
              >
                + Thêm tất cả (trang)
              </button>
              <button
                className="vb-bulk-btn"
                onClick={() => bulkSetMyList(items.map((it) => it.id), false)}
                disabled={loading || bulkBusy || items.length === 0}
                title="Bỏ tất cả mục đang hiển thị khỏi Danh sách của tôi"
              >
                Bỏ tất cả (trang)
              </button>
            </div>
          </div>

          <div className="vb-list-scroll" role="list" ref={listScrollRef}>
            {items.map((it) => {
              const p = pronMap[it.id];
              return (
                <div key={it.id} className={`vb-item ${active?.id === it.id ? "active" : ""}`} onClick={() => setActive(it)} role="listitem">
                  <div
                    className="vb-check"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIds.has(it.id)}
                      onChange={(e) => setChecked(it.id, e.target.checked)}
                      aria-label={`Chọn từ ${it.zh}`}
                    />
                  </div>

                  <div className="vb-main">
                    <div className="vb-zh">{it.zh}</div>
                    <div className="vb-subline">
                      <span className="vb-py mono">{it.pinyin}</span>
                      <span className="vb-vi">{it.vi}</span>
                    </div>
                  </div>

                  <div className="vb-right">
                    <span className={`vb-badge ${it.status}`}>{statusLabel(it.status)}</span>

                    <span className="vb-badge vb-hsk-badge" title="Chủ đề (HSK 1-6)">
                      HSK {clampHsk(it.level)}
                    </span>

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

            {!loading && items.length === 0 && <div className="vb-end">Không có dữ liệu.</div>}
            {loading && <div className="vb-loading">Đang tải...</div>}
          </div>

          {pager}
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
                <div className="vb-label">Chủ đề (HSK)</div>
                <div className="vb-value">HSK {clampHsk(active.level)}</div>
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
                    <span>Chủ đề (HSK 1-6)</span>
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
                      Số cuối là <b>HSK/chủ đề</b> (1-6). Có thể bỏ (mặc định 1). Có thể dán kiểu <b>zh | vi</b> nếu chưa có pinyin.
                    </div>
                  </div>

                  <div className="vb-paste-row">
                    <span>Delimiter</span>
                    <input className="vb-delim" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} placeholder="|" />
                  </div>

                  <textarea className="vb-textarea" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Dán dữ liệu ở đây..." rows={8} />

                  {bulkReport && (
                    <div className="vb-report">
                      ✅ Valid: <b>{bulkReport.validLines}</b> / {bulkReport.totalLines} • Tạo mới: <b>{bulkReport.createdCount}</b> • Đã có: <b>{bulkReport.existedCount}</b>
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
