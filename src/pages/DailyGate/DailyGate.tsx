import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../../api/axios";
import toast from "../../lib/toast";
import {
  getLocalDateKey,
  markDailyGatePassedLocal,
  markDailyGateSkippedLocal,
} from "../../lib/vocabLocal";

import "./DailyGate.css";

type GatePhrase = {
  vocabId: number | null;
  zh: string;
  pinyin: string;
  vi: string;
};

type DailyGateResponse = {
  ok: boolean;
  dateKey: string;

  // FE will use "threshold" as the effective threshold (auto-easy applied)
  threshold: number;
  thresholdBase?: number;
  thresholdFloor?: number;
  autoEasyStep?: number;

  failCount?: number;

  passed: boolean;
  passedAt: string | null;

  skipped?: boolean;
  skippedAt?: string | null;
  skipLeft?: number;

  bestScore: number;

  rerollCount?: number;
  rerollLimit?: number;
  rerollLeft?: number;

  phrase: GatePhrase;
};

type PronTokenStatus = "correct" | "wrong" | "missing";

type DiffOp =
  | { type: "keep"; a: string; b: string }
  | { type: "sub"; a: string; b: string }
  | { type: "del"; a: string }
  | { type: "ins"; b: string };

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normForCompare(s: string) {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizePinyin(s: string): string[] {
  const n = normForCompare(s);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

function levenshteinOps(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  const ops: DiffOp[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: "del", a: a[i - 1] });
      i--;
      continue;
    }
    if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.push({ type: "ins", b: b[j - 1] });
      j--;
      continue;
    }
    if (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) ops.push({ type: "keep", a: a[i - 1], b: b[j - 1] });
      else ops.push({ type: "sub", a: a[i - 1], b: b[j - 1] });
      i--;
      j--;
      continue;
    }
  }

  return ops.reverse();
}

function tipsForSyllable(expected: string, got?: string) {
  const tips: string[] = [];
  const e = expected;
  const g = got ?? "";

  if (e.endsWith("ng") && !g.endsWith("ng"))
    tips.push("Thiếu âm cuối -ng (kéo dài và giữ lưỡi sau). ");
  if (e.endsWith("n") && g.endsWith("ng"))
    tips.push("Bạn đọc -ng thay vì -n (đưa lưỡi lên nướu). ");

  if (e.startsWith("sh") && !g.startsWith("sh")) tips.push("Âm đầu sh- (uốn lưỡi nhẹ) khác s-. ");
  if (e.startsWith("zh") && !g.startsWith("zh")) tips.push("Âm đầu zh- (giống 'tr' nhẹ) khác z-. ");
  if (e.startsWith("ch") && !g.startsWith("ch")) tips.push("Âm đầu ch- (bật hơi) khác c-. ");

  if (e.startsWith("x") && !g.startsWith("x")) tips.push("Âm đầu x- (mềm, sát) khác s-. ");
  if (e.startsWith("q") && !g.startsWith("q")) tips.push("Âm đầu q- (giống 'ch' nhưng kéo) khác c-/k-. ");
  if (e.startsWith("j") && !g.startsWith("j")) tips.push("Âm đầu j- (giống 'ch' mềm) khác z-/d-. ");

  if (e.startsWith("r") && !g.startsWith("r")) tips.push("Âm đầu r- (r Trung) khác l-. ");

  if (tips.length === 0) tips.push("Nghe lại phát âm mẫu và nói chậm từng âm tiết.");
  return tips;
}

export default function DailyGate() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect") || "/learn-vocab";

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [gate, setGate] = useState<DailyGateResponse | null>(null);

  const [spokenText, setSpokenText] = useState("");
  const [pronScore, setPronScore] = useState<number | null>(null);
  const [expectedTokensUI, setExpectedTokensUI] = useState<
    { token: string; status: PronTokenStatus; got?: string; tips?: string[] }[]
  >([]);
  const [extraTokens, setExtraTokens] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const recogRef = useRef<any>(null);
  const recTimerRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string>("");
  const finalizedRef = useRef<boolean>(false);

  const threshold = gate?.threshold ?? 80;
  const canPass = pronScore !== null && pronScore >= threshold;
  const rerollLimit = gate?.rerollLimit ?? 5;
  const rerollCount = gate?.rerollCount ?? 0;
  const rerollLeft = typeof gate?.rerollLeft === "number" ? Math.max(0, gate.rerollLeft) : Math.max(0, rerollLimit - rerollCount);
  const failCount = gate?.failCount ?? 0;
  const thresholdBase = gate?.thresholdBase ?? threshold;
  const thresholdFloor = gate?.thresholdFloor ?? 65;
  const autoEasyStep = gate?.autoEasyStep ?? 5;
  const skipped = !!gate?.skipped;
  const skipLeft = typeof gate?.skipLeft === "number" ? gate.skipLeft : skipped ? 0 : 1;

  const speak = () => {
    const phrase = gate?.phrase;
    if (!phrase?.zh) return;
    const u = new SpeechSynthesisUtterance(phrase.zh);
    u.lang = "zh-CN";
    u.rate = 1;
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
  };

  const loadGate = async () => {
    setLoading(true);
    try {
      const res = await api.get<DailyGateResponse>("/study/daily-gate");
      if (!mountedRef.current) return;

      if (res.data?.ok) {
        setGate(res.data);

        if (res.data.passed) {
          markDailyGatePassedLocal({
            dateKey: res.data.dateKey || getLocalDateKey(),
            bestScore: res.data.bestScore || 100,
            threshold: res.data.threshold,
            vocabId: res.data.phrase?.vocabId ?? null,
          });
        } else if (res.data.skipped) {
          markDailyGateSkippedLocal({
            dateKey: res.data.dateKey || getLocalDateKey(),
            threshold: res.data.threshold,
            vocabId: res.data.phrase?.vocabId ?? null,
          });
        }
      } else {
        toast.error("❌ Không lấy được Daily Gate.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "❌ Không kết nối được backend.");
    } finally {
      mountedRef.current && setLoading(false);
    }
  };

  useEffect(() => {
    loadGate();
  }, []);

  const buildPronFeedback = (transcript: string) => {
    const phrase = gate?.phrase;
    if (!phrase) return;

    setSpokenText(transcript);

    const expectedTokens = tokenizePinyin(phrase.pinyin);
    const spokenTokens = tokenizePinyin(transcript);

    const containsCJK = /[\u3400-\u9FBF]/.test(transcript);
    if (containsCJK) {
      const ok = transcript.includes(phrase.zh);
      const score = ok ? 100 : 0;

      setPronScore(score);
      setExpectedTokensUI(
        expectedTokens.map((t) => ({
          token: t,
          status: ok ? "correct" : "wrong",
          got: ok ? t : "…",
          tips: ok ? [] : ["SpeechRecognition trả về chữ Hán. Hãy nói rõ từng âm tiết theo pinyin."],
        })),
      );
      setExtraTokens([]);
      return score;
    }

    const ops = levenshteinOps(expectedTokens, spokenTokens);

    const ui: { token: string; status: PronTokenStatus; got?: string; tips?: string[] }[] = [];
    const extras: string[] = [];
    let correctCount = 0;

    for (const op of ops) {
      if (op.type === "keep") {
        correctCount++;
        ui.push({ token: op.a, status: "correct", got: op.b, tips: [] });
      } else if (op.type === "sub") {
        ui.push({ token: op.a, status: "wrong", got: op.b, tips: tipsForSyllable(op.a, op.b) });
      } else if (op.type === "del") {
        ui.push({
          token: op.a,
          status: "missing",
          got: "",
          tips: [`Bạn thiếu âm tiết "${op.a}". Thử đọc chậm: "${expectedTokens.join(" ")}".`],
        });
      } else if (op.type === "ins") {
        extras.push(op.b);
      }
    }

    const score = expectedTokens.length === 0 ? 0 : Math.round((correctCount / expectedTokens.length) * 100);
    setPronScore(score);
    setExpectedTokensUI(ui);
    setExtraTokens(extras);
    return score;
  };

  const resetPron = () => {
    setSpokenText("");
    setPronScore(null);
    setExpectedTokensUI([]);
    setExtraTokens([]);
    latestTranscriptRef.current = "";
    finalizedRef.current = false;
  };

  const stopRecord = () => {
    try {
      if (recTimerRef.current) window.clearTimeout(recTimerRef.current);
      recTimerRef.current = null;

      const r = recogRef.current;
      if (r) {
        try {
          r.onresult = null;
          r.onerror = null;
          r.onend = null;
        } catch {}

        try {
          r.stop?.();
        } catch {
          try {
            r.abort?.();
          } catch {}
        }
      }
    } catch {}

    recogRef.current = null;
    finalizedRef.current = false;
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      stopRecord();
      try {
        speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const record = async () => {
    if (!gate?.phrase?.pinyin) return;

    if (isRecording) {
      stopRecord();
      return;
    }

    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("❌ Trình duyệt không hỗ trợ SpeechRecognition. Hãy dùng Chrome/Edge.");
      return;
    }

    latestTranscriptRef.current = "";
    finalizedRef.current = false;

    const recog = new SR();
    recogRef.current = recog;

    recog.lang = "zh-CN";
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 5;

    const finalizeNow = async () => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;

      const t = (latestTranscriptRef.current || "").trim();
      if (!t) {
        toast.error("❌ Không nghe thấy giọng. Hãy thử nói gần micro hơn.");
        stopRecord();
        return;
      }

      const score = buildPronFeedback(t);

      // sync to server (best score)
      try {
        await api.post("/study/daily-gate/submit", {
          dateKey: gate.dateKey,
          vocabId: gate.phrase?.vocabId,
          score,
          transcript: t,
        });
      } catch {
        // ignore
      }

      stopRecord();
    };

    const scheduleFinalize = (ms = 1200) => {
      if (recTimerRef.current) window.clearTimeout(recTimerRef.current);
      recTimerRef.current = window.setTimeout(() => finalizeNow(), ms);
    };

    recog.onstart = () => {
      setIsRecording(true);
      toast.success("🎙️ Đang nghe... nói xong ngừng 1 chút để tự chấm");
    };

    recog.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const best = r?.[0];
        const t = (best?.transcript || "").trim();
        if (!t) continue;
        if (r.isFinal) finalText += (finalText ? " " : "") + t;
        else interimText += (interimText ? " " : "") + t;
      }

      const merged = (finalText || interimText).trim();
      if (merged) {
        latestTranscriptRef.current = merged;
        setSpokenText(merged);
      }

      if (finalText.trim()) {
        if (recTimerRef.current) window.clearTimeout(recTimerRef.current);
        recTimerRef.current = window.setTimeout(() => finalizeNow(), 150);
        return;
      }

      scheduleFinalize(1200);
    };

    recog.onerror = (ev: any) => {
      const code = ev?.error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        toast.error("❌ Bạn chưa cho phép Microphone cho trang này.");
      } else if (code === "no-speech") {
        toast.error("⚠️ Không nghe thấy giọng. Hãy nói ngay sau khi bấm 🎙️.");
      } else if (code === "audio-capture") {
        toast.error("❌ Không tìm thấy microphone.");
      } else {
        toast.error(`❌ Lỗi nhận dạng giọng nói${code ? ": " + code : ""}`);
      }
      stopRecord();
    };

    recog.onend = () => {
      if (!finalizedRef.current) scheduleFinalize(250);
    };

    try {
      recog.start();
    } catch {
      toast.error("❌ Không thể bắt đầu nhận dạng. Thử reload trang.");
      stopRecord();
    }
  };

  const rerollPhrase = async () => {
    if (!gate) return;
    try {
      if (isRecording) stopRecord();
    } catch {}
    if (gate.passed || gate.skipped) return;
    if (rerollLimit > 0 && rerollLeft <= 0) {
      toast.error("Hết lượt đổi câu hôm nay.");
      return;
    }

    setRerolling(true);
    try {
      const res = await api.post<DailyGateResponse>("/study/daily-gate/reroll");
      if (!mountedRef.current) return;
      if (res.data?.ok) {
        setGate(res.data);
        resetPron();
        toast.success("🔁 Đã đổi sang câu khác.");
      } else {
        toast.error("❌ Không đổi được câu khác.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "❌ Không đổi được câu khác.");
    } finally {
      mountedRef.current && setRerolling(false);
    }
  };



  const skipToday = async () => {
    if (!gate) return;
    if (gate.passed) return;
    if (gate.skipped) {
      toast.error("Bạn đã bỏ qua hôm nay rồi.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<DailyGateResponse>("/study/daily-gate/skip");
      if (!mountedRef.current) return;

      if (res.data?.ok) {
        setGate(res.data);
        markDailyGateSkippedLocal({
          dateKey: res.data.dateKey || getLocalDateKey(),
          threshold: res.data.threshold,
          vocabId: res.data.phrase?.vocabId ?? null,
        });
        toast.success("⏭️ Đã bỏ qua Daily Gate hôm nay.");
        nav(redirect, { replace: true });
      } else {
        toast.error("❌ Không bỏ qua được hôm nay.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "❌ Không bỏ qua được hôm nay.");
    } finally {
      mountedRef.current && setSubmitting(false);
    }
  };

  const unlock = async () => {
    if (!gate) return;
    if (pronScore === null) {
      toast.error("🔒 Bạn cần bấm 🎙️ Nói để chấm phát âm trước.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/study/daily-gate/submit", {
        dateKey: gate.dateKey,
        vocabId: gate.phrase?.vocabId,
        score: pronScore,
        transcript: spokenText,
      });

      // Refresh gate state
      await loadGate();

      if (res.data?.ok) {
        const passedNow = !!res.data?.passed;
        const effTh = typeof res.data?.threshold === "number" ? res.data.threshold : threshold;

        if (passedNow) {
          markDailyGatePassedLocal({
            dateKey: res.data.dateKey || gate.dateKey,
            bestScore: pronScore,
            threshold: effTh,
            vocabId: gate.phrase?.vocabId ?? null,
          });
          toast.success("✅ Đã mở khóa Daily Gate!");
          nav(redirect, { replace: true });
        } else {
          toast.error(`🔒 Chưa đạt: ${pronScore}%. Cần >= ${effTh}%`);
        }
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "❌ Không lưu được kết quả Daily Gate.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dg-page">
        <div className="dg-card">Đang tải Daily Gate...</div>
      </div>
    );
  }

  if (!gate || !gate.phrase) {
    return (
      <div className="dg-page">
        <div className="dg-card">Không có dữ liệu Daily Gate.</div>
      </div>
    );
  }

  const phrase = gate.phrase;

  return (
    <div className="dg-page">
      <div className="dg-card">
        <div className="dg-head">
          <div>
            <h1 className="dg-title">Daily Gate</h1>
            <div className="dg-sub">
              Hôm nay ({gate.dateKey}) bạn cần đọc đúng để mở khóa học bài.
            </div>
            <div className="dg-meta">
              <span className="dg-chip">Ngưỡng: <b>{threshold}%</b></span>
              <span className="dg-chip">Base: <b>{thresholdBase}%</b></span>
              <span className="dg-chip">Fail: <b>{failCount}</b></span>
              <span className="dg-chip">Auto-easy: <b>-{autoEasyStep}%</b>/fail (sàn <b>{thresholdFloor}%</b>)</span>
              {rerollLimit > 0 ? (
                <span className="dg-chip">Reroll: <b>{rerollLeft}</b>/{rerollLimit}</span>
              ) : null}
              <span className="dg-chip">Skip: <b>{skipLeft}</b>/1</span>
            </div>
          </div>

          <button className="dg-btn dg-btn--ghost" onClick={() => nav(redirect)}>
            ⟵ Quay lại
          </button>
        </div>

        {gate.passed || gate.skipped ? (
          <div className="dg-pass">
            <div className="dg-pass-title">
              {gate.passed ? "✅ Bạn đã mở khóa hôm nay!" : "⏭️ Bạn đã bỏ qua Daily Gate hôm nay."}
            </div>
            <div className="dg-pass-meta">
              {gate.passed ? (
                <>
                  Best: <b>{gate.bestScore}%</b> • Ngưỡng: <b>{threshold}%</b>
                </>
              ) : (
                <>
                  Trạng thái: <b>Skipped</b> • (Bạn vẫn vào học bình thường)
                </>
              )}
            </div>
            <button className="dg-btn dg-btn--primary" onClick={() => nav(redirect, { replace: true })}>
              Vào học
            </button>
          </div>
        ) : (
          <>
            <div className="dg-phrase">
              <div className="dg-zh">{phrase.zh}</div>
              <div className="dg-py">{phrase.pinyin}</div>
              <div className="dg-vi">{phrase.vi}</div>
            </div>

            <div className="dg-actions">
              <button className="dg-btn" onClick={speak}>
                🔊 Nghe mẫu
              </button>
              <button
                className={`dg-btn ${isRecording ? "dg-btn--danger" : "dg-btn--primary"}`}
                onClick={record}
              >
                {isRecording ? "⏹️ Dừng" : "🎙️ Nói"}
              </button>
            
              {(rerollLimit > 0) && (
                <button
                  className="dg-btn dg-btn--ghost"
                  onClick={rerollPhrase}
                  disabled={rerolling || submitting || rerollLeft <= 0 || skipped}
                  title={
                    skipped
                      ? "Bạn đã skip hôm nay"
                      : rerollLeft > 0
                        ? `Còn ${rerollLeft} lượt`
                        : "Hết lượt đổi hôm nay"
                  }
                >
                  🔁 Đổi câu khác {rerollLimit > 0 ? `(${rerollLeft})` : ""}
                </button>
              )}

              <button
                className="dg-btn dg-btn--ghost"
                onClick={skipToday}
                disabled={submitting || gate.passed || skipped || skipLeft <= 0}
                title={skipLeft > 0 ? "Bỏ qua hôm nay (1 lần/ngày)" : "Hết lượt skip hôm nay"}
              >
                ⏭️ Bỏ qua hôm nay {skipLeft > 0 ? "" : "(0)"}
              </button>
</div>

            <div className="dg-pron">
              <div className="dg-pron-row">
                <div className="dg-label">Bạn nói</div>
                <div className="dg-text">{spokenText || "Chưa có"}</div>
              </div>

              <div className="dg-pron-row">
                <div className="dg-label">Chấm</div>
                <div className="dg-score">
                  {pronScore === null ? "—" : `${pronScore}%`}
                  <span className={`dg-gate ${canPass ? "ok" : "lock"}`}>
                    {canPass ? `✅ Đạt ${threshold}%` : `🔒 Cần >= ${threshold}%`}
                  </span>
                </div>
              </div>

              <div className="dg-pron-row">
                <div className="dg-label">Âm tiết</div>
                <div className="dg-tokens">
                  {expectedTokensUI.length === 0 ? (
                    <span className="dg-muted">Bấm “Nói” để chấm</span>
                  ) : (
                    expectedTokensUI.map((t, idx) => (
                      <span
                        key={`${t.token}-${idx}`}
                        className={`dg-pill ${t.status}`}
                        title={
                          t.status === "correct"
                            ? "Đúng"
                            : t.status === "missing"
                              ? "Thiếu"
                              : `Bạn nói: ${t.got || ""}`
                        }
                      >
                        <span className="dg-pill-idx">{idx + 1}</span>
                        {t.token}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {extraTokens.length > 0 && (
                <div className="dg-pron-row">
                  <div className="dg-label">Dư</div>
                  <div className="dg-tokens">
                    {extraTokens.map((x, i) => (
                      <span key={`${x}-${i}`} className="dg-pill extra">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {expectedTokensUI.some((t) => t.status !== "correct") && (
                <div className="dg-tips">
                  <div className="dg-tips-title">Gợi ý sửa</div>
                  <ul>
                    {expectedTokensUI
                      .filter((t) => t.status !== "correct")
                      .flatMap((t, idx) =>
                        (t.tips || []).map((tip, j) => (
                          <li key={`${idx}-${j}`}>
                            <b className="mono">{t.token}</b>: {tip}
                          </li>
                        )),
                      )}
                  </ul>
                </div>
              )}
            </div>

            <div className="dg-footer">
              <button
                className={`dg-btn dg-btn--primary ${canPass ? "" : "dg-btn--disabled"}`}
                onClick={unlock}
                disabled={submitting || !canPass}
                title={canPass ? "Mở khóa" : `Cần >= ${threshold}%`}
              >
                {submitting ? "Đang lưu..." : "Mở khóa để vào học"}
              </button>

              <div className="dg-mini">
                Mẹo: bấm 🔊 nghe mẫu, nói chậm theo <b>pinyin</b>. (Ngưỡng: {threshold}%)
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
