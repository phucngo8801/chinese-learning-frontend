import { useLocation, useNavigate } from "react-router-dom";
import toast from "../../lib/toast";
import "./Quiz.css";

export default function Quiz() {
  const { state } = useLocation() as any;
  const navigate = useNavigate();

  if (!state?.viText) {
    return (
      <div className="quiz-page">
        <p>Không có dữ liệu bài học.</p>
        <button onClick={() => navigate("/lessons")}>Quay lại Lessons</button>
      </div>
    );
  }

  const answers = shuffle([
    state.viText,
    "Xin lỗi",
    "Tạm biệt",
    "Không sao",
  ]);

  const choose = (ans: string) => {
    if (ans === state.viText) {
      const xp = Number(localStorage.getItem("xp") || 0) + 20;
      localStorage.setItem("xp", String(xp));

      // ✅ sync with Lessons page progress
      const key = "done_lessons_vi";
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = Array.from(new Set([...arr, String(state.viText)]));
      localStorage.setItem(key, JSON.stringify(next));

      toast.success("Đúng! +20 XP");
      navigate("/lessons");
    } else {
      toast.error("Sai! Quay lại học");
      navigate(-1);
    }
  };

  return (
    <div className="quiz-page">
      <h1>🧠 Quiz</h1>

      <div className="zh">{state.zhText}</div>
      <div className="pinyin">{state.pinyin}</div>

      <div className="answers">
        {answers.map((a) => (
          <button key={a} onClick={() => choose(a)}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function shuffle(arr: string[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}
