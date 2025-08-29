"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded bg-card text-secondary border border-border font-semibold hover:bg-muted hover:brightness-75 transition-colors"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}
