import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FloatingChat } from "./FloatingChat";
import { ReactNode } from "react";

interface LeagueWrapperProps {
  children: ReactNode;
}

export function LeagueWrapper({ children }: LeagueWrapperProps) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );

  return (
    <>
      {children}
      {league && <FloatingChat league={league} />}
    </>
  );
}
