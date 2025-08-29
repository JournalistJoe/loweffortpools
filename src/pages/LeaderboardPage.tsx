import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";

export function LeaderboardPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const leaderboard = useQuery(
    api.scoring.getLeaderboard,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );

  if (!league || !leaderboard) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-6xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Current standings for {league.name || "Unnamed League"}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Total Wins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teams
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.participant._id}
                    className={`${index < 3 ? "bg-yellow-50 dark:bg-yellow-900/20" : ""} hover:bg-muted cursor-pointer transition-colors`}
                  >
                    <Link
                      to={`/league/${leagueId}/team/${entry.participant._id}`}
                      className="contents"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? "text-yellow-600"
                                : index === 1
                                  ? "text-gray-500"
                                  : index === 2
                                    ? "text-orange-600"
                                    : "text-gray-900"
                            }`}
                          >
                            #{index + 1}
                          </span>
                          {index < 3 && (
                            <span className="ml-2 text-lg">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.participant.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Draft Position {entry.participant.draftPosition}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-gray-900">
                          {entry.totalWins}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex gap-1 overflow-x-auto scrollbar-hide"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          {entry.teamRecords.map((record) => (
                            <span
                              key={record.team?._id}
                              className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0"
                            >
                              <span className="sm:hidden">
                                {record.team?.abbrev}
                              </span>
                              <span className="hidden sm:inline">
                                {record.team?.abbrev} ({record.wins}-
                                {record.losses}-{record.ties})
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </Link>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
