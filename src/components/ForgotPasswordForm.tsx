"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function ForgotPasswordForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const emailValue = formData.get("email") as string;
    formData.set("flow", "reset");

    try {
      await signIn("password", formData);
      setEmailSent(true);
      setEmail(emailValue);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to send password reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-green-600">
              Email Sent!
            </CardTitle>
            <CardDescription className="text-base">
              Check your email for password reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-gray-900">{email}</p>
              <p className="text-sm text-gray-500">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full"
              >
                Send to a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription className="text-base">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                autoComplete="email"
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
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}