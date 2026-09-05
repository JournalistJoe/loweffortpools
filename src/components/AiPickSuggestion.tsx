import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/utils/errors";

interface Suggestion {
  teamId: Id<"nflTeams">;
  abbrev: string;
  fullName: string;
  rationale: string;
  alternatives: string[];
}

interface AiPickSuggestionProps {
  leagueId: Id<"leagues">;
  onUse: (teamId: Id<"nflTeams">) => Promise<void>;
}

/** Superuser-only helper: ask Claude for a pick, then confirm it. */
export function AiPickSuggestion({ leagueId, onUse }: AiPickSuggestionProps) {
  const suggestPick = useAction(api.aiDraft.suggestPick);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [asking, setAsking] = useState(false);
  const [using, setUsing] = useState(false);

  const ask = async () => {
    setAsking(true);
    try {
      setSuggestion(await suggestPick({ leagueId }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAsking(false);
    }
  };

  const use = async () => {
    if (!suggestion) return;
    setUsing(true);
    try {
      await onUse(suggestion.teamId);
      setSuggestion(null);
    } finally {
      setUsing(false);
    }
  };

  if (!suggestion) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => void ask()} disabled={asking}>
        <Sparkles className="h-4 w-4" />
        {asking ? "Thinking..." : "Ask AI for a pick"}
      </Button>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-foreground">AI suggests</span>
          <Badge variant="secondary" className="font-mono">{suggestion.abbrev}</Badge>
          <span className="text-sm text-foreground">{suggestion.fullName}</span>
        </div>
        <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
        {suggestion.alternatives.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Also worth a look: {suggestion.alternatives.join(", ")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-2" onClick={() => void use()} disabled={using}>
            {using ? "Picking..." : `Draft ${suggestion.abbrev}`}
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => void ask()} disabled={asking}>
            <RefreshCw className="h-4 w-4" />
            {asking ? "Thinking..." : "Ask again"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
