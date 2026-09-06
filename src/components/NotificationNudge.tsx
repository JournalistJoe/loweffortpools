import { useState } from "react";
import { Bell, Smartphone, X } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { needsHomeScreenInstall, usePushSubscription } from "../hooks/usePushSubscription";

interface NotificationNudgeProps {
  /** Scopes the dismissal so a new league can ask again. */
  leagueId: string;
}

function dismissKey(leagueId: string) {
  return `notification-nudge-dismissed:${leagueId}`;
}

/**
 * One-line prompt to turn on push before the draft. Hidden once subscribed,
 * unsupported, denied, or dismissed for this league.
 */
export function NotificationNudge({ leagueId }: NotificationNudgeProps) {
  const { status, subscribe } = usePushSubscription();
  // Keyed by league so switching leagues in place re-evaluates the dismissal.
  const [dismissedLeagues, setDismissedLeagues] = useState<Record<string, boolean>>({});
  const dismissed =
    dismissedLeagues[leagueId] ??
    (() => {
      try {
        return localStorage.getItem(dismissKey(leagueId)) === "1";
      } catch {
        return false;
      }
    })();
  const [busy, setBusy] = useState(false);

  const installFirst = needsHomeScreenInstall();
  const canPrompt = status === "supported" || status === "unsubscribed";
  if (dismissed || (!canPrompt && !(status === "unsupported" && installFirst))) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(leagueId), "1");
    } catch {
      /* storage unavailable; hide for this session only */
    }
    setDismissedLeagues((prev) => ({ ...prev, [leagueId]: true }));
  };

  const enable = async () => {
    setBusy(true);
    try {
      if (await subscribe()) dismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="relative border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
      <Button
        size="sm"
        variant="ghost"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute right-1 top-1 h-8 w-8 p-0 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-4 pr-10 sm:flex sm:items-center sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {installFirst ? (
            <Smartphone className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          ) : (
            <Bell className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <div className="text-sm min-w-0">
            <p className="font-medium text-foreground leading-snug">
              {installFirst ? "Get draft alerts on your iPhone" : "Get a nudge when it's your turn"}
            </p>
            {installFirst ? (
              <ol className="mt-1 space-y-0.5 text-muted-foreground">
                <li>1. Tap the Share button in Safari</li>
                <li>2. Choose &ldquo;Add to Home Screen&rdquo;</li>
                <li>3. Open LowEffort from there and turn alerts on</li>
              </ol>
            ) : (
              <p className="text-muted-foreground">
                Draft start, your pick, and league chat, even when the app is closed.
              </p>
            )}
          </div>
        </div>
        {!installFirst && (
          <Button
            size="sm"
            onClick={() => void enable()}
            disabled={busy}
            className="mt-3 w-full sm:mt-0 sm:w-auto sm:shrink-0"
          >
            {busy ? "Enabling..." : "Enable notifications"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
