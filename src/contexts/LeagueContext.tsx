import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LeagueContextType {
  selectedLeagueId: string | null;
  setSelectedLeagueId: (leagueId: string | null) => void;
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
    } else if (location.pathname !== "/leagues" && selectedLeagueId) {
      // If we're not on a league route and not on the leagues page, clear selection
      setSelectedLeagueId(null);
    }
  }, [location.pathname, selectedLeagueId]);

  const handleSetSelectedLeagueId = (leagueId: string | null) => {
    setSelectedLeagueId(leagueId);
    if (leagueId) {
      void navigate(`/league/${leagueId}/draft`);
    } else {
      void navigate("/leagues");
    }
  };

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
