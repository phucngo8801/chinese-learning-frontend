import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { setLocalUid } from "../../lib/vocabLocal";
import "./Auth.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });

      localStorage.setItem("token", res.data.accessToken);

      // ✅ Scope local stats per-user (fix user2 seeing user1 mic/stats)
      setLocalUid(username);

      window.location.href = "/";
    } catch {
      setError("Tài khoản hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true" />

      <div className="auth-card">
        <aside className="auth-hero" aria-hidden="true">
          <div className="auth-brand">
            <div className="auth-logo">汉</div>
            <div className="auth-brandText">
              <div className="auth-brandTitle">Chinese Learning</div>
              <div className="auth-brandSubtitle">
                Học từ vựng • Luyện phát âm • Kết nối bạn bè
              </div>
            </div>
          </div>

          <div className="auth-heroContent">
            <div className="auth-heroHeadline">Bắt đầu một ngày học mới</div>
            <ul className="auth-heroList">
              <li>Quiz từ vựng theo cấp độ</li>
              <li>Streak & bảng xếp hạng theo tuần</li>
              <li>Chat realtime với bạn bè</li>
            </ul>
          </div>

          <div className="auth-heroFootnote">
            Mẹo: học 10 phút mỗi ngày sẽ tốt hơn học dồn.
          </div>
        </aside>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="Xác thực">
            <span className="auth-tab active" role="tab" aria-selected="true">
              Đăng nhập
            </span>
            <Link className="auth-tab" role="tab" to="/register">
              Đăng ký
            </Link>
          </div>

          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-subtitle">Đăng nhập để tiếp tục hành trình học.</p>

          {error && (
            <div className="auth-alert" role="alert">
              {error}
            </div>
          )}

          <label className="auth-field">
            <span className="auth-label">Tài khoản</span>
            <div className="auth-inputWrap">
              <span className="auth-icon" aria-hidden="true">
                @
              </span>
              <input
                className="auth-input"
                type="text"
                autoComplete="username"
                placeholder="Ví dụ: phucngo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Mật khẩu</span>
            <div className="auth-inputWrap">
              <span className="auth-icon" aria-hidden="true">
                ••
              </span>
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </label>

          <button className="auth-primary" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="auth-footer">
            <span>Chưa có tài khoản?</span>
            <Link className="auth-link" to="/register">
              Tạo tài khoản
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
