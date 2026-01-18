import { useLocation, useNavigate } from "react-router-dom";
import "./Quiz.css";

export default function Quiz() {
  const { state } = useLocation() as any;
  const navigate = useNavigate();

  if (!state?.viText) {
    return <p>Không có dữ liệu bài học</p>;
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

      const done = JSON.parse(localStorage.getItem("doneLessons") || "[]");
      done.push(state.viText);
      localStorage.setItem("doneLessons", JSON.stringify(done));

      alert("✅ Đúng! +20 XP");
      navigate("/lessons");
    } else {
      alert("❌ Sai! Quay lại học");
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
