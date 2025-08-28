import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";

export function SchedulePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(
    undefined,
  );

  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );

  const weekSchedule = useQuery(
    api.scoring.getLeagueSchedule,
    leagueId ? { leagueId: leagueId as any, week: selectedWeek } : "skip",
  );

  const upcomingGames = useQuery(
    api.scoring.getUpcomingGames,
    leagueId ? { leagueId: leagueId as any, limit: 15 } : "skip",
  );

  if (!league) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading for individual queries
  const isLoadingSchedule = weekSchedule === undefined;
  const isLoadingUpcoming = upcomingGames === undefined;

  const formatGameTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getGameStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-green-100 text-green-800",
      final: "bg-gray-100 text-gray-800",
      postponed: "bg-yellow-100 text-yellow-800",
      canceled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.scheduled}`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-6xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Schedule & Matchups
          </h1>
          <p className="text-gray-600 mt-2">
            Upcoming games for {league.name || "Unnamed League"} teams
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Games */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Next 15 Games</h2>
                <p className="text-sm text-gray-600">
                  Upcoming games involving league teams
                </p>
              </div>
              <div className="p-4">
                {isLoadingUpcoming ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : upcomingGames && upcomingGames.games.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingGames.games.map((game) => (
                      <div
                        key={game._id}
                        className={`p-4 rounded-lg border ${
                          game.isParticipantMatchup
                            ? "border-purple-200 bg-purple-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-gray-600">
                            Week {game.week} • {formatGameTime(game.gameDate)}
                          </div>
                          <div className="flex items-center space-x-2">
                            {game.awayParticipant &&
                              game.homeParticipant &&
                              game.awayParticipant._id ===
                                game.homeParticipant._id && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  1-1
                                </span>
                              )}
                            {getGameStatusBadge(game.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {game.awayTeam?.abbrev}
                              </div>
                              {game.awayParticipant && (
                                <div className="text-xs text-blue-600 font-medium">
                                  {game.awayParticipant.displayName}
                                </div>
                              )}
                            </div>
                            <div className="text-gray-500">@</div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {game.homeTeam?.abbrev}
                              </div>
                              {game.homeParticipant && (
                                <div className="text-xs text-blue-600 font-medium">
                                  {game.homeParticipant.displayName}
                                </div>
                              )}
                            </div>
                          </div>

                          {game.status === "final" && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                Final
                              </div>
                              {game.tie ? (
                                <div className="text-xs text-gray-600">Tie</div>
                              ) : (
                                <div className="text-xs text-green-600">
                                  {game.winnerTeamId === game.homeTeamId
                                    ? game.homeTeam?.abbrev
                                    : game.awayTeam?.abbrev}{" "}
                                  wins
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No upcoming games found for league teams
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Games may need to be imported via the admin panel
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Week Selector & Head-to-Head Matchups */}
          <div className="space-y-6">
            {/* Week Selector */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">View by Week</h3>
              {isLoadingSchedule ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : (
                <select
                  value={selectedWeek || weekSchedule?.week}
                  onChange={(e) =>
                    setSelectedWeek(
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    Current Week ({weekSchedule?.week || 1})
                  </option>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Head-to-Head Matchups */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Head-to-Head Matchups</h3>
                <p className="text-sm text-gray-600">
                  Week {selectedWeek || weekSchedule?.week || 1}
                </p>
              </div>
              <div className="p-4">
                {isLoadingSchedule ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                ) : weekSchedule &&
                  weekSchedule.participantMatchups.length > 0 ? (
                  <div className="space-y-3">
                    {weekSchedule.participantMatchups.map((game) => (
                      <div
                        key={game._id}
                        className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <span className="font-medium text-purple-900">
                              {game.awayParticipant?.displayName}
                            </span>
                            <span className="text-purple-600">vs</span>
                            <span className="font-medium text-purple-900">
                              {game.homeParticipant?.displayName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {game.awayTeam?.abbrev} @ {game.homeTeam?.abbrev}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatGameTime(game.gameDate)}
                          </div>
                          <div className="mt-2 flex justify-center items-center space-x-2">
                            {game.awayParticipant &&
                              game.homeParticipant &&
                              game.awayParticipant._id ===
                                game.homeParticipant._id && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  1-1
                                </span>
                              )}
                            {getGameStatusBadge(game.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-sm">
                      No head-to-head matchups this week
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Week Summary */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">
                Week {selectedWeek || weekSchedule?.week || 1} Summary
              </h3>
              {isLoadingSchedule ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Games:</span>
                    <span className="font-medium">
                      {weekSchedule?.games.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Head-to-Head:</span>
                    <span className="font-medium text-purple-600">
                      {weekSchedule?.participantMatchups.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">
                      {weekSchedule?.games.filter((g) => g.status === "final")
                        .length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming:</span>
                    <span className="font-medium text-blue-600">
                      {weekSchedule?.games.filter(
                        (g) => g.status === "scheduled",
                      ).length || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
