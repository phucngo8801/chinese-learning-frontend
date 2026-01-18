import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import "./AppLayout.css";

export default function AppLayout() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isMobile = useMemo(() => {
    // SSR-safe (Vite is client-side, but keep it defensive)
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  }, []);

  // Close the sidebar when navigating on mobile
  useEffect(() => {
    if (!isMobile) return;
    setMobileSidebarOpen(false);
  }, [location.pathname, isMobile]);

  return (
    <div className="app-layout">
      {/* Mobile hamburger */}
      <button
        className="mobile-nav-btn"
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileSidebarOpen(true)}
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          className="mobile-nav-overlay"
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
