"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function MobileSignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
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
        }}
      >
        <input
          className="w-full px-4 py-4 rounded-lg bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm hover:shadow text-base min-h-[44px]"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          required
        />
        <input
          className="w-full px-4 py-4 rounded-lg bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm hover:shadow text-base min-h-[44px]"
          type="password"
          name="password"
          placeholder={
            flow === "signUp" ? "Password (min 8 characters)" : "Password"
          }
          autoComplete={flow === "signUp" ? "new-password" : "current-password"}
          minLength={flow === "signUp" ? 8 : undefined}
          required
        />
        <button
          className="w-full px-4 py-4 rounded-lg bg-primary text-white font-semibold hover:brightness-90 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[44px]"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
              {flow === "signIn" ? "Signing in..." : "Signing up..."}
            </div>
          ) : flow === "signIn" ? (
            "Sign in"
          ) : (
            "Sign up"
          )}
        </button>
        <div className="text-center text-base text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:brightness-75 hover:underline font-medium cursor-pointer min-h-[44px] px-2 py-1"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
