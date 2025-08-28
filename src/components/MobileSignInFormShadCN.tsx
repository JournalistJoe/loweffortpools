"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { isValidJoinCode } from "../utils/joinCodeUtils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useNavigate } from "react-router-dom";

interface MobileSignInFormShadCNProps {
  joinCode?: string | null;
}

export function MobileSignInFormShadCN({ joinCode }: MobileSignInFormShadCNProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");

  const handleFlowChange = (newFlow: "signIn" | "signUp") => {
    setFlow(newFlow);
    // Reset success state when switching tabs
    if (signUpSuccess) {
      setSignUpSuccess(false);
      setSignUpEmail("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    formData.set("flow", flow);
    
    // Add joinCode to the authentication request if valid
    if (joinCode && isValidJoinCode(joinCode)) {
      formData.set("joinCode", joinCode);
    }

    try {
      const result = await signIn("password", formData);
      
      // Defensive guard: ensure we have a valid result
      if (!result) {
        throw new Error(
          flow === "signIn" 
            ? "Sign-in failed. Please check your credentials and try again."
            : "Sign-up failed. Please try again or contact support."
        );
      }
      
      // Development-only debug logging (no sensitive data)
      if (import.meta.env.DEV) {
        console.log("Auth flow completed:", { flow, signingIn: result?.signingIn });
      }
      
      // For sign-up flow, show success state with email verification instructions
      // Only show when backend has sent verification email (signingIn === false)
      if (flow === "signUp" && result?.signingIn === false) {
        setSignUpEmail(email);
        setSignUpSuccess(true);
        toast.success("Account created! Check your email for a verification link.", {
          duration: 4000,
        });
      }
      // For sign-in: if result is truthy, user is authenticated and will be redirected
      // All errors (including falsy results) are handled by the catch block above
    } catch (error: unknown) {
      console.error("Auth error:", error);
      
      // Safely extract error message with type narrowing
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let toastTitle = "";
      if (errorMessage.includes("Invalid password")) {
        toastTitle =
          flow === "signIn"
            ? "Invalid password. Please try again."
            : "Password must be at least 8 characters long.";
      } else {
        toastTitle =
          flow === "signIn"
            ? "Could not sign in, did you mean to sign up?"
            : "Could not sign up, did you mean to sign in?";
      }
      toast.error(toastTitle);
    } finally {
      // Always reset submitting state regardless of success or failure
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center pb-6">
        </CardHeader>
        <CardContent>
          <Tabs
            value={flow}
            onValueChange={(value) => handleFlowChange(value as "signIn" | "signUp")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signIn" className="text-sm">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signUp" className="text-sm">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value={flow} className="space-y-0">
              {flow === "signUp" && signUpSuccess ? (
                // Success state for sign-up
                <div className="space-y-6 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✉️</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Check Your Email!
                    </h3>
                    <p className="text-green-700 mb-2">
                      We've sent a verification link to:
                    </p>
                    <p className="font-medium text-green-800 mb-4">
                      {signUpEmail}
                    </p>
                    <p className="text-sm text-green-600">
                      Click the link in your email to activate your account and start creating leagues!
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Don't see the email? Check your spam folder.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSignUpSuccess(false);
                        setSignUpEmail("");
                        setFlow("signIn");
                      }}
                      className="w-full"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                // Regular form for sign-in or sign-up
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder={
                      flow === "signUp"
                        ? "At least 8 characters"
                        : "Enter your password"
                    }
                    autoComplete={
                      flow === "signUp" ? "new-password" : "current-password"
                    }
                    minLength={flow === "signUp" ? 8 : undefined}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {flow === "signIn" ? "Signing in..." : "Signing up..."}
                    </div>
                  ) : flow === "signIn" ? (
                    "Sign In"
                  ) : (
                    "Sign Up"
                  )}
                </Button>

                {flow === "signIn" && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
