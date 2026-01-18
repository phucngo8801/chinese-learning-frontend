import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import "./AppLayout.css";

import { useEffect, useState } from "react";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when the drawer is open (mobile).
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onRequestClose={() => setMobileOpen(false)} />
      {mobileOpen && <div className="app-overlay" onClick={() => setMobileOpen(false)} />}
      <div className="app-content">
        <header className="app-mobile-header">
          <button
            type="button"
            className="app-mobile-menu"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <div className="app-mobile-title">Học tiếng Trung</div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
