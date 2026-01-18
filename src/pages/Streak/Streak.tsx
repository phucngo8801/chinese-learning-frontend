import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./Streak.css";

type StreakStatus = {
  currentStreak: number;
  minutes: number;
  lastStudyDate: string;
};

type RecoveryStatus = {
  recoveryUsed: number;
  remaining: number;
};

export default function Streak() {
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    const res = await api.get("/streak/me"); // ✅ FIX Ở ĐÂY
    setStreak(res.data);
  };

  const fetchRecovery = async () => {
    const res = await api.get("/streak/recovery");
    setRecovery(res.data);
  };

  const studyToday = async () => {
    await api.post("/streak/study", { minutes: 10 }); // ⚠️ BE BẮT BUỘC CÓ minutes
    fetchStreak();
  };

  useEffect(() => {
    Promise.all([fetchStreak(), fetchRecovery()]).finally(() =>
      setLoading(false)
    );
  }, []);

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="streak-page">
      <h1>🔥 Chuỗi ngày học</h1>

      <p>
        🔥 Streak hiện tại: <b>{streak?.currentStreak ?? 0}</b> ngày
      </p>
      <p>⏱ Tổng phút học: {streak?.minutes ?? 0} phút</p>

      <button className="btn-primary" onClick={studyToday}>
        📘 Học hôm nay
      </button>

      {recovery && recovery.remaining === 0 && (
        <p className="warning-text">⚠️ Tháng này bạn đã dùng recovery</p>
      )}
    </div>
  );
}
