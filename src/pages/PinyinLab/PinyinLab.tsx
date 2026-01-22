import { useEffect, useMemo, useRef, useState } from "react";
import "./PinyinLab.css";
import toast from "../../lib/toast";
import {
  PINYIN_FINALS,
  PINYIN_INITIALS,
  PINYIN_PAIRS,
  PINYIN_TONES,
} from "../../data/pinyinLab";
import type { PinyinExample, PinyinPair, PinyinSound } from "../../data/pinyinLab";

type TabKey = "initials" | "finals" | "tones" | "pairs" | "drill";

type SpokenResult = {
  text: string;
  ok: boolean | null;
  reason?: string;
};

function pickFirstZhVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // Ưu tiên voice tiếng Trung để TTS đọc chữ Hán ổn định hơn
  const zh = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("zh"));
  if (zh.length) return zh[0];
  // fallback: bất kỳ voice có chữ "Chinese"
  const byName = voices.find((v) => /chinese|mandarin|canton/i.test(v.name || ""));
  return byName;
}

function safeSpeak(opts: {
  text: string;
  rate: number;
  voice?: SpeechSynthesisVoice;
}) {
  const { text, rate, voice } = opts;
  if (!("speechSynthesis" in window)) {
    toast.error("Trình duyệt không hỗ trợ đọc (TTS).");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (voice?.lang || "zh-CN");
    u.rate = Math.max(0.5, Math.min(1.5, rate));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  } catch {
    toast.error("Không thể phát âm trên trình duyệt này.");
  }
}

function toneMarksToNumber(input: string) {
  // Chuyển pinyin có dấu (mà, shì, nǚ) -> dạng số (ma4, shi4, nü3)
  // Hỗ trợ nhập tay trong bài luyện.
  const map: Record<string, { base: string; tone: number }> = {
    "ā": { base: "a", tone: 1 }, "á": { base: "a", tone: 2 }, "ǎ": { base: "a", tone: 3 }, "à": { base: "a", tone: 4 },
    "ē": { base: "e", tone: 1 }, "é": { base: "e", tone: 2 }, "ě": { base: "e", tone: 3 }, "è": { base: "e", tone: 4 },
    "ī": { base: "i", tone: 1 }, "í": { base: "i", tone: 2 }, "ǐ": { base: "i", tone: 3 }, "ì": { base: "i", tone: 4 },
    "ō": { base: "o", tone: 1 }, "ó": { base: "o", tone: 2 }, "ǒ": { base: "o", tone: 3 }, "ò": { base: "o", tone: 4 },
    "ū": { base: "u", tone: 1 }, "ú": { base: "u", tone: 2 }, "ǔ": { base: "u", tone: 3 }, "ù": { base: "u", tone: 4 },
    "ǖ": { base: "ü", tone: 1 }, "ǘ": { base: "ü", tone: 2 }, "ǚ": { base: "ü", tone: 3 }, "ǜ": { base: "ü", tone: 4 },
  };

  let tone = 0;
  let out = "";
  for (const ch of input) {
    const hit = map[ch];
    if (hit) {
      out += hit.base;
      tone = hit.tone;
    } else {
      out += ch;
    }
  }

  out = out.replace(/u:/g, "ü"); // một số người gõ u:
  // Nếu người dùng đã nhập số tone rồi, giữ số đó
  const hasDigit = /[0-5]\b/.test(out.trim());
  if (!hasDigit && tone > 0) return out.trim() + String(tone);
  return out.trim();
}

function normalizeRoman(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/v/g, "ü"); // nhiều người gõ v thay ü
}

function stripToneDigit(p: string) {
  return p.replace(/[0-5]$/g, "");
}

function isProbablyChinese(text: string) {
  // có chứa chữ Hán
  return /[\u3400-\u9FFF]/.test(text);
}

function buildExpectedRoman(ex: PinyinExample) {
  // ex.pinyinNumber: "shi4" -> "shi"
  return normalizeRoman(stripToneDigit(ex.pinyinNumber));
}

function getSpeechRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

function useSpeechOnce() {
  const recRef = useRef<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    setIsAvailable(!!Ctor);
  }, []);

  function start(opts: {
    lang?: string;
    onResult: (text: string) => void;
    onPartial?: (text: string) => void;
    onError?: (msg: string) => void;
    onEnd?: () => void;
    interimResults?: boolean;
    autoStop?: boolean;
    silenceMs?: number;
    maxMs?: number;
    minListenMs?: number;
    graceMs?: number;
  }) {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      opts.onError?.("Trình duyệt không hỗ trợ nhận giọng nói.");
      return;
    }

    // stop any previous session
    try {
      recRef.current?.stop?.();
      recRef.current?.abort?.();
    } catch {
      // ignore
    }

        const autoStop = opts.autoStop !== false;
    const silenceMs = Math.max(500, opts.silenceMs ?? 1400);
    const maxMs = Math.max(2500, opts.maxMs ?? 7000);
    const minListenMs = Math.max(600, opts.minListenMs ?? 1200);
    const graceMs = Math.max(0, opts.graceMs ?? 650);

    try {
      const rec = new Ctor();
      recRef.current = rec;
      rec.continuous = false;
      rec.interimResults = opts.interimResults !== false; // default true
      rec.maxAlternatives = 5;
      rec.lang = opts.lang || "zh-CN";

            let lastText = "";
      let resolved = false;
      let hadError = false;
      const startedAt = Date.now();
      let silenceArmed = graceMs <= 0;
      let graceTimer: any = null;
      let silenceTimer: any = null;
      let maxTimer: any = null;

      const clearTimers = () => {
        try {
          if (silenceTimer) clearTimeout(silenceTimer);
          if (graceTimer) clearTimeout(graceTimer);
          if (maxTimer) clearTimeout(maxTimer);
        } catch {
          // ignore
        }
      };

            const armSilenceStop = () => {
        if (!autoStop) return;
        if (!silenceArmed) return;
        try {
          if (silenceTimer) clearTimeout(silenceTimer);
          const elapsed = Date.now() - startedAt;
          const minRemaining = Math.max(0, minListenMs - elapsed);
          const wait = Math.max(silenceMs, minRemaining);
          silenceTimer = setTimeout(() => {
            try {
              rec.stop();
            } catch {
              // ignore
            }
          }, wait);
        } catch {
          // ignore
        }
      };

      maxTimer = setTimeout(() => {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }, maxMs);

      rec.onresult = (e: any) => {
        try {
          // concat incremental results
          let t = "";
          const results = e?.results;
          if (results && results.length) {
            for (let i = 0; i < results.length; i++) {
              const seg = results[i]?.[0]?.transcript ?? "";
              t += String(seg);
            }
          } else {
            t = String(e?.results?.[0]?.[0]?.transcript ?? "");
          }

          const text = String(t || "").trim();
          if (text) {
            lastText = text;
            opts.onPartial?.(text);
            armSilenceStop();
          }
        } catch {
          // ignore partial errors
        }
      };

      rec.onerror = (e: any) => {
        let code = String(e?.error || "");
        hadError = true;
        if (code === "not-allowed" || code === "service-not-allowed") {
          opts.onError?.("Bạn cần cho phép quyền micro (microphone).");
          return;
        }
                if (code === "no-speech") {
          const elapsed = Date.now() - startedAt;
          // Nếu kết thúc quá sớm (bấm nhầm / chưa kịp nói), đừng báo lỗi gây khó chịu
          if (elapsed < minListenMs) return;
          opts.onError?.("Không nghe thấy giọng nói. Hãy thử nói rõ hơn.");
          return;
        }
        if (code === "network") {
          opts.onError?.("Lỗi mạng khi nhận giọng nói. Thử lại giúp bạn.");
          return;
        }
        opts.onError?.("Lỗi thu âm: " + (code || "unknown"));
      };

      rec.onend = () => {
        clearTimers();
        try {
          if (resolved) {
            opts.onEnd?.();
            return;
          }
          resolved = true;
          if (lastText) {
            opts.onResult(lastText);
          } else if (!hadError) {
            const elapsed = Date.now() - startedAt;
            if (elapsed >= minListenMs) {
              opts.onError?.("Không nhận được nội dung. Hãy thử nói rõ hơn.");
            }
          }
        } finally {
          opts.onEnd?.();
        }
      };

      rec.start();
      if (graceMs > 0) {
        graceTimer = setTimeout(() => {
          silenceArmed = true;
          armSilenceStop();
        }, graceMs);
      } else {
        silenceArmed = true;
        armSilenceStop();
      }
    } catch {
      opts.onError?.("Không thể khởi tạo nhận giọng nói.");
      opts.onEnd?.();
    }
  }

  function stop() {
    try {
      recRef.current?.stop?.();
      recRef.current?.abort?.();
    } catch {
      // ignore
    }
  }

  return { isAvailable, start, stop };
}

function SectionTitle(props: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="pl-section-title">
      <div className="pl-section-title-main">
        {props.icon ? <span className="pl-ico">{props.icon}</span> : null}
        <h2>{props.title}</h2>
      </div>
      {props.sub ? <div className="pl-muted">{props.sub}</div> : null}
    </div>
  );
}

function ExampleRow(props: {
  ex: PinyinExample;
  rate: number;
  voice?: SpeechSynthesisVoice;
  speechAvailable: boolean;
  onSpeak: () => void;
  onRecord: () => void;
  spoken?: SpokenResult;
  isRecording: boolean;
}) {
  const { ex, onSpeak, onRecord, spoken, isRecording, speechAvailable } = props;

  return (
    <div className="pl-ex-row">
      <div className="pl-ex-left">
        <div className="pl-ex-hanzi">{ex.hanzi}</div>
        <div className="pl-ex-meta">
          <div className="pl-ex-pinyin">{ex.pinyin}</div>
          <div className="pl-ex-vi">{ex.vi}</div>
        </div>
      </div>
      <div className="pl-ex-actions">
        <button className="pl-btn" onClick={onSpeak} title="Nghe (đọc chữ Hán)">
          🔊
        </button>
        <button
          className="pl-btn"
          onClick={onRecord}
          disabled={!speechAvailable}
          title={!speechAvailable ? "Trình duyệt không hỗ trợ nhận giọng nói" : "Nói để chấm"}
        >
          {isRecording ? "⏹️" : "🎙️"}
        </button>
      </div>

      {spoken ? (
        <div className={"pl-spoken " + (spoken.ok === null ? "pending" : spoken.ok ? "ok" : "bad")}>
          <div>
            <b>Bạn nói:</b> {spoken.text}
          </div>
          <div className="pl-muted">{spoken.ok ? "✅ Khớp ví dụ" : `❌ Chưa khớp (${spoken.reason || "thử lại"})`}</div>
        </div>
      ) : null}
    </div>
  );
}

function SoundCard(props: {
  sound: PinyinSound;
  rate: number;
  setRate: (v: number) => void;
  voice?: SpeechSynthesisVoice;
  speechAvailable: boolean;
  onRecordExample: (idx: number) => void;
  spokenByIndex: Record<number, SpokenResult | undefined>;
  recordingIndex: number | null;
  micMode: "fast" | "normal" | "slow";
  setMicMode: (v: "fast" | "normal" | "slow") => void;
  micAutoStop: boolean;
  setMicAutoStop: (v: boolean) => void;
}) {
  const { sound } = props;

  return (
    <div className="pl-card">
      <div className="pl-card-head">
        <div className="pl-card-head-left">
          <div className="pl-card-title">{sound.label}</div>
          <div className="pl-muted pl-card-key">{sound.key}</div>

          {sound.examples?.[0] ? (
            <div className="pl-play-sound">
              <button
                className="pl-btn pl-btn-primary"
                onClick={() => safeSpeak({ text: sound.examples[0].hanzi, rate: props.rate, voice: props.voice })}
                title="Phát âm âm đang học (ưu tiên đọc chữ Hán của ví dụ)"
              >
                🔊 Nghe âm “{sound.key}”
              </button>
              <div className="pl-muted">
                Nghe qua ví dụ: <b>{sound.examples[0].hanzi}</b> ({sound.examples[0].pinyin})
              </div>
            </div>
          ) : null}
        </div>

        <div className="pl-card-rate">
          <div className="pl-rate-top">
            <span className="pl-ico">🔊</span>
            <b>Tốc độ nghe</b>
            <span className="pl-rate-val">{props.rate.toFixed(2)}x</span>
          </div>
          <div className="pl-rate-controls">
            <button className="pl-chip" onClick={() => props.setRate(0.75)}>
              Chậm
            </button>
            <button className="pl-chip" onClick={() => props.setRate(1.0)}>
              Chuẩn
            </button>
            <button className="pl-chip" onClick={() => props.setRate(1.25)}>
              Nhanh
            </button>
          </div>
          <input
            className="pl-rate-slider"
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={props.rate}
            onChange={(e) => props.setRate(Number(e.target.value))}
          />
          <div className="pl-mic">
            <div className="pl-rate-top">
              <span className="pl-ico">🎙️</span>
              <b>Tốc độ mic</b>
              <span className="pl-rate-val">
                {props.micMode === "fast" ? "Nhanh" : props.micMode === "normal" ? "Chuẩn" : "Chậm"}
              </span>
            </div>
            <div className="pl-rate-controls">
              <button className={"pl-chip " + (props.micMode === "fast" ? "active" : "")} onClick={() => props.setMicMode("fast")}>
                Nhanh
              </button>
              <button className={"pl-chip " + (props.micMode === "normal" ? "active" : "")} onClick={() => props.setMicMode("normal")}>
                Chuẩn
              </button>
              <button className={"pl-chip " + (props.micMode === "slow" ? "active" : "")} onClick={() => props.setMicMode("slow")}>
                Chậm
              </button>
            </div>
            <label className="pl-check">
              <input type="checkbox" checked={props.micAutoStop} onChange={(e) => props.setMicAutoStop(e.target.checked)} />
              <span>Tự dừng khi im lặng</span>
            </label>
            <div className="pl-muted pl-mic-hint">
              {props.micMode === "fast"
                ? "Nhanh: dừng sau ~1.2s im lặng (hợp drill ngắn)."
                : props.micMode === "normal"
                ? "Chuẩn: dừng sau ~2.6s im lặng (cân bằng)."
                : "Chậm: dừng sau ~2.6s im lặng (hợp câu dài)."}
            </div>
          </div>

        </div>
      </div>

      <div className="pl-card-grid">
        <div className="pl-kpi">
          <div className="pl-kpi-title">👄 Môi</div>
          <div className="pl-kpi-val">{sound.mouth}</div>
        </div>
        <div className="pl-kpi">
          <div className="pl-kpi-title">👅 Lưỡi</div>
          <div className="pl-kpi-val">{sound.tongue}</div>
        </div>
        <div className="pl-kpi">
          <div className="pl-kpi-title">💨 Luồng hơi</div>
          <div className="pl-kpi-val">{sound.airflow}</div>
        </div>
      </div>

      <div className="pl-card-body">
        <div className="pl-subsection">
          <div className="pl-subtitle">✅ Cách phát âm</div>
          <ul>
            {sound.how.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>

        <div className="pl-subsection">
          <div className="pl-subtitle">⚠️ Lỗi hay gặp</div>
          <ul>
            {sound.mistakes.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>

        {sound.tips?.length ? (
          <div className="pl-subsection">
            <div className="pl-subtitle">💡 Mẹo nhanh</div>
            <ul>
              {sound.tips.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="pl-subsection">
          <div className="pl-subtitle">🎯 Ví dụ (bấm 🔊 để nghe, 🎙️ để kiểm tra)</div>
          <div className="pl-ex-list">
            {sound.examples.map((ex, idx) => (
              <ExampleRow
                key={idx}
                ex={ex}
                rate={props.rate}
                voice={props.voice}
                speechAvailable={props.speechAvailable}
                onSpeak={() => safeSpeak({ text: ex.hanzi, rate: props.rate, voice: props.voice })}
                onRecord={() => props.onRecordExample(idx)}
                spoken={props.spokenByIndex[idx]}
                isRecording={props.recordingIndex === idx}
              />
            ))}
          </div>
          <div className="pl-muted pl-note">
            Gợi ý: khi bấm 🎙️, hãy đọc đúng <b>chữ Hán</b> ở ví dụ (máy nhận giọng sẽ ổn định hơn đọc pinyin).
          </div>
        </div>
      </div>
    </div>
  );
}

function parsePinyinNumber(p: string) {
  const raw = toneMarksToNumber(p);
  const s = normalizeRoman(raw).replace(/\s+/g, "");
  const toneMatch = s.match(/[0-5]$/);
  const tone = toneMatch ? Number(toneMatch[0]) : 0;
  const base = stripToneDigit(s);

  // danh sách âm đầu dài trước
  const initials = [
    "zh",
    "ch",
    "sh",
    "b",
    "p",
    "m",
    "f",
    "d",
    "t",
    "n",
    "l",
    "g",
    "k",
    "h",
    "j",
    "q",
    "x",
    "r",
    "z",
    "c",
    "s",
    "y",
    "w",
  ];
  const found = initials.find((i) => base.startsWith(i));
  const initial = found || "";
  const final = base.slice(initial.length);
  return { initial, final, tone, base };
}

function scoreThreeParts(expected: string, got: string) {
  const e = parsePinyinNumber(expected);
  const g = parsePinyinNumber(got);
  const okInitial = e.initial === g.initial;
  const okFinal = e.final === g.final;
  const okTone = e.tone === g.tone && e.tone !== 0; // tone 0 không tính bắt buộc
  const total = 3;
  const correct = (okInitial ? 1 : 0) + (okFinal ? 1 : 0) + (okTone ? 1 : 0);
  const pct = Math.round((correct / total) * 100);
  return { pct, correct, total, okInitial, okFinal, okTone, expected: e, got: g };
}

export default function PinyinLab() {
  const [tab, setTab] = useState<TabKey>("initials");
  const [query, setQuery] = useState("");

  // Lock outer scroll for this page (scroll happens inside panels)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);


  // TTS speed
  const RATE_KEY = "pinyin_lab_rate";
  const DEFAULT_RATE = 1.0;
  const [rate, setRate] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem(RATE_KEY));
      if (Number.isFinite(v) && v >= 0.5 && v <= 1.5) return v;
    } catch {
      // ignore
    }
    return DEFAULT_RATE;
  });
  useEffect(() => {
    try {
      localStorage.setItem(RATE_KEY, String(rate));
    } catch {
      // ignore
    }
  }, [rate]);
  // Mic speed (SpeechRecognition) - giúp bắt nhanh, ít chờ lâu
  const MIC_MODE_KEY = "pinyin_lab_mic_mode";
  const MIC_AUTOSTOP_KEY = "pinyin_lab_mic_autostop";
  type MicMode = "fast" | "normal" | "slow";

  const [micMode, setMicMode] = useState<MicMode>(() => {
    try {
      const v = String(localStorage.getItem(MIC_MODE_KEY) || "");
      if (v === "fast" || v === "normal" || v === "slow") return v as MicMode;
    } catch {
      // ignore
    }
    return "normal";
  });

  const [micAutoStop, setMicAutoStop] = useState<boolean>(() => {
    try {
      const raw = String(localStorage.getItem(MIC_AUTOSTOP_KEY) || "");
      if (raw === "0") return false;
      if (raw === "1") return true;
      if (raw.toLowerCase() === "false") return false;
      if (raw.toLowerCase() === "true") return true;
    } catch {
      // ignore
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem(MIC_MODE_KEY, micMode);
    } catch {
      // ignore
    }
  }, [micMode]);

  useEffect(() => {
    try {
      localStorage.setItem(MIC_AUTOSTOP_KEY, micAutoStop ? "1" : "0");
    } catch {
      // ignore
    }
  }, [micAutoStop]);

  const micCfg = useMemo(() => {
    const base =
      micMode === "fast"
        ? { silenceMs: 1200, maxMs: 5500, minListenMs: 1400, graceMs: 700, label: "Nhanh" }
        : micMode === "normal"
        ? { silenceMs: 1800, maxMs: 8000, minListenMs: 1700, graceMs: 900, label: "Chuẩn" }
        : { silenceMs: 2600, maxMs: 11000, minListenMs: 2000, graceMs: 1100, label: "Chậm" };
    return { ...base, autoStop: micAutoStop };
  }, [micMode, micAutoStop]);


  // Voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string>("");
  const voice = useMemo(() => voices.find((v) => v.name === voiceName) || pickFirstZhVoice(voices), [voices, voiceName]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      try {
        const vs = window.speechSynthesis.getVoices();
        setVoices(vs);
        if (!voiceName) {
          const picked = pickFirstZhVoice(vs);
          if (picked) setVoiceName(picked.name);
        }
      } catch {
        // ignore
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speech recognition (one-shot)
  const speech = useSpeechOnce();
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [spokenMap, setSpokenMap] = useState<Record<string, SpokenResult>>({});

  const [selectedSound, setSelectedSound] = useState<PinyinSound>(() => PINYIN_INITIALS[0]);
  const soundsForTab = useMemo(() => {
    if (tab === "initials") return PINYIN_INITIALS;
    if (tab === "finals") return PINYIN_FINALS;
    if (tab === "tones") return PINYIN_TONES;
    return [];
  }, [tab]);

  useEffect(() => {
    if (tab === "initials") setSelectedSound(PINYIN_INITIALS[0]);
    if (tab === "finals") setSelectedSound(PINYIN_FINALS[0]);
    if (tab === "tones") setSelectedSound(PINYIN_TONES[0]);
  }, [tab]);

  const filteredSounds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return soundsForTab;
    return soundsForTab.filter((s) => (s.key + " " + s.label).toLowerCase().includes(q));
  }, [query, soundsForTab]);

  function startRecordForExample(ex: PinyinExample, key: string) {
    // toggle: đang nghe thì bấm lại để dừng
    if (recordingKey === key) {
      speech.stop();
      return;
    }

    if (!speech.isAvailable) {
      toast.error("Trình duyệt không hỗ trợ nhận giọng nói.");
      return;
    }

    setRecordingKey(key);
    setSpokenMap((prev) => ({
      ...prev,
      [key]: { text: "", ok: null, reason: "Đang nghe..." },
    }));

    speech.start({
      lang: "zh-CN",
      interimResults: true,
      autoStop: micCfg.autoStop,
      silenceMs: micCfg.silenceMs,
      maxMs: micCfg.maxMs,
      minListenMs: micCfg.minListenMs,
      graceMs: micCfg.graceMs,
      onPartial: (text) => {
        const t = String(text || "").trim();
        if (!t) return;
        setSpokenMap((prev) => ({
          ...prev,
          [key]: { text: t, ok: null, reason: "Đang nghe..." },
        }));
      },
      onResult: (text) => {
        const t = String(text || "").trim();
        const ok = isProbablyChinese(t) ? t.includes(ex.hanzi) : normalizeRoman(t).includes(buildExpectedRoman(ex));
        const reason = ok
          ? "OK"
          : isProbablyChinese(t)
          ? "Hãy đọc đúng chữ Hán của ví dụ"
          : "Hãy thử đọc rõ hơn / thử đọc chữ Hán";
        setSpokenMap((prev) => ({ ...prev, [key]: { text: t, ok, reason } }));
      },
      onError: (msg) => {
        const m = String(msg || "").trim();
        // Với lỗi "no-speech"/kết thúc quá sớm, ưu tiên hiển thị inline thay vì toast.
        setSpokenMap((prev) => ({
          ...prev,
          [key]: { text: prev[key]?.text || "(không nhận)", ok: false, reason: m || "Không nhận được giọng nói" },
        }));
        // Chỉ toast các lỗi quan trọng (quyền mic / không hỗ trợ / mạng)
        if (/quyền micro|microphone|không hỗ trợ|lỗi mạng|network/i.test(m)) {
          toast.error(m);
        }
      },
      onEnd: () => {
        setRecordingKey(null);
      },
    });
  }

  // ===== Pairs + Drill =====
  const [selectedPairId, setSelectedPairId] = useState<string>(PINYIN_PAIRS[0]?.id || "");
  const selectedPair = useMemo<PinyinPair | undefined>(
    () => PINYIN_PAIRS.find((p) => p.id === selectedPairId),
    [selectedPairId]
  );
  const [drillIdx, setDrillIdx] = useState(0);
  const currentDrill = selectedPair?.drills[drillIdx];
  const [pickedIdx, setPickedIdx] = useState(0);
  const picked = currentDrill?.options[pickedIdx];

  useEffect(() => {
    setDrillIdx(0);
    setPickedIdx(0);
  }, [selectedPairId]);

  const [typed, setTyped] = useState("");
  const [typedScore, setTypedScore] = useState<ReturnType<typeof scoreThreeParts> | null>(null);
  const [spokenDrill, setSpokenDrill] = useState<SpokenResult | null>(null);
  const [recordingDrill, setRecordingDrill] = useState(false);

  function checkTyped() {
    if (!picked) return;
    const raw = typed.trim();
    if (!raw) {
      toast.error("Nhập pinyin trước đã.");
      return;
    }
    const got = raw.match(/[0-5]$/) ? raw : raw; // nếu user không nhập tone, vẫn parse được (tone=0)
    const score = scoreThreeParts(picked.pinyinNumber, got);
    setTypedScore(score);
  }

  function recordDrill() {
    if (!picked) return;

    // toggle stop
    if (recordingDrill) {
      speech.stop();
      return;
    }

    if (!speech.isAvailable) {
      toast.error("Trình duyệt không hỗ trợ nhận giọng nói.");
      return;
    }

    setRecordingDrill(true);
    setSpokenDrill({ text: "", ok: null, reason: "Đang nghe..." });

    speech.start({
      lang: "zh-CN",
      interimResults: true,
      autoStop: micCfg.autoStop,
      silenceMs: micCfg.silenceMs,
      maxMs: micCfg.maxMs,
      onPartial: (text) => {
        const t = String(text || "").trim();
        if (!t) return;
        setSpokenDrill({ text: t, ok: null, reason: "Đang nghe..." });
      },
      onResult: (text) => {
        const t = String(text || "").trim();
        const ok = isProbablyChinese(t) ? t.includes(picked.hanzi) : normalizeRoman(t).includes(buildExpectedRoman(picked));
        setSpokenDrill({
          text: t,
          ok,
          reason: ok ? "OK" : "Máy nghe chưa khớp. Hãy thử đọc chữ Hán của đáp án.",
        });
      },
      onError: (msg) => toast.error(msg),
      onEnd: () => setRecordingDrill(false),
    });
  }

  return (
    <div className="pl-page">
      <div className="pl-header">
        <div className="pl-title">
          <div className="pl-badge">abc</div>
          <div>
            <h1>Pinyin Lab</h1>
            <div className="pl-muted">Trang cố định: âm đầu • vần • thanh điệu • cặp dễ nhầm • bài luyện</div>
          </div>
        </div>

        <div className="pl-voice">
          <div className="pl-muted">
            <b>Voice</b> (ưu tiên zh-CN để máy đọc chữ Hán chuẩn hơn)
          </div>
          <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="pl-select">
            <option value="">Tự chọn (auto)</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pl-tabs">
        <button className={"pl-tab " + (tab === "initials" ? "active" : "")} onClick={() => setTab("initials")}>
          Âm đầu
        </button>
        <button className={"pl-tab " + (tab === "finals" ? "active" : "")} onClick={() => setTab("finals")}>
          Vần
        </button>
        <button className={"pl-tab " + (tab === "tones" ? "active" : "")} onClick={() => setTab("tones")}>
          Thanh
        </button>
        <button className={"pl-tab " + (tab === "pairs" ? "active" : "")} onClick={() => setTab("pairs")}>
          Cặp dễ nhầm
        </button>
        <button className={"pl-tab " + (tab === "drill" ? "active" : "")} onClick={() => setTab("drill")}>
          Bài luyện
        </button>
      </div>

      {tab === "pairs" ? (
        <div className="pl-layout single">
          <div className="pl-card">
            <SectionTitle title="Cặp dễ nhầm (Minimal Pairs)" sub="Chọn cặp để xem hướng dẫn và ví dụ." />
            <div className="pl-pairs">
              {PINYIN_PAIRS.map((p) => (
                <button key={p.id} className={"pl-pair " + (p.id === selectedPairId ? "active" : "")} onClick={() => setSelectedPairId(p.id)}>
                  <div className="pl-pair-title">{p.title}</div>
                  <div className="pl-muted">{p.why}</div>
                </button>
              ))}
            </div>

            {selectedPair ? (
              <div className="pl-pair-detail">
                <div className="pl-subtitle">Vì sao dễ nhầm?</div>
                <div>{selectedPair.why}</div>
                <div className="pl-subtitle" style={{ marginTop: 12 }}>
                  Ví dụ nhanh
                </div>
                <div className="pl-ex-list">
                  {selectedPair.drills[0].options.map((o, idx) => (
                    <div className="pl-ex-row" key={idx}>
                      <div className="pl-ex-left">
                        <div className="pl-ex-hanzi">{o.hanzi}</div>
                        <div className="pl-ex-meta">
                          <div className="pl-ex-pinyin">{o.pinyin}</div>
                          <div className="pl-ex-vi">{o.vi}</div>
                        </div>
                      </div>
                      <div className="pl-ex-actions">
                        <button className="pl-btn" onClick={() => safeSpeak({ text: o.hanzi, rate, voice })} title="Nghe">
                          🔊
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : tab === "drill" ? (
        <div className="pl-layout single">
          <div className="pl-card">
            <SectionTitle
              title="Bài luyện (Nghe / Nói / Nhập pinyin)"
              sub="Chấm rõ 3 phần: âm đầu / vần / thanh. Khuyến nghị: đọc chữ Hán để máy nhận giọng ổn định."
            />

            <div className="pl-drill-top">
              <label className="pl-muted">Chọn cặp:</label>
              <select className="pl-select" value={selectedPairId} onChange={(e) => setSelectedPairId(e.target.value)}>
                {PINYIN_PAIRS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedPair && currentDrill && picked ? (
              <>
                <div className="pl-drill-box">
                  <div className="pl-muted">{currentDrill.prompt}</div>
                  <div className="pl-drill-options">
                    {currentDrill.options.map((o, idx) => (
                      <button
                        key={idx}
                        className={"pl-option " + (idx === pickedIdx ? "active" : "")}
                        onClick={() => {
                          setPickedIdx(idx);
                          setTyped("");
                          setTypedScore(null);
                          setSpokenDrill(null);
                        }}
                      >
                        <div className="pl-option-hanzi">{o.hanzi}</div>
                        <div className="pl-option-meta">
                          <div className="pl-option-pinyin">{o.pinyin}</div>
                          <div className="pl-muted">{o.vi}</div>
                        </div>
                        <button
                          className="pl-mini-btn"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            safeSpeak({ text: o.hanzi, rate, voice });
                          }}
                          title="Nghe"
                        >
                          🔊
                        </button>
                      </button>
                    ))}
                  </div>

                  <div className="pl-drill-actions">
                    <div className="pl-input-wrap">
                      <input
                        className="pl-input"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder="Nhập pinyin (vd: shi4 hoặc shì)"
                      />
                      <button className="pl-chip" onClick={checkTyped}>
                        Kiểm tra
                      </button>
                    </div>

                    <button className="pl-chip" onClick={recordDrill} disabled={!speech.isAvailable}>
                      {recordingDrill ? "⏹️ Dừng" : "🎙️ Nói"}
                    </button>

                    <button className="pl-chip" onClick={() => safeSpeak({ text: picked.hanzi, rate, voice })}>
                      🔊 Nghe đáp án
                    </button>
                  </div>

                  {typedScore ? (
                    <div className="pl-score">
                      <div className="pl-score-head">
                        <b>Điểm:</b> {typedScore.pct}% ({typedScore.correct}/{typedScore.total})
                      </div>
                      <div className="pl-score-grid">
                        <div className={"pl-pill " + (typedScore.okInitial ? "ok" : "bad")}>
                          Âm đầu: {typedScore.expected.initial || "∅"} / {typedScore.got.initial || "∅"}
                        </div>
                        <div className={"pl-pill " + (typedScore.okFinal ? "ok" : "bad")}>
                          Vần: {typedScore.expected.final || "∅"} / {typedScore.got.final || "∅"}
                        </div>
                        <div className={"pl-pill " + (typedScore.okTone ? "ok" : "warn")}>
                          Thanh: {typedScore.expected.tone || "?"} / {typedScore.got.tone || "?"}
                        </div>
                      </div>
                      <div className="pl-muted">
                        Giải thích: đúng <b>âm đầu</b> + <b>vần</b> + <b>thanh</b> ⇒ 3/3. Nếu bạn không nhập tone thì tone sẽ là “?”.
                      </div>
                    </div>
                  ) : null}

                  {spokenDrill ? (
                    <div className={"pl-spoken " + (spokenDrill.ok ? "ok" : "bad")}>
                      <div>
                        <b>Bạn nói:</b> {spokenDrill.text}
                      </div>
                      <div className="pl-muted">{spokenDrill.ok ? "✅ Khớp chữ Hán của đáp án" : `❌ ${spokenDrill.reason}`}</div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="pl-muted">Không có dữ liệu bài luyện.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="pl-layout">
          <div className="pl-side">
            <div className="pl-search">
              <input
                className="pl-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm nhanh (vd: zh, ü, ang, tone4...)"
              />
            </div>
            <div className="pl-list">
              {filteredSounds.map((s) => (
                <button
                  key={s.key}
                  className={"pl-item " + (s.key === selectedSound.key ? "active" : "")}
                  onClick={() => {
                    setSelectedSound(s);
                    setSpokenMap({});
                  }}
                >
                  <div className="pl-item-key">{s.key}</div>
                  <div className="pl-item-label">{s.label}</div>
                </button>
              ))}
            </div>

            <div className="pl-summary">
              <div className="pl-subtitle">Tổng hợp nhanh</div>
              <div className="pl-muted">Âm đầu: {PINYIN_INITIALS.length} • Vần: {PINYIN_FINALS.length} • Thanh: {PINYIN_TONES.length}</div>
            </div>
          </div>

          <div className="pl-main">
            <SoundCard
              sound={selectedSound}
              rate={rate}
              setRate={setRate}
              voice={voice}
              speechAvailable={speech.isAvailable}
              onRecordExample={(idx) => {
                const ex = selectedSound.examples[idx];
                const key = `${selectedSound.key}:${idx}`;
                startRecordForExample(ex, key);
              }}
              spokenByIndex={Object.fromEntries(
                selectedSound.examples.map((_, idx) => {
                  const key = `${selectedSound.key}:${idx}`;
                  return [idx, spokenMap[key]];
                })
              )}
              recordingIndex={
                recordingKey && recordingKey.startsWith(selectedSound.key + ":")
                  ? Number(recordingKey.split(":")[1])
                  : null
              }
                          micMode={micMode}
              setMicMode={setMicMode}
              micAutoStop={micAutoStop}
              setMicAutoStop={setMicAutoStop}
/>
          </div>
        </div>
      )}

      <div className="pl-footer-note">
        <div className="pl-muted">
          Ghi chú: Máy “đọc” và “nhận giọng” phụ thuộc voice/trình duyệt. Để tránh đọc pinyin lộn xộn và đọc số 1-2-3-4, trang này ưu tiên
          đọc <b>chữ Hán</b> ở ví dụ.
        </div>
      </div>
    </div>
  );
}
