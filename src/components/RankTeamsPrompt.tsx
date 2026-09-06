import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ListOrdered, CheckCircle } from "lucide-react";

interface RankTeamsPromptProps {
  leagueId: Id<"leagues">;
  participantId: string;
}

/**
 * Nudges a participant to rank teams before the draft. Shown only while the
 * league is in setup; the ranking UI itself lives on the My Team page.
 */
export function RankTeamsPrompt({ leagueId, participantId }: RankTeamsPromptProps) {
  const preferences = useQuery(api.draft.getDraftPreferences, { leagueId });
  if (preferences === undefined) return null;

  const hasRankings = preferences !== null && preferences.rankings.length > 0;
  const href = `/league/${leagueId}/team/${participantId}`;

  return (
    <Card
      className={
        hasRankings
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
          : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
      }
    >
      <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          {hasRankings ? (
            <CheckCircle className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <ListOrdered className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {hasRankings ? "Your draft rankings are saved" : "Rank your teams before the draft"}
            </p>
            <p className="text-muted-foreground">
              {hasRankings
                ? preferences.enableAutoDraft
                  ? "Auto-draft is on: your top available team is picked the moment your turn starts."
                  : "Auto-draft is off: we wait for you each turn and use your list only if the timer runs out."
                : "Even a short list helps: if the app ever picks for you, it uses your list first, then the best remaining team by last season's record."}
            </p>
          </div>
        </div>
        <Button asChild variant={hasRankings ? "outline" : "default"} size="sm">
          <Link to={href}>{hasRankings ? "Edit rankings" : "Rank teams"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
