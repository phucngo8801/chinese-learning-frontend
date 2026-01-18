import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import toast from "../../lib/toast";
import "./LearnVocab.css";
import { bumpDaily, getDailyStats, savePronAttempt } from "../../lib/vocabLocal";

type Vocab = {
  id: number;
  zh: string;
  pinyin: string;
  vi: string;
  level: number;
};

type CheckResult = "correct" | "wrong" | null;

type PronTokenStatus = "correct" | "wrong" | "missing";
type DiffOp =
  | { type: "keep"; a: string; b: string }
  | { type: "sub"; a: string; b: string }
  | { type: "del"; a: string }
  | { type: "ins"; b: string };

const FEATURES = {
  speak: true,
  record: true,
  flip: true,
  markButtons: true,
  next: true,
};

// ✅ Ngưỡng để được bấm “Đúng”
const PASS_PRON_SCORE = 75;

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// so sánh được cả: "ni3 hao3" và "nǐ hǎo"
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
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  const ops: DiffOp[] = [];
  let i = n,
    j = m;

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
      if (a[i - 1] === b[j - 1])
        ops.push({ type: "keep", a: a[i - 1], b: b[j - 1] });
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
    tips.push("Thiếu âm cuối -ng (kéo dài và giữ lưỡi sau).");
  if (e.endsWith("n") && g.endsWith("ng"))
    tips.push("Bạn đọc -ng thay vì -n (đưa lưỡi lên nướu).");

  if (e.startsWith("sh") && !g.startsWith("sh"))
    tips.push("Âm đầu sh- (uốn lưỡi nhẹ) khác s-.");
  if (e.startsWith("zh") && !g.startsWith("zh"))
    tips.push("Âm đầu zh- (giống 'tr' nhẹ) khác z-.");
  if (e.startsWith("ch") && !g.startsWith("ch"))
    tips.push("Âm đầu ch- (bật hơi) khác c-.");

  if (e.startsWith("x") && !g.startsWith("x"))
    tips.push("Âm đầu x- (mềm, sát) khác s-.");
  if (e.startsWith("q") && !g.startsWith("q"))
    tips.push("Âm đầu q- (giống 'ch' nhưng kéo) khác c-/k-.");
  if (e.startsWith("j") && !g.startsWith("j"))
    tips.push("Âm đầu j- (giống 'ch' mềm) khác z-/d-.");

  if (e.startsWith("r") && !g.startsWith("r"))
    tips.push("Âm đầu r- (r Trung) khác l-.");

  if (tips.length === 0)
    tips.push("Nghe lại phát âm mẫu và nói chậm từng âm tiết.");
  return tips;
}

type Mode = "random" | "selected";

type CatalogItem = {
  id: number;
  zh: string;
  pinyin: string;
  vi: string;
  level: number;
};

type CatalogResponse = {
  page: number;
  limit: number;
  total: number;
  items: CatalogItem[];
};

async function fetchAllSelected(): Promise<CatalogItem[]> {
  const limit = 100;
  let page = 1;
  const out: CatalogItem[] = [];

  while (true) {
    const res = await api.get<CatalogResponse>("/vocab/catalog", {
      params: { q: "", filter: "selected", page, limit },
    });

    const data = res.data;
    out.push(...(data.items || []));

    if (out.length >= (data.total || 0)) break;
    page++;
    if (page > 50) break;
  }

  out.sort((a, b) => a.id - b.id);
  return out;
}

export default function LearnVocab() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ mounted guard
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeToast = (fn: any, ...args: any[]) => {
    if (!mountedRef.current) return;
    try {
      fn(...args);
    } catch {}
  };

  const modeParam = (searchParams.get("mode") || "random").toLowerCase();
  const mode: Mode = modeParam === "selected" ? "selected" : "random";

  const rawFocusId = searchParams.get("focusId");
  const focusId = rawFocusId ? Number(rawFocusId) : null;
  const hasFocus = !!(focusId && Number.isFinite(focusId) && focusId > 0);

  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const [vocab, setVocab] = useState<Vocab | null>(null);
  const cardStartRef = useRef<number>(Date.now());
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CheckResult>(null);
  const [flipped, setFlipped] = useState(false);

  // ✅ quản lý timeout an toàn
  const timeoutsRef = useRef<number[]>([]);
  const safeTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      if (!mountedRef.current) return;
      fn();
    }, ms);
    timeoutsRef.current.push(id);
  };

  const [autoNext, setAutoNext] = useState(true);
  const [completed, setCompleted] = useState(false);

  // selected list state
  const [selectedList, setSelectedList] = useState<CatalogItem[]>([]);
  const selectedIndexRef = useRef<number>(0);
  const doneSetRef = useRef<Set<number>>(new Set());
  const [doneCount, setDoneCount] = useState(0);

  // ✅ stats hôm nay (local)
  const [todayStats, setTodayStats] = useState(() => getDailyStats());
  useEffect(() => {
    const onFocus = () => mountedRef.current && setTodayStats(getDailyStats());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // pron
  const [spokenText, setSpokenText] = useState<string>("");
  const [pronScore, setPronScore] = useState<number | null>(null);
  const [expectedTokensUI, setExpectedTokensUI] = useState<
    { token: string; status: PronTokenStatus; got?: string; tips?: string[] }[]
  >([]);
  const [extraTokens, setExtraTokens] = useState<string[]>([]);

  // ✅ khóa/mở nút “Đúng”
  const canPassPron = pronScore !== null && pronScore >= PASS_PRON_SCORE;

  const explainLocked = () => {
    if (pronScore === null) {
      safeToast(toast.error, "🔒 Bạn cần bấm 🎙️ Nói để chấm phát âm trước.");
      return;
    }
    safeToast(
      toast.error,
      `🔒 Chưa đạt: ${pronScore}%. Cần >= ${PASS_PRON_SCORE}% để bấm Đúng.`
    );
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusInput = () => setTimeout(() => inputRef.current?.focus(), 0);

  // ✅ SpeechRecognition
  const recogRef = useRef<any>(null);
  const recTimerRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string>("");
  const finalizedRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);

  const setRecording = (v: boolean) => {
    isRecordingRef.current = v;
    if (mountedRef.current) setIsRecording(v);
  };

  const resetPron = () => {
    setSpokenText("");
    setPronScore(null);
    setExpectedTokensUI([]);
    setExtraTokens([]);
  };

  const resetCardUI = () => {
    setInput("");
    setResult(null);
    setFlipped(false);
    setCompleted(false);
    resetPron();
  };

  // ✅ stop record sạch
  const stopRecordSilently = () => {
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
          r.abort?.();
        } catch {}
        try {
          r.stop?.();
        } catch {}
      }
    } catch {}
    recogRef.current = null;
    isRecordingRef.current = false;
    if (mountedRef.current) setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      for (const id of timeoutsRef.current) window.clearTimeout(id);
      timeoutsRef.current = [];
      stopRecordSilently();
      try {
        speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const loadVocabById = async (id: number) => {
    const res = await api.get(`/vocab/${id}`);
    return res.data as Vocab;
  };

  const loadRandom = async () => {
    const res = await api.get("/vocab/random");
    return res.data as Vocab;
  };

  const setDoneCountFromRef = () => setDoneCount(doneSetRef.current.size);

  const pickNextSelected = (startIdx: number): CatalogItem | null => {
    const list = selectedList;
    if (!list.length) return null;

    for (let i = startIdx; i < list.length; i++) {
      const id = list[i].id;
      if (!doneSetRef.current.has(id)) {
        selectedIndexRef.current = i;
        return list[i];
      }
    }
    return null;
  };

  const loadSelectedFirstTime = async () => {
    const list = await fetchAllSelected();
    if (!mountedRef.current) return;

    setSelectedList(list);

    doneSetRef.current = new Set();
    setDoneCountFromRef();
    selectedIndexRef.current = 0;

    if (list.length === 0) {
      setVocab(null);
      safeToast(toast, "Danh sách của bạn đang trống. Hãy thêm từ vào My List.");
      return;
    }

    if (hasFocus && focusId) {
      const idx = list.findIndex((x) => x.id === focusId);
      if (idx >= 0) {
        selectedIndexRef.current = idx;
        const v = await loadVocabById(focusId);
        if (!mountedRef.current) return;
        setVocab(v);
        focusInput();
        return;
      }
      safeToast(
        toast,
        "Từ bạn chọn không nằm trong My List, chuyển sang từ đầu danh sách."
      );
    }

    const firstId = list[0].id;
    const v = await loadVocabById(firstId);
    if (!mountedRef.current) return;
    setVocab(v);
    focusInput();
  };

  const loadByMode = async () => {
    try {
      setLoading(true);
      resetCardUI();

      if (mode === "selected") {
        if (selectedList.length === 0) {
          await loadSelectedFirstTime();
          return;
        }

        if (hasFocus && focusId && vocab === null) {
          const idx = selectedList.findIndex((x) => x.id === focusId);
          if (idx >= 0) {
            selectedIndexRef.current = idx;
            const v = await loadVocabById(focusId);
            if (!mountedRef.current) return;
            setVocab(v);
            focusInput();
            return;
          }
        }

        const nextItem = pickNextSelected(selectedIndexRef.current);
        if (!nextItem) {
          setVocab(null);
          safeToast(toast.success, "✅ Bạn đã học xong danh sách đã chọn!");
          return;
        }

        const v = await loadVocabById(nextItem.id);
        if (!mountedRef.current) return;
        setVocab(v);
        focusInput();
        return;
      }

      const v = await loadRandom();
      if (!mountedRef.current) return;
      setVocab(v);
      focusInput();
    } catch (e) {
      console.error(e);
      safeToast(toast.error, "❌ Không load được vocab. Kiểm tra backend + token.");
    } finally {
      mountedRef.current && setLoading(false);
    }
  };

  // Khi mode/focusId đổi => reset UI + (selected mode) reload list
  useEffect(() => {
    setVocab(null);
    resetCardUI();

    if (mode === "selected") {
      setSelectedList([]);
      doneSetRef.current = new Set();
      setDoneCountFromRef();
      selectedIndexRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeParam, rawFocusId]);

  // reset timer mỗi khi chuyển sang từ mới
  useEffect(() => {
    if (vocab?.id) cardStartRef.current = Date.now();
  }, [vocab?.id]);

  useEffect(() => {
    loadByMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeParam, rawFocusId]);

  const toggleFlip = () => {
    setFlipped((v) => !v);
    focusInput();
  };

  const speak = () => {
    if (!vocab) return;
    const u = new SpeechSynthesisUtterance(vocab.zh);
    u.lang = "zh-CN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const postResult = async (correct: boolean) => {
    if (!vocab) return;
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - cardStartRef.current) / 1000)
    );
    await api.post("/vocab/result", { vocabId: vocab.id, correct, durationSec });
  };

  const afterCorrect = () => {
    setCompleted(true);

    if (mode === "selected" && vocab) {
      doneSetRef.current.add(vocab.id);
      setDoneCountFromRef();
      safeToast(toast.success, "✅ Hoàn thành từ này!");

      if (autoNext) {
        safeTimeout(() => {
          const start = Math.min(
            selectedIndexRef.current + 1,
            selectedList.length
          );
          const nextItem = pickNextSelected(start);

          if (!nextItem) {
            setVocab(null);
            safeToast(toast.success, "✅ Bạn đã học xong danh sách đã chọn!");
            return;
          }

          loadVocabById(nextItem.id)
            .then((v) => {
              if (!mountedRef.current) return;
              resetCardUI();
              setVocab(v);
              focusInput();
            })
            .catch(() =>
              safeToast(toast.error, "❌ Không load được từ tiếp theo trong My List.")
            );
        }, 350);
      }
      return;
    }

    if (mode === "random" && autoNext) {
      safeTimeout(() => loadByMode(), 450);
    }
  };

  const checkPinyin = async () => {
    if (!vocab || posting) return;

    const ok = normForCompare(input) === normForCompare(vocab.pinyin);
    setResult(ok ? "correct" : "wrong");

    try {
      setPosting(true);
      await postResult(ok);

      if (!mountedRef.current) return;
      setTodayStats(bumpDaily({ vocabId: vocab.id, correct: ok, mode }));

      if (ok) afterCorrect();
      else safeToast(toast.error, "❌ Sai! (đã lưu)");
    } catch (e) {
      console.error(e);
      safeToast(toast.error, "❌ Ghi kết quả thất bại (POST /vocab/result).");
    } finally {
      mountedRef.current && setPosting(false);
    }
  };

  // ✅ “Đúng” chỉ cho bấm khi pronScore >= 75
  const markCorrect = async () => {
    if (!vocab || posting) return;

    if (!canPassPron) {
      explainLocked();
      return;
    }

    setResult("correct");

    try {
      setPosting(true);
      await postResult(true);

      if (!mountedRef.current) return;
      setTodayStats(bumpDaily({ vocabId: vocab.id, correct: true, mode }));

      afterCorrect();
    } catch (e) {
      console.error(e);
      safeToast(toast.error, "❌ Ghi kết quả thất bại.");
    } finally {
      mountedRef.current && setPosting(false);
    }
  };

  const markWrong = async () => {
    if (!vocab || posting) return;
    setResult("wrong");

    try {
      setPosting(true);
      await postResult(false);

      if (!mountedRef.current) return;
      setTodayStats(bumpDaily({ vocabId: vocab.id, correct: false, mode }));

      safeToast(toast.error, "❌ Đánh dấu SAI (đã lưu)");
    } catch (e) {
      console.error(e);
      safeToast(toast.error, "❌ Ghi kết quả thất bại.");
    } finally {
      mountedRef.current && setPosting(false);
    }
  };

  const buildPronFeedback = (transcript: string) => {
    if (!vocab) return;

    setSpokenText(transcript);

    const expectedTokens = tokenizePinyin(vocab.pinyin);
    const spokenTokens = tokenizePinyin(transcript);

    const containsCJK = /[\u3400-\u9FBF]/.test(transcript);
    if (containsCJK) {
      const ok = transcript.includes(vocab.zh);
      const score = ok ? 100 : 0;

      setPronScore(score);
      setExpectedTokensUI(
        expectedTokens.map((t) => ({
          token: t,
          status: ok ? "correct" : "wrong",
          got: ok ? t : "…",
          tips: ok
            ? []
            : ["SpeechRecognition trả về chữ Hán. Hãy nói rõ từng âm tiết theo pinyin."],
        }))
      );
      setExtraTokens([]);

      savePronAttempt({ vocabId: vocab.id, score, transcript });

      if (score >= PASS_PRON_SCORE) {
        safeToast(toast.success, `✅ Phát âm ${score}% — mở khóa nút Đúng`);
      } else {
        safeToast(
          toast.error,
          `🔒 Phát âm ${score}% — cần >= ${PASS_PRON_SCORE}% để bấm Đúng`
        );
      }
      return;
    }

    const ops = levenshteinOps(expectedTokens, spokenTokens);

    const ui: {
      token: string;
      status: PronTokenStatus;
      got?: string;
      tips?: string[];
    }[] = [];
    const extras: string[] = [];
    let correctCount = 0;

    for (const op of ops) {
      if (op.type === "keep") {
        correctCount++;
        ui.push({ token: op.a, status: "correct", got: op.b, tips: [] });
      } else if (op.type === "sub") {
        ui.push({
          token: op.a,
          status: "wrong",
          got: op.b,
          tips: tipsForSyllable(op.a, op.b),
        });
      } else if (op.type === "del") {
        ui.push({
          token: op.a,
          status: "missing",
          got: "",
          tips: [
            `Bạn thiếu âm tiết "${op.a}". Thử đọc chậm: "${expectedTokens.join(
              " "
            )}".`,
          ],
        });
      } else if (op.type === "ins") {
        extras.push(op.b);
      }
    }

    const score =
      expectedTokens.length === 0
        ? 0
        : Math.round((correctCount / expectedTokens.length) * 100);

    setPronScore(score);
    setExpectedTokensUI(ui);
    setExtraTokens(extras);

    savePronAttempt({ vocabId: vocab.id, score, transcript });

    if (score >= PASS_PRON_SCORE) {
      safeToast(toast.success, `✅ Phát âm ${score}% — mở khóa nút Đúng`);
    } else {
      safeToast(
        toast.error,
        `🔒 Phát âm ${score}% — cần >= ${PASS_PRON_SCORE}% để bấm Đúng`
      );
    }
  };

  // ✅ record: continuous + interim + debounce 1400ms
  const stopRecord = () => {
    stopRecordSilently();
  };

  const record = () => {
    if (!vocab) return;

    if (isRecordingRef.current) {
      stopRecord();
      return;
    }

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      safeToast(toast.error, "❌ Trình duyệt không hỗ trợ SpeechRecognition");
      return;
    }

    latestTranscriptRef.current = "";
    finalizedRef.current = false;

    const recog = new SR();
    recogRef.current = recog;

    recog.lang = "zh-CN";
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 5;

    setRecording(true);
    safeToast(toast.success, "🎙️ Đang nghe... nói xong bấm Dừng hoặc ngừng 1 chút để tự chấm");

    const finalizeNow = () => {
      if (!isRecordingRef.current) return;
      if (finalizedRef.current) return;

      const text = (latestTranscriptRef.current || "").trim();
      if (!text) {
        safeToast(toast.error, "❌ Mình không nghe rõ, thử nói lại");
        stopRecord();
        return;
      }

      finalizedRef.current = true;
      if (mountedRef.current) buildPronFeedback(text);
      safeToast(toast, "📌 Xem chỗ sai ở khung chấm phát âm nhé!");
      stopRecord();
    };

    const scheduleFinalize = () => {
      if (!isRecordingRef.current) return;
      if (recTimerRef.current) window.clearTimeout(recTimerRef.current);

      recTimerRef.current = window.setTimeout(() => {
        finalizeNow();
      }, 1400);
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
        mountedRef.current && setSpokenText(merged);
      }

      if (finalText.trim()) {
        if (recTimerRef.current) window.clearTimeout(recTimerRef.current);
        recTimerRef.current = window.setTimeout(() => finalizeNow(), 200);
        return;
      }

      scheduleFinalize();
    };

    recog.onerror = () => {
      safeToast(toast.error, "❌ Lỗi khi nhận dạng giọng nói");
      stopRecord();
    };

    recog.onend = () => {
      if (isRecordingRef.current && !finalizedRef.current) {
        scheduleFinalize();
      }
    };

    try {
      recog.start();
    } catch {
      stopRecord();
    }
  };

  // ✅ Reset để học lại My List (không trắng trang)
  const resetSelectedSession = async () => {
    if (mode !== "selected") return;

    try {
      if (isRecordingRef.current) stopRecord();
    } catch {}

    doneSetRef.current = new Set();
    selectedIndexRef.current = 0;
    setDoneCount(0);

    resetCardUI();
    safeToast(toast.success, "🔄 Đã reset session My List, bắt đầu học lại!");

    try {
      setLoading(true);

      let list = selectedList;
      if (!list || list.length === 0) {
        list = await fetchAllSelected();
        if (!mountedRef.current) return;
        setSelectedList(list);
      }

      if (!list || list.length === 0) {
        setVocab(null);
        safeToast(toast, "Danh sách của bạn đang trống. Hãy thêm từ vào My List.");
        return;
      }

      const firstId = list[0].id;
      const v = await loadVocabById(firstId);
      if (!mountedRef.current) return;

      setVocab(v);
      focusInput();
    } catch (e) {
      console.error(e);
      safeToast(toast.error, "❌ Reset thất bại. Thử reload trang.");
    } finally {
      mountedRef.current && setLoading(false);
    }
  };

  const goRandom = () => nav("/learn-vocab");
  const goSelected = () => nav("/learn-vocab?mode=selected");
  const goBackBook = () => nav("/vocab-book");

  // Hotkeys
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === " " && FEATURES.flip) {
        e.preventDefault();
        toggleFlip();
      }
      if (e.key.toLowerCase() === "s" && FEATURES.speak) speak();
      if (e.key.toLowerCase() === "r" && FEATURES.record) record();

      if (e.key.toLowerCase() === "n" && FEATURES.next) {
        if (mode === "random") loadByMode();
        else {
          const start = Math.min(
            selectedIndexRef.current + 1,
            selectedList.length
          );
          const nextItem = pickNextSelected(start);
          if (!nextItem) {
            setVocab(null);
            safeToast(toast.success, "✅ Bạn đã học xong danh sách đã chọn!");
            return;
          }
          resetCardUI();
          loadVocabById(nextItem.id)
            .then((v) => {
              if (!mountedRef.current) return;
              setVocab(v);
              focusInput();
            })
            .catch(() =>
              safeToast(toast.error, "❌ Không load được từ tiếp theo trong My List.")
            );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocab, mode, autoNext, selectedList.length, pronScore]);

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") checkPinyin();
  };

  const LoadingOverlay = () =>
    loading ? (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,255,255,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 14,
            background: "#0f172a",
            color: "#fff",
            fontWeight: 900,
          }}
        >
          Đang tải...
        </div>
      </div>
    ) : null;

  // ✅ màn hình học xong My List
  if (!vocab && mode === "selected") {
    return (
      <div className="lv-page">
        <LoadingOverlay />
        <div className="lv-shell">
          <div className="lv-loading" style={{ textAlign: "center" }}>
            ✅ Bạn đã học xong danh sách đã chọn!
            <br />
            <div style={{ marginTop: 12 }}>
              <button
                className="lv-btn danger"
                onClick={resetSelectedSession}
                disabled={loading}
              >
                🔄 Reset để học lại
              </button>{" "}
              <button className="lv-btn" onClick={goBackBook}>
                📒 Về sổ
              </button>{" "}
              <button className="lv-btn primary" onClick={goRandom}>
                🎲 Random
              </button>
            </div>
            <div style={{ marginTop: 10, opacity: 0.8 }}>
              Đã hoàn thành trong session: <b>{doneCount}</b> từ
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vocab) {
    return (
      <div className="lv-page">
        <LoadingOverlay />
        <div className="lv-shell">
          <div className="lv-loading">Không có dữ liệu.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lv-page">
      <LoadingOverlay />

      <div className="lv-shell">
        <div className="lv-header">
          <div>
            <h1>🃏 Thẻ học từ vựng</h1>
            <p className="lv-sub">
              Click thẻ để lật • Space: lật • Enter: kiểm tra • R: nói • S: nghe
            </p>

            <p className="lv-sub" style={{ opacity: 0.9 }}>
              📊 Hôm nay: ✅ {todayStats.correct} • ❌ {todayStats.wrong} • Tổng{" "}
              {todayStats.total} • Từ đã làm: {todayStats.uniqueIds?.length || 0}
            </p>

            {mode === "selected" ? (
              <p className="lv-sub">
                📌 Đang học <b>My List</b> • Hoàn thành session: <b>{doneCount}</b>{" "}
                {completed ? (
                  <b style={{ marginLeft: 8 }}>✅ Hoàn thành</b>
                ) : (
                  <b style={{ marginLeft: 8 }}>⏳ Chưa hoàn thành</b>
                )}
              </p>
            ) : (
              <p className="lv-sub">🎲 Đang ở chế độ Random (SRS)</p>
            )}
          </div>

          <label className="lv-toggle">
            <input
              type="checkbox"
              checked={autoNext}
              onChange={(e) => setAutoNext(e.target.checked)}
            />
            <span>Tự qua từ khi đúng</span>
          </label>
        </div>

        <div className="lv-grid">
          {/* Card */}
          <div className="lv-card-area">
            <div
              className={`lv-flip ${flipped ? "is-flipped" : ""}`}
              onClick={toggleFlip}
              role="button"
              tabIndex={0}
            >
              <div className="lv-face lv-front">
                <div className="lv-chip">Level {vocab.level}</div>
                <div className="lv-zh">{vocab.zh}</div>
                <div className="lv-hint">Click để lật (xem nghĩa + pinyin)</div>

                {result && (
                  <div className={`lv-toast ${result === "correct" ? "ok" : "fail"}`}>
                    {result === "correct" ? "✅ Đúng!" : "❌ Sai!"}
                  </div>
                )}
              </div>

              <div className="lv-face lv-back">
                <div className="lv-row">
                  <div className="lv-label">Pinyin</div>
                  <div className="lv-value mono">{vocab.pinyin}</div>
                </div>
                <div className="lv-row">
                  <div className="lv-label">Nghĩa</div>
                  <div className="lv-value">{vocab.vi}</div>
                </div>
                <div className="lv-mini">
                  Tip: bấm <b>S</b> để nghe • <b>R</b> để luyện nói
                </div>
              </div>
            </div>

            {/* Pron */}
            <div className="lv-pron">
              <div className="lv-pron-head">
                <div className="lv-pron-title">🎯 Chấm phát âm</div>
                <div className="lv-pron-score">
                  {pronScore === null ? "—" : `${pronScore}%`}
                </div>
              </div>

              <div className="lv-pron-row">
                <div className="lv-pron-label">Bạn nói</div>
                <div className="lv-pron-text">{spokenText || "Chưa có"}</div>
              </div>

              <div className="lv-pron-row">
                <div className="lv-pron-label">Đáp án</div>
                <div className="lv-pron-tokens">
                  {expectedTokensUI.length === 0 ? (
                    <span className="lv-pron-muted">Bấm “Nói” để chấm</span>
                  ) : (
                    expectedTokensUI.map((t, idx) => (
                      <span
                        key={`${t.token}-${idx}`}
                        className={`lv-pill ${t.status}`}
                        title={
                          t.status === "correct"
                            ? "Đúng"
                            : t.status === "missing"
                            ? "Thiếu"
                            : `Bạn nói: ${t.got || ""}`
                        }
                      >
                        {t.token}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {extraTokens.length > 0 && (
                <div className="lv-pron-row">
                  <div className="lv-pron-label">Bạn nói dư</div>
                  <div className="lv-pron-tokens">
                    {extraTokens.map((x, i) => (
                      <span key={`${x}-${i}`} className="lv-pill extra">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {expectedTokensUI.some((t) => t.status !== "correct") && (
                <div className="lv-pron-tips">
                  <div className="lv-pron-tips-title">Gợi ý sửa</div>
                  <ul>
                    {expectedTokensUI
                      .filter((t) => t.status !== "correct")
                      .flatMap((t, idx) =>
                        (t.tips || []).map((tip, j) => (
                          <li key={`${idx}-${j}`}>
                            <b className="mono">{t.token}</b>: {tip}
                          </li>
                        ))
                      )}
                  </ul>
                </div>
              )}

              {/* ✅ Gợi ý khóa/mở nút “Đúng” */}
              <div className="lv-pron-gate">
                <span className={`lv-gate ${canPassPron ? "ok" : "lock"}`}>
                  {canPassPron
                    ? `✅ Đạt ${PASS_PRON_SCORE}% — có thể bấm Đúng`
                    : `🔒 Cần >= ${PASS_PRON_SCORE}% để bấm Đúng`}
                </span>
              </div>
            </div>
          </div>

          {/* Panel */}
          <div className="lv-panel">
            <h3>Nhập pinyin</h3>

            <input
              ref={inputRef}
              className={`lv-input ${
                result === "correct" ? "ok" : result === "wrong" ? "fail" : ""
              }`}
              placeholder="Ví dụ: ni hao / nǐ hǎo (đều đúng)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
            />

            <button
              className="lv-btn primary full"
              onClick={checkPinyin}
              disabled={posting || !input.trim()}
            >
              {posting ? "Đang lưu..." : "✔ Kiểm tra"}
            </button>

            {mode === "selected" && completed && (
              <div className="lv-result ok">
                ✅ Hoàn thành từ này.{" "}
                {autoNext
                  ? "Đang chuyển sang từ tiếp theo..."
                  : "Bấm Next để qua từ tiếp theo."}
              </div>
            )}

            {result === "wrong" && (
              <div className="lv-result fail">
                ❌ Sai. Đáp án: <b className="mono">{vocab.pinyin}</b>
                <div className="lv-note">Bấm lật thẻ để xem nghĩa + pinyin.</div>
              </div>
            )}

            <div className="lv-divider" />

            <div className="lv-meta">
              <div>
                <div className="lv-meta-label">ID</div>
                <div className="lv-meta-value">#{vocab.id}</div>
              </div>
              <div>
                <div className="lv-meta-label">Level</div>
                <div className="lv-meta-value">{vocab.level}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="lv-toolbar">
          <div className="lv-toolbar-left">
            {FEATURES.speak && (
              <button className="lv-btn" onClick={speak}>
                🔊 Nghe <span className="lv-kbd">S</span>
              </button>
            )}

            {FEATURES.record && (
              <button
                className={`lv-btn ${isRecording ? "danger" : ""}`}
                onClick={record}
              >
                {isRecording ? "⏹️ Dừng" : "🎙️ Nói"} <span className="lv-kbd">R</span>
              </button>
            )}

            {FEATURES.flip && (
              <button className="lv-btn" onClick={toggleFlip}>
                🔁 Lật <span className="lv-kbd">Space</span>
              </button>
            )}
          </div>

          <div className="lv-toolbar-right">
            {FEATURES.markButtons && (
              <>
                <button
                  className="lv-btn danger"
                  onClick={markWrong}
                  disabled={posting}
                >
                  ❌ Sai
                </button>

                <button
                  className={`lv-btn primary ${canPassPron ? "" : "locked"}`}
                  onClick={canPassPron ? markCorrect : explainLocked}
                  disabled={posting}
                  aria-disabled={!canPassPron}
                  title={
                    canPassPron
                      ? "Đạt phát âm, có thể lưu Đúng"
                      : `Cần chấm phát âm >= ${PASS_PRON_SCORE}%`
                  }
                >
                  {canPassPron ? "✅ Đúng" : "🔒 Đúng"}
                </button>
              </>
            )}

            {mode === "selected" ? (
              <>
                <button
                  className="lv-btn"
                  onClick={() => {
                    const start = Math.min(
                      selectedIndexRef.current + 1,
                      selectedList.length
                    );
                    const nextItem = pickNextSelected(start);
                    if (!nextItem) {
                      setVocab(null);
                      safeToast(toast.success, "✅ Bạn đã học xong danh sách đã chọn!");
                      return;
                    }
                    resetCardUI();
                    loadVocabById(nextItem.id).then((v) => {
                      if (!mountedRef.current) return;
                      setVocab(v);
                      focusInput();
                    });
                  }}
                  disabled={posting || loading}
                >
                  ⏭️ Next (My List) <span className="lv-kbd">N</span>
                </button>

                <button
                  className="lv-btn danger"
                  onClick={resetSelectedSession}
                  disabled={posting || loading}
                >
                  🔄 Reset
                </button>

                <button
                  className="lv-btn"
                  onClick={goBackBook}
                  disabled={posting || loading}
                >
                  📒 Về sổ
                </button>

                <button
                  className="lv-btn primary"
                  onClick={goRandom}
                  disabled={posting || loading}
                >
                  🎲 Random
                </button>
              </>
            ) : (
              <>
                <button
                  className="lv-btn"
                  onClick={loadByMode}
                  disabled={posting || loading}
                >
                  ⏭️ Next <span className="lv-kbd">N</span>
                </button>

                <button
                  className="lv-btn"
                  onClick={goSelected}
                  disabled={posting || loading}
                >
                  ✅ My List
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
