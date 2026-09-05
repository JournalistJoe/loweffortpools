import { useParams, Outlet, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LeagueNavigation } from "./LeagueNavigation";
import { FloatingChat } from "./FloatingChat";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LeagueLayout() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );

  // Handle loading state (undefined)
  if (league === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Handle error state (null) - not found or unauthorized
  if (league === null) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>League Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This league doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild className="w-full">
              <Link to="/">Back to Leagues</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <LeagueNavigation league={league} />
      <Outlet />
      <FloatingChat league={league} isSpectator={league.isSpectator} />
    </div>
  );
}