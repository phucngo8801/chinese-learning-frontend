import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../lib/authToken";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => getAuthToken());

  useEffect(() => {
    const sync = () => setToken(getAuthToken());

    // same tab
    window.addEventListener("auth:token", sync);
    // other tabs
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("auth:token", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!token) return <Navigate to="/login" replace />;
  return children;
}
