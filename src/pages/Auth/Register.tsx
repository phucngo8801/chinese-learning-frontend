import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import "./Auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordScore = useMemo(() => {
    // lightweight heuristic: length + variety
    const p = password || "";
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return score; // 0..4
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        username,
        password,
      });

      window.location.href = "/login";
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
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
            <div className="auth-heroHeadline">Tạo tài khoản trong 30 giây</div>
            <ul className="auth-heroList">
              <li>Hệ thống streak nhắc học mỗi ngày</li>
              <li>Từ vựng random + luyện phát âm</li>
              <li>Thành tích & huy hiệu theo tiến độ</li>
            </ul>
          </div>

          <div className="auth-heroFootnote">
            Gợi ý: mật khẩu tối thiểu 8 ký tự.
          </div>
        </aside>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="Xác thực">
            <Link className="auth-tab" role="tab" to="/login">
              Đăng nhập
            </Link>
            <span className="auth-tab active" role="tab" aria-selected="true">
              Đăng ký
            </span>
          </div>

          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-subtitle">Bắt đầu học ngay hôm nay.</p>

          {error && (
            <div className="auth-alert" role="alert">
              {error}
            </div>
          )}

          <label className="auth-field">
            <span className="auth-label">Tên hiển thị</span>
            <div className="auth-inputWrap">
              <span className="auth-icon" aria-hidden="true">
                Aa
              </span>
              <input
                className="auth-input"
                type="text"
                autoComplete="name"
                placeholder="Ví dụ: Phúc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </label>

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
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
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

            <div className="auth-meter" aria-hidden="true">
              <span className={`auth-meterBar ${passwordScore >= 1 ? "on" : ""}`} />
              <span className={`auth-meterBar ${passwordScore >= 2 ? "on" : ""}`} />
              <span className={`auth-meterBar ${passwordScore >= 3 ? "on" : ""}`} />
              <span className={`auth-meterBar ${passwordScore >= 4 ? "on" : ""}`} />
            </div>
            <span className="auth-help">
              Gợi ý: thêm số / ký tự đặc biệt để mạnh hơn.
            </span>
          </label>

          <label className="auth-field">
            <span className="auth-label">Xác nhận mật khẩu</span>
            <div
              className={`auth-inputWrap ${
                confirmPassword && confirmPassword !== password ? "invalid" : ""
              }`}
            >
              <span className="auth-icon" aria-hidden="true">
                ✓
              </span>
              <input
                className="auth-input"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirm ? "Ẩn" : "Hiện"}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span className="auth-help">Mật khẩu xác nhận chưa khớp.</span>
            )}
          </label>

          <button className="auth-primary" type="submit" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>

          <div className="auth-footer">
            <span>Đã có tài khoản?</span>
            <Link className="auth-link" to="/login">
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
