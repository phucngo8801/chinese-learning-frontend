import { Link, useLocation } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const isActive = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="app-logo">Học tiếng Trung</span>

        <nav className="app-nav">
          <Link to="/" className={isActive("/")}>
            Trang chủ
          </Link>
          <Link to="/streak" className={isActive("/streak")}>
            Streak
          </Link>
          <Link to="/friends" className={isActive("/friends")}>
            Bạn bè
          </Link>
        </nav>
      </div>

      <button className="btn-danger" onClick={handleLogout}>
        Đăng xuất
      </button>
    </header>
  );
}
