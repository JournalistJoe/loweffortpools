import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";
import { toast } from "sonner";

export function ParticipantsPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const participants = useQuery(
    api.leagues.getParticipants,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const draftPicks = useQuery(
    api.draft.getDraftState,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const removeParticipant = useMutation(api.leagues.removeParticipant);

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;

    try {
      await removeParticipant({
        leagueId: leagueId as any,
        participantId: participantId as any,
      });
      toast.success("Participant removed successfully");
    } catch (error) {
      toast.error("Failed to remove participant");
    }
  };

  // Count teams for each participant
  const getTeamCount = (participantId: string) => {
    if (!draftPicks?.picks) return 0;
    return draftPicks.picks.filter(
      (pick) => pick.participantId === participantId,
    ).length;
  };

  if (!league || !participants) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
          <p className="text-gray-600 mt-2">
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""} in{" "}
            {league.name || "Unnamed League"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draft Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teams Drafted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants
                  .sort((a, b) => a.draftPosition - b.draftPosition)
                  .map((participant) => (
                    <tr key={participant._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{participant.draftPosition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTeamCount(participant._id)} teams
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          to={`/league/${leagueId}/team/${participant._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Team
                        </Link>
                        {league.isAdmin && league.status === "setup" && (
                          <button
                            onClick={() =>
                              handleRemoveParticipant(participant._id)
                            }
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {participants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No participants yet</p>
              {league.isAdmin && (
                <p className="text-sm text-gray-400 mt-2">
                  Share the join code to invite participants
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
