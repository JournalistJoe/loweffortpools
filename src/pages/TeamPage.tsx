import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";

export function TeamPage() {
  const { leagueId, participantId } = useParams<{
    leagueId: string;
    participantId: string;
  }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const teamData = useQuery(
    api.scoring.getParticipantTeams,
    participantId ? { participantId: participantId as any } : "skip",
  );

  if (!league || !teamData) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalWins = teamData.teams.reduce(
    (sum, team) => sum + team.wins + team.ties * 0.5,
    0,
  );

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-6xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {teamData.participant.displayName}'s Teams
          </h1>
          <div className="mt-2 flex items-center space-x-4">
            <span className="text-lg text-gray-600">
              Draft Position: {teamData.participant.draftPosition}
            </span>
            <span className="text-lg font-semibold text-blue-600">
              Total Wins: {totalWins}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamData.teams.map((teamInfo) => (
            <div key={teamInfo.team._id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {teamInfo.team.fullName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Round {teamInfo.pick.round}, Pick #
                      {teamInfo.pick.pickNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {teamInfo.wins}-{teamInfo.losses}-{teamInfo.ties}
                    </div>
                    <div className="text-sm text-gray-600">
                      {teamInfo.wins + teamInfo.ties * 0.5} points
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Schedule</h3>
                  <div className="max-h-64 overflow-y-auto">
                    {teamInfo.games.map((game) => {
                      const opponent = game.isHome ? "vs" : "@";

                      let result = "";
                      let resultClass = "text-gray-600";

                      if (game.status === "final") {
                        if (game.tie) {
                          result = "T";
                          resultClass = "text-yellow-600";
                        } else if (game.winnerTeamId === teamInfo.team._id) {
                          result = "W";
                          resultClass = "text-green-600";
                        } else {
                          result = "L";
                          resultClass = "text-red-600";
                        }
                      } else if (game.status === "in_progress") {
                        result = "Live";
                        resultClass = "text-blue-600";
                      } else {
                        result = "—";
                      }

                      return (
                        <div
                          key={game._id}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-8 text-center font-medium">
                              W{game.week}
                            </span>
                            <span className="text-gray-600">
                              {opponent} {game.opponentTeam?.abbrev || "TBD"}
                            </span>
                          </div>
                          <span className={`font-medium ${resultClass}`}>
                            {result}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
