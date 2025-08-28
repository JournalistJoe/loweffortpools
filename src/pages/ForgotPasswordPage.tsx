import { useNavigate } from "react-router-dom";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import { Button } from "../components/ui/button";

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img 
            src="/lowEffortLogo.png" 
            alt="LowEffort.bet Logo" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LowEffort.bet</h1>
          <p className="text-gray-600">Reset your password</p>
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