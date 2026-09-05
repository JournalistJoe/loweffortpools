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
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey(leagueId)) === "1";
    } catch {
      return false;
    }
  });
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
    setDismissed(true);
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
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          {installFirst ? (
            <Smartphone className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          ) : (
            <Bell className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {installFirst ? "Add to your Home Screen for draft alerts" : "Get a nudge when it's your turn"}
            </p>
            <p className="text-muted-foreground">
              {installFirst
                ? "On iPhone, notifications only work from the installed app. Tap Share, then \"Add to Home Screen\", and open LowEffort from there."
                : "Draft start, your pick, and league chat, even when the app is closed."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!installFirst && (
            <Button size="sm" onClick={() => void enable()} disabled={busy}>
              {busy ? "Enabling..." : "Enable notifications"}
            </Button>
          )}
          <Button size="sm" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
