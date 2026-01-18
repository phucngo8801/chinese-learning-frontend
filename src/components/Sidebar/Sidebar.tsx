import { Link, useLocation } from "react-router-dom";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Sidebar.css";
import { clearLocalUid } from "../../lib/vocabLocal";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";

type StreakStatus = {
  currentStreak: number;
  minutes: number;
  lastStudyDate?: string;
};

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

type MascotMode = "kid" | "cat" | "slime";

type SidebarProps = {
  /**
   * Mobile drawer state (controlled by AppLayout).
   * On desktop, Sidebar is always visible.
   */
  mobileOpen?: boolean;
  /** Request parent to close the drawer (e.g. when navigating). */
  onRequestClose?: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** ====== Dropdown Group (Hover/Click -> Portal) ====== */
function DropdownGroup({
  icon,
  label,
  active,
  collapsed,
  children,
}: {
  icon: string;
  label: string;
  active?: boolean;
  collapsed: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const closeTimer = useRef<number | null>(null);

  const calcPos = () => {
    const el = triggerRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();

    // căn theo giữa item, không bị “rớt” xuống/nhảy khi hover
    const desiredTop = r.top + r.height / 2 - 62;

    const top = clamp(desiredTop, 12, window.innerHeight - 220);
    const left = r.right + 10;

    setPos({ top, left });
  };

  const openNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    // tính vị trí trước -> không bị delay
    calcPos();
    setOpen(true);
  };

  const closeSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 110);
  };

  // Khi open, luôn cập nhật vị trí theo scroll/resize (đỡ lệch)
  useEffect(() => {
    if (!open) return;

    const update = () => calcPos();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Click outside -> close (đảm bảo không bị “kẹt”)
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // đảm bảo pos đã có ngay lúc open (phòng trường hợp render sớm)
  useLayoutEffect(() => {
    if (open && !pos) calcPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => setOpen(false);

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="sb__dropdown sb__dropdown--open"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 99999,
              pointerEvents: "auto",
            }}
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            <div className="sb__dropdownInner">{children(close)}</div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={[
          "sb__link",
          "sb__link--group",
          active ? "sb__link--active" : "",
          open ? "is-open" : "",
        ].join(" ")}
        role="button"
        tabIndex={0}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onClick={() => (open ? close() : openNow())}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? close() : openNow();
          }
          if (e.key === "Escape") close();
        }}
        aria-expanded={open}
      >
        <span className="sb__iconBox" aria-hidden="true">
          <span className="sb__icon">{icon}</span>
        </span>

        <span className="sb__text">{label}</span>

        {!collapsed && <span className="sb__chev">▾</span>}

        <span className="sb__glow" aria-hidden="true" />
      </div>

      {menu}
    </>
  );
}

export default function Sidebar({ mobileOpen = false, onRequestClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [mythic, setMythic] = useState(false);

  // Perf guards: disable heavy effects on reduced-motion / coarse pointer / small screens
  const [allowFx, setAllowFx] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [mascot, setMascot] = useState<MascotMode>(() => {
    const v = localStorage.getItem("mascotMode");
    if (v === "kid" || v === "cat" || v === "slime") return v;
    return "kid";
  });

  const location = useLocation();
  const sbRef = useRef<HTMLElement | null>(null);
  const smokeLayerRef = useRef<HTMLDivElement | null>(null);

  // Detect "mobile" and motion/pointer preferences once, then keep them in sync.
  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 860px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqPointerFine = window.matchMedia("(pointer: fine)");

    const sync = () => {
      const mobile = mqMobile.matches;
      setIsMobile(mobile);
      // Allow FX only when:
      // - not mobile
      // - not reduced motion
      // - pointer is fine (mouse/trackpad) to avoid running hover FX on touch devices
      setAllowFx(!mobile && !mqReduce.matches && mqPointerFine.matches);
    };

    sync();

    mqMobile.addEventListener("change", sync);
    mqReduce.addEventListener("change", sync);
    mqPointerFine.addEventListener("change", sync);

    return () => {
      mqMobile.removeEventListener("change", sync);
      mqReduce.removeEventListener("change", sync);
      mqPointerFine.removeEventListener("change", sync);
    };
  }, []);

  // If user navigates on mobile, close the drawer so content is visible.
  useEffect(() => {
    if (!isMobile) return;
    if (!mobileOpen) return;
    onRequestClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const NAV_MAIN: NavItem[] = [
    { to: "/learn-vocab", label: "Học từ vựng", icon: "📖" },
    { to: "/vocab-book", label: "Sổ từ vựng", icon: "📒" },
    { to: "/friends", label: "Bạn bè", icon: "👥" },
    { to: "/settings", label: "Cài đặt", icon: "⚙️" },
  ];

  const NAV_CHAT: NavItem[] = [
    { to: "/chat", label: "Chat", icon: "💬" },
  ];

  const NAV_CENTER: NavItem[] = [
    { to: "/leaderboard", label: "BXH", icon: "🏆" },
    { to: "/activity", label: "Hoạt động", icon: "📢" },
    { to: "/notification", label: "Thông báo", icon: "🔔" },
  ];

  const activePath = location.pathname;

  const isActive = (path: string) => activePath === path;

  const groupCenterActive = useMemo(
    () => NAV_CENTER.some((i) => i.to === activePath),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePath]
  );

  const hasActive = useMemo(() => {
    return (
      NAV_MAIN.some((i) => i.to === activePath) ||
      NAV_CHAT.some((i) => i.to === activePath) ||
      NAV_CENTER.some((i) => i.to === activePath)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePath]);

  const logout = () => {
    clearAuthToken();

    clearLocalUid();

    window.location.href = "/login";
  };

  const clearSmoke = () => {
    const layer = smokeLayerRef.current;
    if (!layer) return;
    layer.innerHTML = "";
  };

  const spawnSmoke = (x: number, y: number, power = 1) => {
    if (!allowFx) return;
    const layer = smokeLayerRef.current;
    if (!layer) return;

    // Keep this intentionally light; too many DOM nodes here will make low-end devices lag.
    const puffCount = clamp(Math.round(4 * power), 3, 8);

    for (let i = 0; i < puffCount; i++) {
      const puff = document.createElement("span");
      puff.className = "sb__smoke";

      const dx = (Math.random() - 0.5) * 28 * power;
      const dy = (Math.random() - 0.5) * 16 * power;

      const size = (12 + Math.random() * 20) * power;
      puff.style.width = `${size}px`;
      puff.style.height = `${size}px`;

      puff.style.left = `${x + dx}px`;
      puff.style.top = `${y + dy}px`;

      const s = 0.85 + Math.random() * 0.85 * power;
      puff.style.setProperty("--s", `${s}`);

      const dur = 560 + Math.random() * 520;
      puff.style.setProperty("--dur", `${dur}ms`);

      layer.appendChild(puff);
      window.setTimeout(() => puff.remove(), dur + 120);
    }
  };

  const getActiveCenter = () => {
    const sb = sbRef.current;
    if (!sb) return null;

    const activeEl = sb.querySelector("a.sb__link--active") as HTMLElement | null;
    if (!activeEl) return null;

    const sbRect = sb.getBoundingClientRect();
    const r = activeEl.getBoundingClientRect();

    const x = clamp(r.left - sbRect.left + r.width / 2, 18, sbRect.width - 18);
    const y = clamp(r.top - sbRect.top + r.height / 2, 18, sbRect.height - 18);

    return { x, y };
  };

  // Mythic smoke
  useEffect(() => {
    if (!mythic || !allowFx) {
      clearSmoke();
      return;
    }

    const c = getActiveCenter();
    if (c) {
      clearSmoke();
      spawnSmoke(c.x, c.y, 1.35);
    }

    const id = window.setInterval(() => {
      const center = getActiveCenter();
      if (!center) return;
      spawnSmoke(center.x, center.y, 0.75);
    }, 900);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mythic, allowFx, location.pathname]);

  // Fetch streak
  useEffect(() => {
    const token = getAuthToken();

    if (!token) return;

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const controller = new AbortController();

    fetch(`${baseURL}/streak/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("streak fetch failed");
        return r.json();
      })
      .then((data) => setStreak(data))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem("mascotMode", mascot);
  }, [mascot]);

  const nextMascot = () => {
    setMascot((m) => (m === "kid" ? "cat" : m === "cat" ? "slime" : "kid"));
  };

  return (
    <aside
      ref={sbRef as any}
      className={[
        "sb",
        isMobile ? "sb--mobile" : "",
        isMobile && mobileOpen ? "sb--mobileOpen" : "",
        collapsed ? "sb--collapsed" : "",
        mythic ? "sb--mythic" : "",
        hasActive ? "sb--active" : "",
      ].join(" ")}
    >
      <div className="sb__fx" aria-hidden="true">
        <div className="sb__aurora" />
        <div className="sb__stars" />
        <div ref={smokeLayerRef} className="sb__smokeLayer" />
      </div>

      <div className="sb__header">
        <button
          type="button"
          className="sb__toggle"
          onClick={() => {
            if (isMobile) {
              if (mobileOpen) onRequestClose?.();
              // If the drawer is controlled by parent, this button acts as "close" on mobile.
              return;
            }
            setCollapsed((v) => !v);
          }}
          aria-label="Toggle sidebar"
        >
          {isMobile ? "✕" : "☰"}
        </button>

        <div className="sb__brand">
          <div className="sb__title">Học tiếng Trung</div>

          <div className="sb__chips">
            <span className="sb__chip">
              🔥 <b>{streak?.currentStreak ?? 0}</b> ngày
            </span>
            <span className="sb__chip">
              ⏱ <b>{streak?.minutes ?? 0}</b> phút
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`sb__mythicBtn ${mythic ? "is-on" : ""}`}
          onClick={() => setMythic((v) => !v)}
          disabled={!allowFx}
          title={
            !allowFx
              ? "Hiệu ứng được tắt trên mobile / chế độ giảm chuyển động"
              : mythic
              ? "Tắt Hoá Thần"
              : "Bật Hoá Thần"
          }
          aria-label="Toggle mythic mode"
          aria-pressed={mythic}
        >
          ✨
        </button>

        <div className="sb__miniChip" title="Streak">
          🔥{streak?.currentStreak ?? 0}
        </div>
      </div>

      <nav className="sb__nav">
        <div className="sb__section">
          {!collapsed && <div className="sb__sectionTitle">Học</div>}

          {NAV_MAIN.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={active ? "sb__link sb__link--active" : "sb__link"}
                title={item.label}
                aria-current={active ? "page" : undefined}
                onMouseEnter={(e) => {
                  if (!mythic || !allowFx) return;
                  const sb = sbRef.current;
                  if (!sb) return;

                  const sbRect = sb.getBoundingClientRect();
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const x = clamp(r.left - sbRect.left + r.width / 2, 18, sbRect.width - 18);
                  const y = clamp(r.top - sbRect.top + r.height / 2, 18, sbRect.height - 18);
                  spawnSmoke(x, y, 1.25);
                }}
              >
                <span className="sb__iconBox" aria-hidden="true">
                  <span className="sb__icon">{item.icon}</span>
                </span>
                <span className="sb__text">{item.label}</span>
                <span className="sb__glow" aria-hidden="true" />
              </Link>
            );
          })}
        </div>

      <div className="sb__section">
  {!collapsed && <div className="sb__sectionTitle">Cộng đồng</div>}

  <Link
    to="/chat"
    className={isActive("/chat") ? "sb__link sb__link--active" : "sb__link"}
    title="Chat"
    aria-current={isActive("/chat") ? "page" : undefined}
    onMouseEnter={(e) => {
      if (!mythic || !allowFx) return;
      const sb = sbRef.current;
      if (!sb) return;

      const sbRect = sb.getBoundingClientRect();
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = clamp(r.left - sbRect.left + r.width / 2, 18, sbRect.width - 18);
      const y = clamp(r.top - sbRect.top + r.height / 2, 18, sbRect.height - 18);
      spawnSmoke(x, y, 1.25);
    }}
  >
    <span className="sb__iconBox" aria-hidden="true">
      <span className="sb__icon">💬</span>
    </span>
    <span className="sb__text">Chat</span>
    <span className="sb__glow" aria-hidden="true" />
  </Link>
</div>


        <div className="sb__section">
          {!collapsed && <div className="sb__sectionTitle">Khác</div>}

          <DropdownGroup
            icon="📌"
            label="Trung tâm"
            active={groupCenterActive}
            collapsed={collapsed}
          >
            {(close) => (
              <div className="sb__dropdownList">
                {NAV_CENTER.map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    className={isActive(i.to) ? "sb__ddItem is-active" : "sb__ddItem"}
                    onClick={close}
                    title={i.label}
                  >
                    <span className="sb__ddIcon">{i.icon}</span>
                    <div className="sb__ddText">
                      <div className="sb__ddTitle">{i.label}</div>
                      <div className="sb__ddSub">
                        {i.to === "/leaderboard"
                          ? "Xếp hạng học tập"
                          : i.to === "/activity"
                          ? "Dòng hoạt động"
                          : "Tin mới hệ thống"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DropdownGroup>
        </div>

        <div className="sb__spacer" />
      </nav>

      {/* Mascot */}
      <div className="sb__mascot" aria-label="Mascot">
        <div className="sb__mascotTop">
          <div className="sb__mascotTitle">
            {mascot === "kid"
              ? "Trồng hoa"
              : mascot === "cat"
              ? "Mèo nhảy"
              : "Slime lăn"}
          </div>
          <button
            type="button"
            className="sb__mascotBtn"
            onClick={nextMascot}
            title="Đổi mascot"
            aria-label="Đổi mascot"
          >
            🎭
          </button>
        </div>

        {mascot === "kid" && (
          <div className="sb__mascotStage">
            <div className="sb__kid">
              <div className="sb__kidHead" />
              <div className="sb__kidBody" />
              <div className="sb__kidHand left" />
              <div className="sb__kidHand right" />
              <div className="sb__kidLeg left" />
              <div className="sb__kidLeg right" />
            </div>

            <div className="sb__pot">
              <div className="sb__soil" />
              <div className="sb__sprout" />
              <div className="sb__flower" />
              <div className="sb__sparkle s1" />
              <div className="sb__sparkle s2" />
              <div className="sb__sparkle s3" />
            </div>
          </div>
        )}

        {mascot === "cat" && (
          <div className="sb__mascotStage">
            <div className="sb__cat">
              <div className="sb__catEar left" />
              <div className="sb__catEar right" />
              <div className="sb__catFace" />
              <div className="sb__catTail" />
              <div className="sb__catShadow" />
            </div>
          </div>
        )}

        {mascot === "slime" && (
          <div className="sb__mascotStage">
            <div className="sb__slime">
              <div className="sb__slimeEye left" />
              <div className="sb__slimeEye right" />
              <div className="sb__slimeMouth" />
              <div className="sb__slimeShine" />
            </div>
          </div>
        )}
      </div>

      <div className="sb__footer">
        <button
          type="button"
          className="sb__logout"
          onClick={logout}
          title="Đăng xuất"
        >
          <span className="sb__iconBox" aria-hidden="true">
            <span className="sb__icon">⏻</span>
          </span>
          <span className="sb__text">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
