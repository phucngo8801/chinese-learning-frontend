import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import BottomNav from "../components/BottomNav/BottomNav";
import "./AppLayout.css";

export default function AppLayout() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Simple edge-swipe gesture (mobile): swipe right to open menu, swipe left to close.
  const swipeRef = useRef<{
    mode: "open" | "close" | null;
    startX: number;
    startY: number;
    armed: boolean;
  }>({ mode: null, startX: 0, startY: 0, armed: false });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  // Keep isMobile in sync when resizing / rotating.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Safari < 14
    // @ts-expect-error - legacy API
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    // @ts-expect-error - legacy API
    else mql.addListener(onChange);

    return () => {
      // @ts-expect-error - legacy API
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      // @ts-expect-error - legacy API
      else mql.removeListener(onChange);
    };
  }, []);

  // Close the sidebar when navigating on mobile
  useEffect(() => {
    if (!isMobile) return;
    setMobileSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const t = e.touches[0];
    if (!t) return;

    const EDGE_PX = 22;
    const DRAWER_MAX = 360; // approximate width for closing swipe

    const mode: "open" | "close" | null = mobileSidebarOpen
      ? t.clientX < DRAWER_MAX
        ? "close"
        : null
      : t.clientX <= EDGE_PX
      ? "open"
      : null;

    swipeRef.current = {
      mode,
      startX: t.clientX,
      startY: t.clientY,
      armed: !!mode,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const s = swipeRef.current;
    if (!s.armed || !s.mode) return;

    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - s.startX;
    const dy = t.clientY - s.startY;

    // Only treat as a horizontal swipe if it's clearly horizontal.
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return;

    const OPEN_TH = 60;
    const CLOSE_TH = 60;

    if (s.mode === "open" && dx > OPEN_TH) {
      setMobileSidebarOpen(true);
      swipeRef.current.armed = false;
    }

    if (s.mode === "close" && dx < -CLOSE_TH) {
      setMobileSidebarOpen(false);
      swipeRef.current.armed = false;
    }
  };

  const onTouchEnd = () => {
    swipeRef.current.armed = false;
    swipeRef.current.mode = null;
  };

  return (
    <div
      className={
        isMobile
          ? `app-layout app-layout--mobile ${
              mobileSidebarOpen ? "app-layout--menuOpen" : ""
            }`
          : "app-layout"
      }
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile overlay (drawer) */}
      {isMobile && mobileSidebarOpen && (
        <button
          className="mobile-nav-overlay"
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop keeps Sidebar mounted. Mobile mounts it only when opened (more robust). */}
      {(!isMobile || mobileSidebarOpen) && (
        <Sidebar
          isMobile={isMobile}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className="app-content">
        <Outlet />
      </div>

      {/* Mobile bottom navigation (hide while drawer is open; close via the ✕ in drawer) */}
      {isMobile && !mobileSidebarOpen && (
        <BottomNav onToggleMenu={() => setMobileSidebarOpen(true)} isMenuOpen={false} />
      )}
    </div>
  );
}
