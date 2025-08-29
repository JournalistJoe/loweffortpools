import { useState } from "react";

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

export function MobileDraftBoard({
  draftState,
  selectedTeam,
  setSelectedTeam,
  onMakePick,
  isUserTurn,
  formatTime,
  timeRemaining,
}: MobileDraftBoardProps) {
  const [expandedRound, setExpandedRound] = useState<number>(1);
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
    <div className="space-y-4">
      {/* Current Pick Status */}
      {draftState.league.status === "draft" &&
        draftState.currentParticipant && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Current Pick
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {draftState.currentParticipant.displayName}
                </p>
              </div>
              {timeRemaining !== null && (
                <div
                  className={`px-3 py-2 rounded-full font-mono text-lg font-bold ${
                    timeRemaining < 30000
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Draft Rounds - Mobile Accordion */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Draft Results</h2>

        {picksByRound.map(({ round, picks }) => (
          <div
            key={round}
            className="bg-card rounded-lg border border-border"
          >
            <button
              onClick={() =>
                setExpandedRound(expandedRound === round ? 0 : round)
              }
              className="w-full px-4 py-3 flex items-center justify-between text-left min-h-[44px]"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold text-gray-900">
                  Round {round}
                </span>
                {round === currentRound && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Active
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedRound === round ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedRound === round && (
              <div className="px-4 pb-4 space-y-2">
                {picks.map(({ pickNumber, pick, participant }) => (
                  <div
                    key={pickNumber}
                    className={`flex items-center justify-between py-3 px-3 rounded-lg border ${
                      pick
                        ? "border-blue-200 bg-blue-50"
                        : "border-border bg-muted"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-medium text-gray-500 min-w-[30px]">
                        #{pickNumber}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {participant.displayName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {pick?.participant?.displayName ||
                            participant.displayName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {pick ? (
                        <div>
                          <p className="font-bold text-blue-900">
                            {pick.team?.abbrev || "???"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {pick.team?.name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Available Teams - Mobile Optimized */}
      {draftState.league.status === "draft" && (
        <div className="bg-card rounded-lg border border-border">
          <button
            onClick={() => setShowAvailableTeams(!showAvailableTeams)}
            className="w-full px-4 py-3 flex items-center justify-between text-left min-h-[44px]"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Available Teams ({draftState.availableTeams.length})
            </h2>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                showAvailableTeams ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showAvailableTeams && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {draftState.availableTeams.map((team) => (
                  <button
                    key={team._id}
                    onClick={() => setSelectedTeam(team._id)}
                    disabled={!isUserTurn}
                    className={`w-full p-4 text-left rounded-lg border transition-colors min-h-[44px] ${
                      selectedTeam === team._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:border-border hover:bg-muted"
                    } ${!isUserTurn ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {team.abbrev}
                        </p>
                        <p className="text-sm text-gray-600">{team.name}</p>
                      </div>
                      {selectedTeam === team._id && (
                        <div className="text-blue-600">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {isUserTurn && selectedTeam && (
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={onMakePick}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg min-h-[44px]"
                  >
                    Make Pick
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
