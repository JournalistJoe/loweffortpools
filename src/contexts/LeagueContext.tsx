import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { leagueEntryPath } from "../lib/nflSeason";

interface LeagueContextType {
  selectedLeagueId: string | null;
  /** Selecting a league requires its status so navigation lands on the right page. */
  setSelectedLeagueId: {
    (leagueId: string, status: string): void;
    (leagueId: null): void;
  };
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract league ID from URL
  useEffect(() => {
    const match = location.pathname.match(/^\/league\/([^/]+)/);
    if (match) {
      const leagueId = match[1];
      if (leagueId !== selectedLeagueId) {
        setSelectedLeagueId(leagueId);
      }
    } else if (location.pathname !== "/" && selectedLeagueId) {
      setSelectedLeagueId(null);
    }
  }, [location.pathname, selectedLeagueId]);

  function handleSetSelectedLeagueId(leagueId: string, status: string): void;
  function handleSetSelectedLeagueId(leagueId: null): void;
  function handleSetSelectedLeagueId(leagueId: string | null, status?: string) {
    setSelectedLeagueId(leagueId);
    if (leagueId !== null && status !== undefined) {
      void navigate(leagueEntryPath(leagueId, status));
    } else {
      void navigate("/");
    }
  }

  return (
    <LeagueContext.Provider
      value={{
        selectedLeagueId,
        setSelectedLeagueId: handleSetSelectedLeagueId,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeagueContext() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error("useLeagueContext must be used within a LeagueProvider");
  }
  return context;
}
