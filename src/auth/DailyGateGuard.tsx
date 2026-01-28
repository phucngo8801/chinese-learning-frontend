import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import toast from "../lib/toast";
import {
  getLocalDateKey,
  isDailyGateClearedLocal,
  markDailyGatePassedLocal,
  markDailyGateSkippedLocal,
} from "../lib/vocabLocal";

type DailyGateResponse = {
  ok: boolean;
  dateKey: string;
  threshold: number;
  passed: boolean;
  skipped?: boolean;
  bestScore?: number;
  phrase?: { vocabId?: number | null };
};

function FullscreenOverlay({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255,255,255,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 14,
          background: "#0f172a",
          color: "#fff",
          fontWeight: 900,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * Route guard: users must pass today's Daily Gate before accessing learning routes.
 *
 * Behavior:
 * - If localStorage says passed today -> allow.
 * - Else call backend /study/daily-gate -> if passed, sync local and allow.
 * - Else redirect to /daily-gate?redirect=<currentPath>.
 * - If backend fails -> soft-fallback: allow access but show a warning (avoid deadlock).
 */
export default function DailyGateGuard() {
  const nav = useNavigate();
  const loc = useLocation();

  const [checked, setChecked] = useState(false);
  const [passed, setPassed] = useState(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const redirect = `${loc.pathname}${loc.search}`;
      const localKey = getLocalDateKey();

      // Fast path: local
      if (isDailyGateClearedLocal(localKey)) {
        if (!alive) return;
        setPassed(true);
        setChecked(true);
        return;
      }

      try {
        const res = await api.get<DailyGateResponse>("/study/daily-gate");
        if (!alive) return;

        const data = res.data as any;
        if (data?.ok) {
          if (data.passed) {
            markDailyGatePassedLocal({
              dateKey: data.dateKey || localKey,
              bestScore: typeof data.bestScore === "number" ? data.bestScore : 100,
              threshold: typeof data.threshold === "number" ? data.threshold : undefined,
              vocabId: data.phrase?.vocabId ?? null,
            });
            setPassed(true);
            setChecked(true);
            return;
          }

          if (data.skipped) {
            markDailyGateSkippedLocal({
              dateKey: data.dateKey || localKey,
              threshold: typeof data.threshold === "number" ? data.threshold : undefined,
              vocabId: data.phrase?.vocabId ?? null,
            });
            setPassed(true);
            setChecked(true);
            return;
          }

          setPassed(false);
          setChecked(true);
          nav(`/daily-gate?redirect=${encodeURIComponent(redirect)}`, {
            replace: true,
          });
          return;
        }

        // Unexpected response: avoid blocking
        if (!warnedRef.current) {
          warnedRef.current = true;
          toast.error("⚠️ Không kiểm tra được Daily Gate (response lạ). Tạm cho phép vào học.");
        }
        setPassed(true);
        setChecked(true);
      } catch {
        // Avoid deadlock if server is down
        if (!warnedRef.current) {
          warnedRef.current = true;
          toast.error("⚠️ Không kết nối được backend để kiểm tra Daily Gate. Tạm cho phép vào học.");
        }
        setPassed(true);
        setChecked(true);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [loc.key]);

  if (!checked) return <FullscreenOverlay text="Đang kiểm tra Daily Gate..." />;
  if (!passed) return <FullscreenOverlay text="Chuyển sang Daily Gate..." />;
  return <Outlet />;
}
