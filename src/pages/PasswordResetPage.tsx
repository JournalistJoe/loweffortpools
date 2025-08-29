import { useNavigate, useSearchParams } from "react-router-dom";
import { PasswordResetForm } from "../components/PasswordResetForm";
import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

export function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam || !emailParam) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setToken(tokenParam);
    setEmail(decodeURIComponent(emailParam));
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="mb-8">
            <img 
              src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"} 
              alt="LowEffort.bet Logo" 
              className="h-16 w-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground mb-2">LowEffort.bet</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Invalid Reset Link</h2>
            <p className="text-red-600">{error}</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate("/forgot-password")}
              className="w-full"
            >
              Request New Reset Link
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img 
            src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"} 
            alt="LowEffort.bet Logo" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">LowEffort.bet</h1>
          <p className="text-muted-foreground">Create your new password</p>
        </div>
        
        <PasswordResetForm token={token} email={email} />
        
        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/forgot-password")}
            className="text-sm"
          >
            ← Back to Forgot Password
          </Button>
        </div>
      </div>
    </div>
  );
}