import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MobileSignInFormShadCN } from "./components/MobileSignInFormShadCN";
import { normalizeJoinCode } from "./utils/joinCodeUtils";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { LeagueProvider } from "./contexts/LeagueContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LeagueSelectionPageShadCN as LeagueSelectionPage } from "./pages/LeagueSelectionPageShadCN";
import { DraftPageShadCN as DraftPage } from "./pages/DraftPageShadCN";
import { AdminPageShadCN as AdminPage } from "./pages/AdminPageShadCN";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { TeamPage } from "./pages/TeamPage";
import { SchedulePage } from "./pages/SchedulePage";
import { ChatPage } from "./pages/ChatPage";
import { LeagueWrapper } from "./components/LeagueWrapper";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { PasswordResetPage } from "./pages/PasswordResetPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import { HomePage } from "./pages/HomePage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import { Toaster } from "sonner";

function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const joinCode = searchParams.get("joinCode");
  
  // Normalize joinCode using NFKC normalization and strict validation
  const normalizedJoinCode = normalizeJoinCode(joinCode);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center mx-auto mb-4 hover:opacity-75 transition-opacity"
          >
            <img 
              src="/lowEffortLogo.png" 
              alt="LowEffort.bet Logo" 
              className="h-16 w-16"
            />
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">LowEffort.bet</h1>
          <p className="text-muted-foreground">
            {normalizedJoinCode ? `Join league with code: ${normalizedJoinCode}` : "Sign in to manage your leagues"}
          </p>
        </div>
        <MobileSignInFormShadCN joinCode={normalizedJoinCode} />
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  return (
    <main className="min-h-screen bg-gray-50">
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
    </main>
  );
}

function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public routes that work regardless of auth status */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/signin" element={isAuthenticated ? <Navigate to="/" replace /> : <SignInPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          
          {/* Homepage for unauthenticated users, protected routes for authenticated */}
          <Route
            path="/"
            element={
              isAuthenticated ? <AuthenticatedRoutes /> : <HomePage />
            }
          />
          
          {/* Protected routes - redirect to homepage if not authenticated */}
          <Route
            path="/*"
            element={
              isAuthenticated ? <AuthenticatedRoutes /> : <HomePage />
            }
          />
        </Routes>
        <Toaster position="top-center" />
      </Router>
    </ThemeProvider>
  );
}

export default App;
