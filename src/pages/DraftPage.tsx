import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";
import { ChatShadCN as Chat } from "../components/ChatShadCN";

export function DraftPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const draftState = useQuery(
    api.draft.getDraftState,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const activity = useQuery(
    api.draft.getActivity,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const makePick = useMutation(api.draft.makePick);
  const removeParticipant = useMutation(api.leagues.removeParticipant);

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

  const handleLeaveLeague = async () => {
    if (!league?.participant || !leagueId) return;
    if (
      !confirm(
        "Are you sure you want to leave this league? This action cannot be undone.",
      )
    )
      return;

    try {
      await removeParticipant({
        leagueId: leagueId as any,
        participantId: league.participant._id as any,
      });
      toast.success("Successfully left the league");
      // Navigation will be handled by the context
    } catch (error) {
      toast.error(String(error));
    }
  };

  if (!league || !draftState) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      <Navigation league={league} />
      <div className="max-w-7xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Draft Board</h1>
            </div>
            {league.isParticipant && league.status === "setup" && (
              <button
                onClick={handleLeaveLeague}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Leave League
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center space-x-4">
            {draftState.league.status === "draft" &&
              draftState.currentParticipant && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Current Pick:</span>
                  <span className="font-medium">
                    {draftState.currentParticipant.displayName}
                  </span>
                  {timeRemaining !== null && (
                    <span
                      className={`font-mono text-sm px-2 py-1 rounded ${
                        timeRemaining < 30000
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {formatTime(timeRemaining)}
                    </span>
                  )}
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Draft Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Draft Results</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-8 gap-2 text-xs font-medium text-gray-500 mb-2">
                  {draftState.participants.map((p) => (
                    <div key={p._id} className="text-center truncate">
                      {p.displayName}
                    </div>
                  ))}
                </div>

                {[1, 2, 3, 4].map((round) => (
                  <div key={round} className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Round {round}
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {Array.from({ length: 8 }, (_, i) => {
                        // Calculate pick number based on snake draft order
                        let pickNumber;
                        if (round % 2 === 1) {
                          // Odd rounds: normal order (1-8, 17-24)
                          pickNumber = (round - 1) * 8 + i + 1;
                        } else {
                          // Even rounds: reverse order (9-16, 25-32)
                          pickNumber = (round - 1) * 8 + (8 - i);
                        }
                        const pick = draftState.picks.find(
                          (p) => p.pickNumber === pickNumber,
                        );
                        const isEmpty = !pick;

                        return (
                          <div
                            key={pickNumber}
                            className={`p-2 text-xs text-center rounded border ${
                              isEmpty
                                ? "border-gray-200 bg-gray-50"
                                : "border-blue-200 bg-blue-50"
                            }`}
                          >
                            {pick ? (
                              <div>
                                <div className="font-medium text-blue-900 truncate">
                                  {pick.team?.abbrev || "???"}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {pick.participant?.displayName}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400">#{pickNumber}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Teams */}
            {draftState.league.status === "draft" && (
              <div className="mt-6 bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Available Teams</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {draftState.availableTeams.map((team) => (
                      <button
                        key={team._id}
                        onClick={() => setSelectedTeam(team._id)}
                        disabled={!isUserTurn}
                        className={`p-3 text-sm rounded border text-left transition-colors ${
                          selectedTeam === team._id
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        } ${!isUserTurn ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="font-medium">{team.abbrev}</div>
                        <div className="text-xs text-gray-600 truncate">
                          {team.name}
                        </div>
                      </button>
                    ))}
                  </div>

                  {isUserTurn && selectedTeam && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleMakePick}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Make Pick
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chat */}
            {(league.isParticipant || league.isAdmin) && (
              <Chat leagueId={leagueId!} />
            )}

            {/* Activity Feed */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Activity</h2>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {activity?.map((item) => (
                  <div
                    key={item._id}
                    className="mb-3 pb-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm text-gray-900">{item.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
