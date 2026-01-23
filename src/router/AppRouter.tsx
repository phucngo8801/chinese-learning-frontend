import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Streak from "../pages/Streak/Streak";
import Friends from "../pages/Friends/Friends";
import Leaderboard from "../pages/Leaderboard/Leaderboard";
import Activity from "../pages/Activity/Activity";
import LearnVocab from "../pages/LearnVocab/LearnVocab";
import Lessons from "../pages/Lessons/Lessons";
import Quiz from "../pages/Quiz/Quiz";
import AuthGuard from "../auth/AuthGuard";
import AppLayout from "../layouts/AppLayout";
import ToastProvider from "../components/ui/ToastProvider";
import VocabBook from "../pages/VocabBook/VocabBook";

import RealtimeProvider from "../components/realtime/RealtimeProvider";
import Settings from "../pages/Settings/Settings";
import Chat from "../pages/Chat/Chat";
import PinyinLab from "../pages/PinyinLab/PinyinLab";
import Notification from "../pages/Notification/Notification";
import HanziWorld from "../pages/HanziWorld/HanziWorld";

function LearnVocabRoute() {
  const location = useLocation();
  return <LearnVocab key={location.search} />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ToastProvider />

      <RealtimeProvider>
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

            <Route path="notification" element={<Notification />} />

            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<Chat />} />

            <Route path="hanzi-world" element={<HanziWorld />} />

            <Route path="pinyin-lab" element={<PinyinLab />} />
          </Route>

          <Route path="*" element={<Navigate to="/learn-vocab" replace />} />
        </Routes>
      </RealtimeProvider>
    </BrowserRouter>
  );
}
