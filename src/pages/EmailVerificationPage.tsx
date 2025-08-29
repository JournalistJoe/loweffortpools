import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuthActions();
  const { theme } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam || !emailParam) {
      setError("Invalid verification link. The link may be malformed.");
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);

    // Remove sensitive parameters from URL to prevent exposure in history/screenshots
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("token");
    newParams.delete("email");
    const newUrl = window.location.pathname + (newParams.toString() ? "?" + newParams.toString() : "");
    navigate(newUrl, { replace: true });
  }, [searchParams, navigate]);

  useEffect(() => {
    if (token && email && !isVerifying && !isVerified && !error) {
      setIsVerifying(true);
      handleEmailVerification();
    }
  }, [token, email, isVerifying, isVerified, error]);

  const handleEmailVerification = async () => {
    if (!token || !email) return;
    
    // Set up form data for email verification
    const verificationFormData = new FormData();
    verificationFormData.set("flow", "email-verification");
    verificationFormData.set("email", email);
    verificationFormData.set("code", token);

    try {
      await signIn("password", verificationFormData);
      setIsVerified(true);
      toast.success("Email verified successfully! Welcome to LowEffort.bet!", {
        duration: 4000,
      });
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Email verification error:", error);
      if (error instanceof Error && error.message.includes("expired")) {
        setError("Verification link has expired. Please sign up again to receive a new verification email.");
      } else if (error instanceof Error && error.message.includes("invalid")) {
        setError("Invalid verification link. Please sign up again to receive a new verification email.");
      } else {
        setError("Failed to verify email. Please try again or contact support.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

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
            <h2 className="text-lg font-semibold text-red-800 mb-2">Verification Failed</h2>
            <p className="text-red-600">{error}</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate("/")}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
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
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Email Verified!</h2>
            <p className="text-green-600">Your email has been successfully verified. You are now signed in.</p>
            <p className="text-sm text-green-600 mt-2">Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifying || (!token || !email)) {
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Verifying Email...</h2>
            <p className="text-blue-600">Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}