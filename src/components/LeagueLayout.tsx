import { useParams, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LeagueNavigation } from "./LeagueNavigation";
import { FloatingChat } from "./FloatingChat";

export function LeagueLayout() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );

  if (!league) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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