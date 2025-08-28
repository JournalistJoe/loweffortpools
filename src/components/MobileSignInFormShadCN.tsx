"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useNavigate } from "react-router-dom";

export function MobileSignInFormShadCN() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", flow);

    void signIn("password", formData).catch((error) => {
      console.error("Auth error:", error);
      let toastTitle = "";
      if (error.message.includes("Invalid password")) {
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
      setSubmitting(false);
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">NFL Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={flow}
            onValueChange={(value) => setFlow(value as "signIn" | "signUp")}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
