import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { READER_STORIES, type ReaderStory, type ReaderVocab } from "../../data/readerStories";
import "./HanziWorld.css";

type BankItem = ReaderVocab & {
  addedAt: number;
};

type Seg =
  | { kind: "text"; text: string }
  | { kind: "term"; text: string; term: ReaderVocab };

type VoiceStyle = "neutral" | "cheerful" | "story" | "clear";

type GameQ = {
  promptZh: string;
  promptPinyin: string;
  correctVi: string;
  options: string[];
};

const STYLE_PRESETS: Record<
  VoiceStyle,
  { label: string; rateMul: number; pitch: number; volume: number; pauseMs: number }
> = {
  neutral: { label: "Bình thường", rateMul: 1, pitch: 1, volume: 1, pauseMs: 180 },
  cheerful: { label: "Vui tươi", rateMul: 1.05, pitch: 1.12, volume: 1, pauseMs: 150 },
  story: { label: "Kể chuyện", rateMul: 0.95, pitch: 0.98, volume: 1, pauseMs: 240 },
  clear: { label: "Rõ ràng", rateMul: 0.9, pitch: 1.0, volume: 1, pauseMs: 220 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeZh(s: string) {
  return (s || "").trim();
}

function hasCJK(s: string): boolean {
  return /[\u3400-\u4DBF\u4E00-\u9FFF]/.test(s || "");
}

function normalizePinyin(s: string): string {
  const t = (s || "").toLowerCase();
  const map: Record<string, string> = {
    ā: "a",
    á: "a",
    ǎ: "a",
    à: "a",
    ē: "e",
    é: "e",
    ě: "e",
    è: "e",
    ī: "i",
    í: "i",
    ǐ: "i",
    ì: "i",
    ō: "o",
    ó: "o",
    ǒ: "o",
    ò: "o",
    ū: "u",
    ú: "u",
    ǔ: "u",
    ù: "u",
    ǖ: "u",
    ǘ: "u",
    ǚ: "u",
    ǜ: "u",
    ü: "u",
  };

  const noTone = t.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (m) => map[m] || m);
  // Keep letters/numbers/spaces; remove punctuation; join for robust contains()
  return noTone.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/ /g, "");
}

function splitSentencesZh(text: string): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean.match(/[^。！？!?]+[。！？!?]?/g);
  if (!parts || !parts.length) return [clean];
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 1200);
}

function buildSegments(zh: string, vocab: ReaderVocab[]): Seg[] {
  const s = zh || "";
  if (!s) return [];

  const terms = [...vocab].sort((a, b) => b.zh.length - a.zh.length);
  const out: Seg[] = [];
  let buf = "";

  const flushBuf = () => {
    if (buf) {
      out.push({ kind: "text", text: buf });
      buf = "";
    }
  };

  let i = 0;
  while (i < s.length) {
    let matched: ReaderVocab | null = null;
    for (const t of terms) {
      if (!t.zh) continue;
      if (s.startsWith(t.zh, i)) {
        matched = t;
        break;
      }
    }

    if (matched) {
      flushBuf();
      out.push({ kind: "term", text: matched.zh, term: matched });
      i += matched.zh.length;
      continue;
    }

    buf += s[i];
    i += 1;
  }

  flushBuf();
  return out;
}

function randInt(n: number) {
  return Math.floor(Math.random() * n);
}

function pickUnique<T>(arr: T[], k: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (a.length && out.length < k) {
    const idx = randInt(a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

export default function HanziWorld() {
  const [storyId, setStoryId] = useState(() => localStorage.getItem("hw.storyId") || READER_STORIES[0]?.id);
  const [showPinyin, setShowPinyin] = useState(() => localStorage.getItem("hw.showPinyin") !== "0");
  const [showVi, setShowVi] = useState(() => localStorage.getItem("hw.showVi") === "1");
  const [rate, setRate] = useState(() => Number(localStorage.getItem("hw.rate") || "1"));

  // Voice/TTS
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState(() => localStorage.getItem("hw.voiceURI") || "");
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(
    () => (localStorage.getItem("hw.voiceStyle") as VoiceStyle) || "cheerful"
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [selected, setSelected] = useState<ReaderVocab | null>(null);
  const [bank, setBank] = useState<BankItem[]>(() => {
    try {
      const raw = localStorage.getItem("hw.bank");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(Boolean);
    } catch {
      return [];
    }
  });

  // Mini-game state
  const [gameOpen, setGameOpen] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<GameQ | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);

  // Free response (>= 5 words) — ONLY Chinese (contains Hanzi) OR Pinyin
  const [freeText, setFreeText] = useState("");
  const [freeFb, setFreeFb] = useState<{ kind: "warn" | "good"; text: string } | null>(null);

  const story: ReaderStory | undefined = useMemo(
    () => READER_STORIES.find((s) => s.id === storyId) || READER_STORIES[0],
    [storyId]
  );

  const vocab = story?.vocab || [];

  const zhVoices = useMemo(() => {
    const vs = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("zh"));
    return vs.length ? vs : voices;
  }, [voices]);

  const selectedVoice = useMemo(() => {
    if (!voiceURI) return undefined;
    return zhVoices.find((v) => v.voiceURI === voiceURI);
  }, [voiceURI, zhVoices]);

  const preset = STYLE_PRESETS[voiceStyle];

  const stopSpeaking = () => {
    try {
      speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  };

  const speakOnce = (text: string) => {
    const clean = (text || "").trim();
    if (!clean) return;

    try {
      stopSpeaking();
      setIsSpeaking(true);

      const u = new SpeechSynthesisUtterance(clean);
      u.lang = selectedVoice?.lang || "zh-CN";
      if (selectedVoice) u.voice = selectedVoice;
      u.rate = clamp(rate * preset.rateMul, 0.6, 1.5);
      u.pitch = preset.pitch;
      u.volume = preset.volume;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
    }
  };

  const speakQueue = (chunks: string[]) => {
    if (!chunks.length) return;

    try {
      stopSpeaking();
      setIsSpeaking(true);

      let i = 0;
      const speakNext = () => {
        if (i >= chunks.length) {
          setIsSpeaking(false);
          return;
        }
        const chunk = chunks[i].trim();
        if (!chunk) {
          i += 1;
          window.setTimeout(speakNext, preset.pauseMs);
          return;
        }

        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = selectedVoice?.lang || "zh-CN";
        if (selectedVoice) u.voice = selectedVoice;
        u.rate = clamp(rate * preset.rateMul, 0.6, 1.5);
        u.pitch = preset.pitch;
        u.volume = preset.volume;
        u.onend = () => {
          i += 1;
          window.setTimeout(speakNext, preset.pauseMs);
        };
        u.onerror = () => {
          i += 1;
          window.setTimeout(speakNext, preset.pauseMs);
        };

        speechSynthesis.speak(u);
      };

      speakNext();
    } catch {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (storyId) localStorage.setItem("hw.storyId", storyId);
  }, [storyId]);

  useEffect(() => {
    localStorage.setItem("hw.showPinyin", showPinyin ? "1" : "0");
  }, [showPinyin]);

  useEffect(() => {
    localStorage.setItem("hw.showVi", showVi ? "1" : "0");
  }, [showVi]);

  useEffect(() => {
    localStorage.setItem("hw.rate", String(rate));
  }, [rate]);

  useEffect(() => {
    localStorage.setItem("hw.bank", JSON.stringify(bank.slice(0, 200)));
  }, [bank]);

  useEffect(() => {
    localStorage.setItem("hw.voiceURI", voiceURI);
  }, [voiceURI]);

  useEffect(() => {
    localStorage.setItem("hw.voiceStyle", voiceStyle);
  }, [voiceStyle]);

  useEffect(() => {
    const load = () => {
      try {
        const vs = speechSynthesis.getVoices();
        setVoices([...vs]);
      } catch {
        setVoices([]);
      }
    };

    load();
    speechSynthesis.onvoiceschanged = load;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readingRef = useRef<HTMLDivElement | null>(null);

  const selectTerm = (t: ReaderVocab) => {
    setSelected(t);
    setBank((prev) => {
      const exists = prev.some((x) => x.zh === t.zh);
      if (exists) return prev;
      return [{ ...t, addedAt: Date.now() }, ...prev].slice(0, 200);
    });
  };

  const addToMyList = async (t: ReaderVocab) => {
    const zh = normalizeZh(t.zh);
    const vi = (t.vi || "").trim();
    if (!zh || !vi) {
      toast.error("Thiếu chữ Hán hoặc nghĩa để lưu vào Sổ từ vựng.");
      return;
    }

    try {
      const res = await api.post("/vocab/create", {
        zh,
        pinyin: (t.pinyin || "").trim(),
        vi,
        level: story?.level || 1,
        addToMyList: true,
      });
      if (res.data?.ok === false) {
        toast.error(res.data?.message || "Không lưu được từ");
        return;
      }
      const created = !!res.data?.created;
      toast.success(created ? "Đã lưu từ mới vào My List" : "Từ đã tồn tại, đã thêm vào My List");
    } catch (e) {
      console.error(e);
      toast.error("Lưu từ thất bại");
    }
  };

  const startGame = () => {
    setGameOpen(true);
    setQIndex(0);
    setScore(0);
    setAnswered(null);
    setQ(null);
  };

  const sourcePool: ReaderVocab[] = useMemo(() => {
    const b = bank.map(({ addedAt, ...rest }) => rest);
    if (b.length >= 6) return b;
    // Nếu bank ít, dùng vocab bài đọc để chơi
    return vocab;
  }, [bank, vocab]);

  const nextQuestion = () => {
    const pool = sourcePool.filter((x) => x.zh && x.vi);
    if (pool.length < 4) {
      toast.error("Chưa đủ từ để chơi. Hãy click vài từ trong bài đọc trước.");
      setGameOpen(false);
      return;
    }

    const correct = pool[randInt(pool.length)];
    const distractors = pickUnique(pool.filter((x) => x.zh !== correct.zh), 3);
    const opts = pickUnique([correct, ...distractors], 4).map((x) => x.vi);

    setQ({
      promptZh: correct.zh,
      promptPinyin: correct.pinyin || "",
      correctVi: correct.vi,
      options: opts,
    });
    setAnswered(null);
    setFreeText("");
    setFreeFb(null);
  };

  useEffect(() => {
    if (!gameOpen) return;
    nextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOpen]);

  useEffect(() => {
    if (!gameOpen) return;
    if (qIndex === 0) return;
    nextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  const onAnswer = (opt: string) => {
    if (!q || answered) return;

    const isCorrect = opt === q.correctVi;
    const nextScore = score + (isCorrect ? 1 : 0);

    setAnswered(opt);
    setScore(nextScore);

    window.setTimeout(() => {
      if (qIndex >= 9) {
        toast.success(`Xong! Điểm: ${nextScore}/10`);
        setGameOpen(false);
        return;
      }
      setQIndex((i) => i + 1);
    }, 520);
  };

  const gradeFreeText = () => {
    if (!q) return;

    const raw = (freeText || "").trim();
    if (!raw) {
      setFreeFb({ kind: "warn", text: "La nè: chưa viết gì mà đòi chấm. Viết một câu tiếng Trung hoặc pinyin trước nhé." });
      return;
    }

    const words = raw.split(/\s+/).filter(Boolean);
    const minWords = 5;

    const isChinese = hasCJK(raw);
    const targetZh = q.promptZh;
    const targetPyNorm = normalizePinyin(q.promptPinyin);
    const answerPyNorm = normalizePinyin(raw);

    // Gate 1: language + must contain target
    if (isChinese) {
      if (!raw.includes(targetZh)) {
        setFreeFb({
          kind: "warn",
          text: `La nè: viết tiếng Trung thì phải có từ mục tiêu “${targetZh}” trong câu.`,
        });
        return;
      }
    } else {
      if (!targetPyNorm) {
        setFreeFb({
          kind: "warn",
          text: `La nè: từ này chưa có pinyin để chấm. Hãy viết bằng tiếng Trung có chữ “${targetZh}”.`,
        });
        return;
      }
      if (!answerPyNorm.includes(targetPyNorm)) {
        setFreeFb({
          kind: "warn",
          text: `La nè: viết pinyin thì phải có pinyin của từ mục tiêu. Gợi ý: ${q.promptPinyin || "(không có)"} .`,
        });
        return;
      }
    }

    // Gate 2: length
    if (words.length < minWords) {
      setFreeFb({
        kind: "warn",
        text: `La nè: con gà này mới có ${words.length} từ. Viết dài hơn chút (tối thiểu ${minWords} từ) cho đã nhé!`,
      });
      return;
    }

    setFreeFb({
      kind: "good",
      text: `Đỉnh! ${words.length} từ. Câu dài thế này mới “đã” — nhớ từ rất nhanh.`,
    });
  };

  if (!story) {
    return (
      <div className="hw-page">
        <div className="hw-card">
          <b>Chưa có bài đọc.</b>
        </div>
      </div>
    );
  }

  const allZh = story.sentences.map((x) => x.zh).join(" ");
  const allZhChunks = splitSentencesZh(allZh);

  return (
    <div className="hw-page">
      <div className="hw-top">
        <div className="hw-title">
          <div className="hw-h1">Đọc & Chơi (Hanzi World)</div>
          <div className="hw-sub">Đọc như sách, click tra từ, nghe nhiều giọng, rồi chơi mini-game để nhớ chữ.</div>
        </div>

        <div className="hw-controls">
          <label className="hw-field">
            <span>Bài</span>
            <select
              value={storyId}
              onChange={(e) => {
                setStoryId(e.target.value);
                setSelected(null);
              }}
            >
              {READER_STORIES.map((s) => (
                <option key={s.id} value={s.id}>
                  LV{s.level} · {s.title}
                </option>
              ))}
            </select>
          </label>

          <label className="hw-field">
            <span>Giọng</span>
            <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
              <option value="">Mặc định</option>
              {zhVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>

          <label className="hw-field">
            <span>Biểu cảm</span>
            <select value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value as VoiceStyle)}>
              {Object.entries(STYLE_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </label>

          <label className="hw-toggle">
            <input type="checkbox" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
            <span>Pinyin</span>
          </label>

          <label className="hw-toggle">
            <input type="checkbox" checked={showVi} onChange={(e) => setShowVi(e.target.checked)} />
            <span>Nghĩa</span>
          </label>

          <label className="hw-field">
            <span>Tốc độ</span>
            <input
              type="range"
              min={0.75}
              max={1.25}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>

          {isSpeaking ? (
            <button className="hw-btn hw-btn--ghost" type="button" onClick={stopSpeaking}>
              ⏹ Dừng
            </button>
          ) : null}

          <button className="hw-btn hw-btn--primary" type="button" onClick={startGame}>
            🎮 Chơi 1 phút
          </button>
        </div>
      </div>

      <div className="hw-grid">
        <div className="hw-reading" ref={readingRef}>
          <div className="hw-reading-head">
            <div>
              <div className="hw-reading-title">{story.title}</div>
              <div className="hw-reading-desc">{story.description}</div>
            </div>

            <div className="hw-reading-actions">
              <button className="hw-btn hw-btn--ghost" type="button" onClick={() => speakQueue(allZhChunks)}>
                🔊 Đọc cả bài
              </button>
            </div>
          </div>

          <div className="hw-reading-body" role="article" aria-label="Reader">
            {story.sentences.map((sent, idx) => {
              const segments = buildSegments(sent.zh, vocab);
              return (
                <div key={idx} className="hw-sentence">
                  {showPinyin && sent.pinyin ? <div className="hw-py">{sent.pinyin}</div> : null}

                  <div className="hw-row">
                    <div className="hw-zh">
                      {segments.map((seg, i) => {
                        if (seg.kind === "term") {
                          return (
                            <button
                              key={i}
                              type="button"
                              className="hw-term"
                              onClick={() => selectTerm(seg.term)}
                              title={`${seg.term.pinyin} · ${seg.term.vi}`}
                            >
                              {seg.text}
                            </button>
                          );
                        }
                        return (
                          <span key={i} className="hw-text">
                            {seg.text}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      className="hw-speak"
                      type="button"
                      onClick={() => speakOnce(sent.zh)}
                      title="Nghe câu này"
                      aria-label="Nghe câu này"
                    >
                      🔊
                    </button>
                  </div>

                  {showVi && sent.vi ? <div className="hw-vi">{sent.vi}</div> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hw-side">
          <div className="hw-card">
            <div className="hw-card-title">Tra nhanh</div>
            {selected ? (
              <div className="hw-lookup">
                <div className="hw-lookup-zh">{selected.zh}</div>
                <div className="hw-lookup-py">{selected.pinyin}</div>
                <div className="hw-lookup-vi">{selected.vi}</div>

                <div className="hw-actions">
                  <button className="hw-btn" type="button" onClick={() => speakOnce(selected.zh)}>
                    🔊 Nghe
                  </button>
                  <button className="hw-btn hw-btn--primary" type="button" onClick={() => addToMyList(selected)}>
                    ➕ Thêm My List
                  </button>
                  <button
                    className="hw-btn hw-btn--ghost"
                    type="button"
                    onClick={() => {
                      setBank((prev) => prev.filter((x) => x.zh !== selected.zh));
                      setSelected(null);
                    }}
                  >
                    🧹 Bỏ khỏi bank
                  </button>
                </div>
              </div>
            ) : (
              <div className="hw-muted">
                Click vào chữ được highlight để tra. Mini-game chỉ chấm khi bạn viết <b>tiếng Trung hoặc pinyin</b>.
              </div>
            )}
          </div>

          <div className="hw-card">
            <div className="hw-card-title">Word Bank</div>
            {bank.length ? (
              <div className="hw-bank">
                <div className="hw-chip-wrap">
                  {bank.slice(0, 60).map((it) => (
                    <button
                      key={it.zh}
                      type="button"
                      className={selected?.zh === it.zh ? "hw-chip is-active" : "hw-chip"}
                      onClick={() => setSelected({ zh: it.zh, pinyin: it.pinyin, vi: it.vi })}
                      title={`${it.pinyin} · ${it.vi}`}
                    >
                      {it.zh}
                    </button>
                  ))}
                </div>

                <div className="hw-bank-actions">
                  <button className="hw-btn hw-btn--ghost" type="button" onClick={() => setBank([])}>
                    Xóa bank
                  </button>
                  <button className="hw-btn hw-btn--primary" type="button" onClick={startGame}>
                    🎮 Chơi với bank
                  </button>
                </div>
              </div>
            ) : (
              <div className="hw-muted">Bank đang trống. Hãy click vài từ trong bài đọc.</div>
            )}
          </div>

          <div className="hw-card">
            <div className="hw-card-title">Từ khóa của bài</div>
            <div className="hw-vocab-grid">
              {vocab.slice(0, 24).map((t) => (
                <button
                  key={t.zh}
                  type="button"
                  className="hw-vocab"
                  onClick={() => selectTerm(t)}
                  title={`${t.pinyin} · ${t.vi}`}
                >
                  <div className="hw-vocab-zh">{t.zh}</div>
                  <div className="hw-vocab-vi">{t.vi}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {gameOpen ? (
        <div className="hw-modal" role="dialog" aria-modal="true" aria-label="Mini game">
          <div className="hw-modal-card">
            <div className="hw-modal-head">
              <div>
                <div className="hw-modal-title">Mini-game: Chọn nghĩa đúng</div>
                <div className="hw-modal-sub">
                  Câu {qIndex + 1}/10 · Điểm: {score}
                </div>
              </div>
              <button className="hw-btn hw-btn--ghost" type="button" onClick={() => setGameOpen(false)}>
                ✕
              </button>
            </div>

            {q ? (
              <div className="hw-q">
                <button
                  type="button"
                  className="hw-q-zh"
                  onClick={() => speakOnce(q.promptZh)}
                  title="Bấm để nghe"
                  aria-label="Bấm để nghe"
                >
                  {q.promptZh}
                </button>
                {q.promptPinyin ? <div className="hw-q-py">{q.promptPinyin}</div> : null}

                <div className="hw-q-opts">
                  {q.options.map((opt) => {
                    const isCorrect = opt === q.correctVi;
                    const isChosen = answered === opt;
                    const cls = answered
                      ? isCorrect
                        ? "hw-opt is-correct"
                        : isChosen
                          ? "hw-opt is-wrong"
                          : "hw-opt"
                      : "hw-opt";
                    return (
                      <button key={opt} type="button" className={cls} onClick={() => onAnswer(opt)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="hw-say">
                  <div className="hw-say-title">Viết 1 câu dùng từ này (tối thiểu 5 từ)</div>
                  <div className="hw-say-hint">
                    Chỉ chấm nếu bạn viết <b>tiếng Trung có chữ</b> hoặc <b>pinyin</b>, và câu phải chứa từ mục tiêu.
                  </div>

                  <textarea
                    value={freeText}
                    onChange={(e) => {
                      setFreeText(e.target.value);
                      setFreeFb(null);
                    }}
                    placeholder="Ví dụ (ZH): 我今天在学校找手机。  |  Ví dụ (PY): wo jin tian zai xue xiao zhao shou ji"
                    rows={3}
                  />

                  <div className="hw-say-actions">
                    <button className="hw-btn hw-btn--primary" type="button" onClick={gradeFreeText}>
                      Chấm câu
                    </button>
                    <button
                      className="hw-btn hw-btn--ghost"
                      type="button"
                      onClick={() => {
                        setFreeText("");
                        setFreeFb(null);
                      }}
                    >
                      Xóa
                    </button>
                    <button
                      className="hw-btn hw-btn--ghost"
                      type="button"
                      onClick={() => speakOnce(freeText)}
                      disabled={!freeText.trim()}
                      title="Dùng giọng TTS để nghe lại"
                    >
                      🔊 Nghe câu của bạn
                    </button>
                  </div>

                  {freeFb ? (
                    <div className={freeFb.kind === "good" ? "hw-feedback good" : "hw-feedback warn"}>{freeFb.text}</div>
                  ) : (
                    <div className="hw-muted">Mẹo: câu càng dài (≥ 5 từ) thì càng nhớ từ nhanh.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hw-muted">Đang tải câu hỏi…</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
