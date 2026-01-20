import { useLocation, useNavigate } from "react-router-dom";
import "./BottomNav.css";

type Props = {
  onToggleMenu: () => void;
  isMenuOpen: boolean;
};

type NavItem = {
  key: string;
  label: string;
  icon: string;
  path?: string;
  onClick?: () => void;
};

function isActive(pathname: string, itemPath?: string) {
  if (!itemPath) return false;
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(itemPath + "/");
}

export default function BottomNav({ onToggleMenu, isMenuOpen }: Props) {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const items: NavItem[] = [
    { key: "learn", label: "Học", icon: "📖", path: "/learn-vocab" },
    { key: "book", label: "Sổ", icon: "🟨", path: "/vocab-book" },
    { key: "friends", label: "Bạn", icon: "👥", path: "/friends" },
    { key: "chat", label: "Chat", icon: "💬", path: "/chat" },
    {
      key: "menu",
      // Keep label stable (less confusing). Icon changes when opened.
      label: "Menu",
      icon: isMenuOpen ? "✕" : "☰",
      onClick: onToggleMenu,
    },
  ];

  return (
    <nav className={isMenuOpen ? "bn is-dim" : "bn"} aria-label="Bottom Navigation">
      {items.map((it) => {
        const active = it.key === "menu" ? isMenuOpen : isActive(pathname, it.path);
        const disabled = isMenuOpen && it.key !== "menu";
        return (
          <button
            key={it.key}
            type="button"
            className={active ? "bn__item is-active" : "bn__item"}
            disabled={disabled}
            onClick={() => {
              if (it.onClick) return it.onClick();
              if (it.path) return nav(it.path);
            }}
            aria-current={active ? "page" : undefined}
          >
            <span className="bn__icon" aria-hidden="true">
              {it.icon}
            </span>
            <span className="bn__label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
