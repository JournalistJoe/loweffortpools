import { ConvexError } from "convex/values";

/**
 * Turn a thrown value into text fit for a toast.
 *
 * Convex wraps server errors as
 *   "[CONVEX M(leagues:joinLeague)] [Request ID: …] Server Error\nUncaught Error: Invalid join code\n  at …"
 * Users should see "Invalid join code".
 */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ConvexError) {
    return typeof error.data === "string" ? error.data : fallback;
  }
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!raw.trim()) return fallback;

  const uncaught = /Uncaught (?:\w*Error|Error): (.+)/.exec(raw);
  if (uncaught) return uncaught[1].trim();

  const firstLine = raw.split("\n")[0].trim();
  return firstLine.replace(/^(?:\w*Error|Error): /, "") || fallback;
}
