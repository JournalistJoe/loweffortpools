"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";

interface PasswordResetFormProps {
  token: string;
  email: string;
}

export function PasswordResetForm({ token, email }: PasswordResetFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      setSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      setSubmitting(false);
      return;
    }

    // Set up form data for reset verification
    const resetFormData = new FormData();
    resetFormData.set("flow", "reset-verification");
    resetFormData.set("email", email);
    resetFormData.set("code", token);
    resetFormData.set("newPassword", newPassword);

    try {
      await signIn("password", resetFormData);
      toast.success("Password reset successful! You are now signed in.");
      navigate("/"); // Redirect to home page
    } catch (error) {
      console.error("Password reset verification error:", error);
      if (error instanceof Error && error.message.includes("expired")) {
        toast.error("Reset link has expired. Please request a new one.");
      } else if (error instanceof Error && error.message.includes("invalid")) {
        toast.error("Invalid reset link. Please request a new one.");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-base">
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email-display" className="text-base font-medium">
                Email Address
              </Label>
              <Input
                id="email-display"
                type="email"
                value={email}
                disabled
                className="h-12 text-base bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-base font-medium">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                name="newPassword"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your new password"
                autoComplete="new-password"
                minLength={8}
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
                  Resetting...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}