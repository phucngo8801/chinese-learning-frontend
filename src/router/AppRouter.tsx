import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { Suspense, lazy } from "react";

import AuthGuard from "../auth/AuthGuard";
import AppLayout from "../layouts/AppLayout";
import ToastProvider from "../components/ui/ToastProvider";
import RealtimeProvider from "../components/realtime/RealtimeProvider";

// Route-level code splitting:
// - Cuts initial JS payload for faster first paint on Vercel.
// - Particularly useful on mobile networks.
const Login = lazy(() => import("../pages/Auth/Login"));
const Register = lazy(() => import("../pages/Auth/Register"));

const LearnVocab = lazy(() => import("../pages/LearnVocab/LearnVocab"));
const VocabBook = lazy(() => import("../pages/VocabBook/VocabBook"));
const Lessons = lazy(() => import("../pages/Lessons/Lessons"));
const Quiz = lazy(() => import("../pages/Quiz/Quiz"));
const Streak = lazy(() => import("../pages/Streak/Streak"));
const Friends = lazy(() => import("../pages/Friends/Friends"));
const Leaderboard = lazy(() => import("../pages/Leaderboard/Leaderboard"));
const Activity = lazy(() => import("../pages/Activity/Activity"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Chat = lazy(() => import("../pages/Chat/Chat"));

function LearnVocabRoute() {
  const location = useLocation();
  // Ensure remount when query changes (e.g. /learn-vocab?mode=...)
  return <LearnVocab key={location.search} />;
}

function PageFallback() {
  return (
    <div
      style={{
        padding: 16,
        textAlign: "center",
        color: "rgba(17,24,39,0.7)",
      }}
    >
      Đang tải...
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ToastProvider />

      <RealtimeProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="learn-vocab" replace />} />
              <Route path="learn" element={<Navigate to="/learn-vocab" replace />} />

              <Route path="learn-vocab" element={<LearnVocabRoute />} />
              <Route path="vocab-book" element={<VocabBook />} />
              <Route path="lessons" element={<Lessons />} />
              <Route path="quiz" element={<Quiz />} />
              <Route path="streak" element={<Streak />} />
              <Route path="friends" element={<Friends />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="activity" element={<Activity />} />

              <Route path="settings" element={<Settings />} />
              <Route path="chat" element={<Chat />} />
            </Route>

            <Route path="*" element={<Navigate to="/learn-vocab" replace />} />
          </Routes>
        </Suspense>
      </RealtimeProvider>
    </BrowserRouter>
  );
}
