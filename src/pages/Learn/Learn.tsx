import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "../../lib/toast";
import { ensureMicPermission } from "../../lib/mic";
import "./Learn.css";

type CharItem = {
  char: string;
  pinyin: string;
  correct: boolean;
};

type LessonState = {
  lesson?: {
    vi: string;
    zh: string;
    pinyin: string;
  };
};

export default function Learn() {
  const location = useLocation();
  const navigate = useNavigate();

  const [viText, setViText] = useState("");
  const [chars, setChars] = useState<CharItem[]>([]);
  const [zhText, setZhText] = useState("");
  const [pinyinText, setPinyinText] = useState("");
  const [spoken, setSpoken] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const speed = 1;
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // ✅ đo thời gian “học câu” (từ lúc có câu đến lúc chấm)
  const sentenceStartRef = useRef<number>(Date.now());
  const postedRef = useRef<boolean>(false);

  useEffect(() => {
    const currentXP = Number(localStorage.getItem("xp") || 0);
    setXp(currentXP);
    setLevel(Math.floor(currentXP / 100) + 1);
  }, []);

  // ✅ support: Lessons -> Learn (pass lesson via navigation state)
  useEffect(() => {
    const st = (location.state || {}) as LessonState;
    const lesson = st?.lesson;
    if (!lesson) return;

    const vi = (lesson.vi || "").trim();
    const zh = (lesson.zh || "").trim();
    const py = (lesson.pinyin || "").trim();

    setViText(vi);
    setZhText(zh);
    setPinyinText(py);
    setChars([]);
    setSpoken("");
    setScore(null);
    setSaved(false);
    postedRef.current = false;

    // reset timer when we load a new lesson
    sentenceStartRef.current = Date.now();
    if (zh) buildChars(zh, py);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const buildChars = (zh: string, py: string) => {
    const zhArr = zh.replace(/[^\u4e00-\u9fa5]/g, "").split("");
    const pyArr = py.split(" ");

    setPinyinText(py);

    const built: CharItem[] = zhArr.map((char, i) => ({
      char,
      pinyin: pyArr[i] || "",
      correct: true,
    }));

    setChars(built);
  };

  const translateText = async () => {
    if (loading) return;
    const clean = viText.trim();
    if (!clean) return;

    setLoading(true);
    setChars([]);
    setSpoken("");
    setScore(null);
    setSaved(false);
    postedRef.current = false;

    try {
      const res = await api.post("/translate", { text: clean });
      setZhText(res.data.zh);
      setPinyinText(res.data.pinyin || "");

      // ✅ reset timer khi có câu mới
      sentenceStartRef.current = Date.now();

      buildChars(res.data.zh, res.data.pinyin || "");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) toast.error("Bạn thao tác quá nhanh. Chờ 1–2 giây rồi thử lại.");
      else toast.error(err?.response?.data?.message || "Không dịch được");
    } finally {
      setLoading(false);
    }
  };

  const speakSentence = () => {
    if (!zhText) return;
    const u = new SpeechSynthesisUtterance(zhText);
    u.lang = "zh-CN";
    u.rate = speed;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const speakChar = (char: string) => {
    const u = new SpeechSynthesisUtterance(char);
    u.lang = "zh-CN";
    u.rate = speed;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const [listening, setListening] = useState(false);
  const listeningRef = useRef<boolean>(false);
  const [spokenPreview, setSpokenPreview] = useState<string>("");
  const recogRef = useRef<any>(null);
  const finalizedRef = useRef<boolean>(false);
  const lastUiUpdateRef = useRef<number>(0);
  const silenceTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const restartCountRef = useRef<number>(0);
  const transcriptRef = useRef<string>("");

  const stopListening = (opts?: { cancel?: boolean }) => {
    const cancel = opts?.cancel ?? false;
    setListening(false);
    listeningRef.current = false;
    try {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      if (maxTimerRef.current) window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    } catch {}

    const r = recogRef.current;
    recogRef.current = null;
    try {
      if (r) {
        if (cancel) r.abort?.();
        else r.stop?.();
      }
    } catch {}
  };

  const finalizeSpeech = async () => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    const t = String(transcriptRef.current || "").trim();
    if (!t) {
      toast.error("Bạn chưa nói gì rõ ràng. Thử lại nhé.");
      stopListening({ cancel: true });
      return;
    }
    stopListening({ cancel: false });
    await compare(t);
  };

  const startListening = async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Trình duyệt không hỗ trợ nhận giọng nói. Hãy dùng Chrome/Edge.");
      return;
    }

    // Ask mic permission explicitly (reduces instant failures on some devices).
    try {
      await ensureMicPermission();
    } catch {
      toast.error("Bạn cần cho phép Microphone để luyện nói.");
      return;
    }

    finalizedRef.current = false;
    restartCountRef.current = 0;
    transcriptRef.current = "";
    setSpokenPreview("");
    setListening(true);
    listeningRef.current = true;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const recog = new SR();
    recogRef.current = recog;
    recog.lang = "zh-CN";
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    // continuous is smoother on desktop; on some mobile devices it may behave unpredictably.
    recog.continuous = !isMobile;

    let finalText = "";

    const scheduleFinalize = (ms: number) => {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = window.setTimeout(() => {
        if (listeningRef.current && !finalizedRef.current) void finalizeSpeech();
      }, ms);
    };

    recog.onresult = (e: any) => {
      try {
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
          transcriptRef.current = merged;
          const now = Date.now();
          if (now - lastUiUpdateRef.current > 120) {
            lastUiUpdateRef.current = now;
            setSpokenPreview(merged);
          }
        }
        if (finalText.trim()) scheduleFinalize(180);
        else scheduleFinalize(1400);
      } catch {
        // ignore
      }
    };

    recog.onerror = (ev: any) => {
      const code = String(ev?.error || "");
      if (code === "not-allowed" || code === "service-not-allowed") {
        toast.error("Bạn cần cho phép quyền micro (microphone).");
      } else if (code === "audio-capture") {
        toast.error("Không tìm thấy micro. Hãy kiểm tra thiết bị/driver.");
      } else {
        toast.error(code ? `Lỗi nhận giọng nói: ${code}` : "Lỗi nhận giọng nói.");
      }
      stopListening({ cancel: true });
    };

    recog.onend = () => {
      // If it ends unexpectedly while we are still listening, restart a few times for smoothness.
      if (!listeningRef.current || finalizedRef.current) return;
      if (recog.continuous) return; // should keep running on desktop
      if (restartCountRef.current >= 2) {
        // fall back to finalize what we have
        void finalizeSpeech();
        return;
      }
      restartCountRef.current += 1;
      window.setTimeout(() => {
        try {
          recog.start();
        } catch {
          void finalizeSpeech();
        }
      }, 120);
    };

    try {
      recog.start();
    } catch {
      toast.error("Không thể bắt đầu luyện nói. Thử reload trang.");
      stopListening({ cancel: true });
      return;
    }

    // Hard stop to avoid hanging forever
    if (maxTimerRef.current) window.clearTimeout(maxTimerRef.current);
    maxTimerRef.current = window.setTimeout(() => {
      if (!finalizedRef.current) void finalizeSpeech();
    }, 12000);
  };

  const record = () => {
    if (listening) {
      void finalizeSpeech();
      return;
    }
    void startListening();
  };


  const compare = async (spokenText: string) => {
      setSpoken(spokenText);
      const spokenArr = spokenText.replace(/[^\u4e00-\u9fa5]/g, "").split("");

      let correctCount = 0;

      const updated = chars.map((c) => {
        const ok = spokenArr.includes(c.char);
        if (ok) correctCount++;
        return { ...c, correct: ok };
      });

      const finalScore = Math.round(
        (correctCount / Math.max(chars.length, 1)) * 100
      );

      setChars(updated);
      setScore(finalScore);

      // ✅ log study event (chỉ log 1 lần cho mỗi câu)
      if (!postedRef.current && chars.length > 0) {
        postedRef.current = true;

        const durationSec = Math.max(
          1,
          Math.round((Date.now() - sentenceStartRef.current) / 1000)
        );

        const correct = finalScore >= 60;

        try {
          await api.post("/study/event", {
            type: "sentence",
            itemId: zhText ? String(zhText).slice(0, 200) : "sentence",
            correct,
            durationSec,
          });
        } catch (e) {
          console.warn("POST /study/event failed (sentence)", e);
        }
      }

      if (finalScore >= 60 && !saved) {
        const newXP = xp + 10;
        localStorage.setItem("xp", String(newXP));
        setXp(newXP);
        setLevel(Math.floor(newXP / 100) + 1);
        setSaved(true);
      }
    };

  const canQuiz = useMemo(() => {
    return !!(viText.trim() && zhText.trim() && pinyinText.trim());
  }, [viText, zhText, pinyinText]);

  const openQuiz = () => {
    if (!canQuiz) return;
    navigate("/quiz", { state: { viText: viText.trim(), zhText: zhText.trim(), pinyin: pinyinText.trim() } });
  };

  return (
    <div className="learn-page">
      <h1>📘 Học tiếng Trung</h1>

      <p>
        XP: {xp} | Level: {level}
      </p>

      <textarea
        className="input-vi"
        value={viText}
        onChange={(e) => setViText(e.target.value)}
        placeholder="Gõ tiếng Việt"
      />

      <button onClick={translateText} disabled={loading}>
        {loading ? "Đang dịch..." : "🔁 Dịch"}
      </button>

      {canQuiz && (
        <button onClick={openQuiz} style={{ marginLeft: 8 }}>
          🧠 Làm quiz
        </button>
      )}

      {chars.length > 0 && (
        <div>
          {chars.map((c, i) => (
            <div key={i} onClick={() => speakChar(c.char)}>
              {c.char} — {c.pinyin}
            </div>
          ))}
        </div>
      )}

      <button onClick={speakSentence}>▶️ Nghe</button>
      <button onClick={record}>🎙️ Luyện nói</button>

      {listening ? (
        <div style={{ marginTop: 10, opacity: 0.9 }}>
          <b>🎙️ Đang nghe...</b> {spokenPreview ? <span style={{ marginLeft: 8 }}>("{spokenPreview}")</span> : null}
        </div>
      ) : null}


      {spoken && <p>Điểm: {score}%</p>}
    </div>
  );
}