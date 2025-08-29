import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Clock, Trophy, Users, CheckCircle } from "lucide-react";

interface MobileDraftBoardProps {
  draftState: {
    participants: Array<{
      _id: string;
      displayName: string;
    }>;
    picks: Array<{
      pickNumber: number;
      team?: {
        abbrev: string;
        name: string;
      };
      participant?: {
        displayName: string;
      };
    }>;
    availableTeams: Array<{
      _id: string;
      abbrev: string;
      name: string;
    }>;
    currentParticipant?: {
      userId: string;
      displayName: string;
    };
    league: {
      status: string;
    };
    timeRemaining?: number;
  };
  selectedTeam: string | null;
  setSelectedTeam: (teamId: string | null) => void;
  onMakePick: () => void;
  isUserTurn: boolean;
  formatTime: (ms: number) => string;
  timeRemaining: number | null;
}

export function MobileDraftBoardShadCN({
  draftState,
  selectedTeam,
  setSelectedTeam,
  onMakePick,
  isUserTurn,
  formatTime,
  timeRemaining,
}: MobileDraftBoardProps) {
  const [expandedRound, setExpandedRound] = useState<string>("round-1");
  const [showAvailableTeams, setShowAvailableTeams] = useState(false);

  const numParticipants = draftState.participants.length;

  // Group picks by round
  const picksByRound = Array.from({ length: 4 }, (_, roundIndex) => {
    const roundNumber = roundIndex + 1;
    const roundPicks = [];

    for (let i = 0; i < numParticipants; i++) {
      let pickNumber;
      if (roundNumber % 2 === 1) {
        // Odd rounds: normal order
        pickNumber = roundIndex * numParticipants + i + 1;
      } else {
        // Even rounds: reverse order
        pickNumber = roundIndex * numParticipants + (numParticipants - i);
      }

      const pick = draftState.picks.find((p) => p.pickNumber === pickNumber);
      roundPicks.push({
        pickNumber,
        pick,
        participant: draftState.participants[roundNumber % 2 === 1 ? i : numParticipants - 1 - i],
      });
    }

    return {
      round: roundNumber,
      picks: roundPicks,
    };
  });

  const currentRound = Math.ceil((draftState.picks.length + 1) / numParticipants);

  return (
    <div className="space-y-4 pb-4">
      {/* Current Pick Status */}
      {draftState.league.status === "draft" &&
        draftState.currentParticipant && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Current Pick
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {draftState.currentParticipant.displayName}
                  </p>
                </div>
                {timeRemaining !== null && (
                  <Badge
                    variant={
                      timeRemaining < 30000 ? "destructive" : "secondary"
                    }
                    className="text-base font-mono px-3 py-1"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(timeRemaining)}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        )}

      {/* Draft Rounds - Mobile Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Draft Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion
            type="single"
            value={expandedRound}
            onValueChange={setExpandedRound}
          >
            {picksByRound.map(({ round, picks }) => (
              <AccordionItem
                key={round}
                value={`round-${round}`}
                className="border-b-0 last:border-b"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">Round {round}</span>
                    {round === currentRound && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-2">
                    {picks.map(({ pickNumber, pick, participant }) => (
                      <div
                        key={pickNumber}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          pick
                            ? "border-primary/20 bg-primary/5"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            #{pickNumber}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">
                              {participant.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pick #{pickNumber}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {pick ? (
                            <div className="flex items-center gap-2">
                              {pick.team?.logoUrl ? (
                                <img
                                  src={pick.team.logoUrl}
                                  alt={`${pick.team.abbrev} logo`}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-6 h-6 flex items-center justify-center"
                                style={{ display: pick.team?.logoUrl ? 'none' : 'flex' }}
                              >
                                <CheckCircle className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">
                                  {pick.team?.abbrev || "???"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {pick.team?.name}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Available Teams - Mobile Optimized */}
      {draftState.league.status === "draft" && (
        <Card>
          <CardHeader
            className="cursor-pointer pb-3"
            onClick={() => setShowAvailableTeams(!showAvailableTeams)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span>Available Teams</span>
                <Badge variant="secondary">
                  {draftState.availableTeams.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          {showAvailableTeams && (
            <CardContent className="pt-0">
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {draftState.availableTeams.map((team) => (
                    <Button
                      key={team._id}
                      onClick={() => setSelectedTeam(team._id)}
                      disabled={!isUserTurn}
                      variant={
                        selectedTeam === team._id ? "default" : "outline"
                      }
                      className="w-full h-auto p-4 justify-between"
                    >
                      <div className="flex items-center gap-3 text-left">
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
                                if (fallback) fallback.style.display = 'flex';
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
                        <div>
                          <p className="font-semibold">{team.abbrev}</p>
                          <p className="text-sm text-muted-foreground">
                            {team.name}
                          </p>
                        </div>
                      </div>
                      {selectedTeam === team._id && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              {isUserTurn && selectedTeam && (
                <>
                  <Separator className="my-4" />
                  <Button
                    onClick={onMakePick}
                    size="lg"
                    className="w-full h-12 text-base font-semibold"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Make Pick
                  </Button>
                </>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
