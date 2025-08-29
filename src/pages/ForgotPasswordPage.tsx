import { useNavigate } from "react-router-dom";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import { Button } from "../components/ui/button";
import { useTheme } from "../contexts/ThemeContext";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

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
          <p className="text-muted-foreground">Reset your password</p>
        </div>
        
        <ForgotPasswordForm />
        
        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-sm"
          >
            ← Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}