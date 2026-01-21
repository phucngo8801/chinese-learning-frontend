import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lessons } from "../../data/lessons";
import "./Lessons.css";

type LessonItem = {
  id: number;
  vi: string;
  zh: string;
  pinyin: string;
};

type LessonsMap = Record<string, LessonItem[]>;

const STORAGE_DONE_KEY = "done_lessons_vi";

function readDoneSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DONE_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr.filter((x) => typeof x === "string" && x.trim()));
  } catch {
    return new Set<string>();
  }
}

function writeDoneSet(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export default function Lessons() {
  const navigate = useNavigate();

  const lessonMap = lessons as unknown as LessonsMap;
  const levels = Object.keys(lessonMap);

  const [activeLevel, setActiveLevel] = useState(levels[0] || "HSK1");
  const [q, setQ] = useState("");

  const [doneSet, setDoneSet] = useState<Set<string>>(() => readDoneSet());

  const list = lessonMap[activeLevel] || [];

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((it) => {
      return (
        it.vi.toLowerCase().includes(keyword) ||
        it.zh.includes(keyword) ||
        it.pinyin.toLowerCase().includes(keyword)
      );
    });
  }, [q, list]);

  const openLearn = (lesson: LessonItem) => {
    navigate("/learn", { state: { lesson } });
  };

  const markDone = (viText: string) => {
    const key = (viText || "").trim();
    if (!key) return;
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.add(key);
      writeDoneSet(next);
      return next;
    });
  };

  const clearDone = () => {
    localStorage.removeItem(STORAGE_DONE_KEY);
    setDoneSet(new Set());
  };

  const totalDoneInLevel = list.filter((x) => doneSet.has(x.vi)).length;
  const progressPercent =
    list.length === 0 ? 0 : Math.round((totalDoneInLevel / list.length) * 100);

  return (
    <div className="lessons-page">
      <div className="lessons-shell">
        {/* HERO (đồng bộ style Friends) */}
        <div className="ls-hero">
          <div className="ls-heroLeft">
            <div className="ls-heroIcon" aria-hidden="true">
              📚
            </div>
            <div className="ls-heroInfo">
              <h1 className="ls-title">Bài học tiếng Trung</h1>
              <p className="ls-sub">
                Chọn HSK, tìm câu, bấm vào để sang trang Học (nghe – nói – đọc).
              </p>
            </div>
          </div>

          <div className="ls-actions">
            <button className="ls-btn ls-btnGhost" onClick={clearDone}>
              Reset
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="ls-tabsWrap">
          {levels.map((lv) => {
            const active = lv === activeLevel;
            return (
              <button
                key={lv}
                className={active ? "ls-tab active" : "ls-tab"}
                onClick={() => setActiveLevel(lv)}
              >
                <span className="ls-tabText">{lv}</span>
                <span className="ls-badge">{lessonMap[lv]?.length ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* PANEL: PROGRESS + SEARCH */}
        <div className="ls-panel">
          <div className="ls-panelRow">
            <div className="ls-progress">
              <div className="ls-progressTop">
                <div className="ls-progressLabel">
                  Tiến độ {activeLevel}:{" "}
                  <b>
                    {totalDoneInLevel}/{list.length}
                  </b>{" "}
                  ({progressPercent}%)
                </div>

                <div className="ls-progressPill">
                  ✅ Đã học: <b>{totalDoneInLevel}</b>
                </div>
              </div>

              <div className="ls-progressBar" aria-label="progress">
                <div
                  className="ls-progressFill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="ls-search">
              <span className="ls-searchIcon" aria-hidden="true">
                🔎
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tiếng Việt / 汉字 / pinyin..."
              />
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="ls-grid">
          {filtered.map((item) => {
            const done = doneSet.has(item.vi);
            return (
              <div key={item.id} className="ls-card">
                <div className="ls-cardTop">
                  <span className="ls-levelPill">{activeLevel}</span>

                  {done && <span className="ls-donePill">Đã học</span>}
                </div>

                <div className="ls-zh">{item.zh}</div>
                <div className="ls-pinyin">{item.pinyin}</div>
                <div className="ls-vi">{item.vi}</div>

                <div className="ls-cardActions">
                  <button
                    className="ls-btn ls-btnPrimary"
                    onClick={() => openLearn(item)}
                  >
                    Học câu này →
                  </button>

                  {!done ? (
                    <button
                      className="ls-btn"
                      onClick={() => markDone(item.vi)}
                    >
                      Đánh dấu đã học
                    </button>
                  ) : (
                    <button className="ls-btn disabled" disabled>
                      Đã học
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="ls-empty">Không tìm thấy kết quả.</div>
        )}
      </div>
    </div>
  );
}
