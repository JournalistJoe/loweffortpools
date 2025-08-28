import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MobileSignInFormShadCN } from "./components/MobileSignInFormShadCN";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { LeagueProvider } from "./contexts/LeagueContext";
import { LeagueSelectionPageShadCN as LeagueSelectionPage } from "./pages/LeagueSelectionPageShadCN";
import { DraftPageShadCN as DraftPage } from "./pages/DraftPageShadCN";
import { AdminPageShadCN as AdminPage } from "./pages/AdminPageShadCN";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { TeamPage } from "./pages/TeamPage";
import { SchedulePage } from "./pages/SchedulePage";
import { ChatPage } from "./pages/ChatPage";
import { LeagueWrapper } from "./components/LeagueWrapper";
import { Toaster } from "sonner";

function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NFL Pool</h1>
            <p className="text-gray-600">Sign in to manage your leagues</p>
          </div>
          <MobileSignInFormShadCN />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Router>
        <LeagueProvider>
          <Routes>
            <Route path="/" element={<LeagueSelectionPage />} />
            <Route
              path="/league/:leagueId/draft"
              element={
                <LeagueWrapper>
                  <DraftPage />
                </LeagueWrapper>
              }
            />
            <Route
              path="/league/:leagueId/admin"
              element={
                <LeagueWrapper>
                  <AdminPage />
                </LeagueWrapper>
              }
            />
            <Route
              path="/league/:leagueId/leaderboard"
              element={
                <LeagueWrapper>
                  <LeaderboardPage />
                </LeagueWrapper>
              }
            />
            <Route
              path="/league/:leagueId/team/:participantId"
              element={
                <LeagueWrapper>
                  <TeamPage />
                </LeagueWrapper>
              }
            />
            <Route
              path="/league/:leagueId/schedule"
              element={
                <LeagueWrapper>
                  <SchedulePage />
                </LeagueWrapper>
              }
            />
            <Route
              path="/league/:leagueId/chat"
              element={
                <LeagueWrapper>
                  <ChatPage />
                </LeagueWrapper>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LeagueProvider>
      </Router>
      <Toaster position="top-center" />
    </main>
  );
}

export default App;
