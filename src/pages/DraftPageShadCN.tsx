import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Clock, Trophy, Users } from "lucide-react";
import { CommissionerWelcome } from "../components/CommissionerWelcome";
import { PartialLeagueWelcome } from "../components/PartialLeagueWelcome";
import { AutoDraftToggle, ParticipantAutoDraftStatus } from "../components/AutoDraftToggle";

export function DraftPageShadCN() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const currentUser = useQuery(api.users.getCurrentUser);
  const draftState = useQuery(
    api.draft.getDraftState,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const makePick = useMutation(api.draft.makePick);

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Update timer
  useEffect(() => {
    if (draftState?.timeRemaining !== undefined) {
      setTimeRemaining(draftState.timeRemaining);

      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [draftState?.timeRemaining]);

  const handleMakePick = async () => {
    if (!selectedTeam || !leagueId) return;

    try {
      await makePick({
        leagueId: leagueId as any,
        nflTeamId: selectedTeam as any,
      });
      setSelectedTeam(null);
      toast.success("Pick made successfully!");
    } catch (error) {
      toast.error(String(error));
    }
  };


  if (!league || !draftState || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCommissionerAlone = league.isAdmin && draftState.participants.length === 1;
  const isPartialLeague = draftState.participants.length >= 2 && draftState.participants.length <= 7;
  const numParticipants = draftState.participants.length;

  if (isCommissionerAlone) {
    return (
      <div>
        <CommissionerWelcome league={league} currentUser={currentUser} />
      </div>
    );
  }

  if (isPartialLeague) {
    return (
      <div>
        <PartialLeagueWelcome 
          league={league} 
          currentUser={currentUser} 
          participants={draftState.participants} 
        />
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isUserTurn =
    draftState.currentParticipant?.userId === league.participant?.userId;

  return (
    <div>
      <div className="max-w-7xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Draft Board
              </h1>
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-4">
            {draftState.league.status === "draft" &&
              draftState.currentParticipant && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Current Pick:
                  </span>
                  <span className="font-medium">
                    {draftState.currentParticipant.displayName}
                  </span>
                  {timeRemaining !== null && (
                    <Badge
                      variant={
                        timeRemaining < 30000 ? "destructive" : "secondary"
                      }
                      className="font-mono gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {formatTime(timeRemaining)}
                    </Badge>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Auto-draft toggle for user's turn */}
        {draftState.league.status === "draft" && league.participant && (
          <div className="mb-6">
            <AutoDraftToggle
              leagueId={leagueId!}
              participant={league.participant}
              currentUser={currentUser}
              isCurrentParticipantTurn={isUserTurn}
            />
          </div>
        )}

        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Draft Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-0 text-xs font-medium text-muted-foreground" style={{ gridTemplateColumns: `1.5rem repeat(${numParticipants}, 1fr)` }}>
                  <div className="border-r border-b border-border" role="columnheader" aria-label="Round"></div> {/* Thin round column header */}
                  {draftState.participants.map((p, index) => (
                    <div key={p._id} className={`text-center h-20 sm:h-auto sm:py-4 flex items-center justify-center overflow-hidden border-b border-border ${index < numParticipants - 1 ? 'border-r border-border' : ''}`}>
                      <span className="text-[10px] sm:text-xs truncate max-w-full sm:inline block transform -rotate-90 sm:rotate-0 origin-center whitespace-nowrap text-center leading-tight" title={p.displayName}>
                        {p.displayName}
                      </span>
                    </div>
                  ))}
                </div>

                {[1, 2, 3, 4].map((round, roundIndex) => (
                  <div key={round} className="grid gap-0 items-stretch" style={{ gridTemplateColumns: `1.5rem repeat(${numParticipants}, 1fr)` }}>
                    <div className={`h-full text-xs font-medium text-foreground flex items-center justify-center border-r border-border ${roundIndex < 3 ? 'border-b border-border' : ''}`}>
                      {round}
                    </div>
                    {Array.from({ length: numParticipants }, (_, i) => {
                        // Calculate pick number based on snake draft order
                        let pickNumber;
                        if (round % 2 === 1) {
                          // Odd rounds: normal order (1-numParticipants, 17-24)
                          pickNumber = (round - 1) * numParticipants + i + 1;
                        } else {
                          // Even rounds: reverse order (9-16, 25-32)
                          pickNumber = (round - 1) * numParticipants + (numParticipants - i);
                        }
                        const pick = draftState.picks.find(
                          (p) => p.pickNumber === pickNumber,
                        );
                        const isEmpty = !pick;

                        return (
                          <div
                            key={pickNumber}
                            className={`aspect-square p-2 text-xs flex items-center justify-center relative group overflow-hidden ${i < numParticipants - 1 ? 'border-r border-border' : ''} ${roundIndex < 3 ? 'border-b border-border' : ''} ${
                              isEmpty
                                ? "bg-muted/20"
                                : "bg-primary/5"
                            }`}
                            title={pick ? `${pick.team?.fullName || pick.team?.name} - ${pick.participant?.displayName}` : `Pick #${pickNumber}`}
                          >
                            {pick ? (
                              <div className="w-full h-full flex items-center justify-center">
                                {pick.team?.logoUrl ? (
                                  <img
                                    src={pick.team.logoUrl}
                                    alt={`${pick.team.abbrev} logo`}
                                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="font-medium text-primary text-center"
                                  style={{ display: pick.team?.logoUrl ? 'none' : 'block' }}
                                >
                                  {pick.team?.abbrev || "???"}
                                </div>
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="text-white text-center">
                                    <div className="font-medium">{pick.team?.abbrev}</div>
                                    <div className="text-xs mt-1">{pick.participant?.displayName}</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground font-medium">
                                #{pickNumber}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Available Teams */}
            {(draftState.league.status === "draft" || draftState.league.status === "setup") && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Available Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {draftState.availableTeams.map((team) => (
                      <Button
                        key={team._id}
                        onClick={() => setSelectedTeam(team._id)}
                        disabled={!isUserTurn || draftState.league.status === "setup"}
                        variant={
                          selectedTeam === team._id ? "default" : "outline"
                        }
                        className="h-auto p-3 text-left justify-start gap-3"
                      >
                        <div className="flex-shrink-0">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={`${team.abbrev} logo`}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-8 h-8 flex items-center justify-center font-bold text-sm"
                            style={{ display: team.logoUrl ? 'none' : 'flex' }}
                          >
                            {team.abbrev}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{team.abbrev}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {team.name}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {isUserTurn && selectedTeam && draftState.league.status === "draft" && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={handleMakePick}
                        size="lg"
                        className="gap-2"
                      >
                        <Trophy className="h-4 w-4" />
                        Make Pick
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

        </div>
      </div>
    </div>
  );
}
