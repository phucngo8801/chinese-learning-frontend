import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "../../lib/toast";
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

  const record = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      toast.error("Trình duyệt không hỗ trợ SpeechRecognition");
      return;
    }

    const recog = new SR();
    recog.lang = "zh-CN";
    recog.start();

    recog.onresult = (e: any) => {
      const spokenText = e.results[0][0].transcript;
      setSpoken(spokenText);
      compare(spokenText);
    };
  };

  const compare = async (spokenText: string) => {
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

      {spoken && <p>Điểm: {score}%</p>}
    </div>
  );
}
