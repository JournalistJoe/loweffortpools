import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { UserPlus, Eye, Trash2 } from "lucide-react";

export function ParticipantsPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  
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
  const adminJoinOwnLeague = useMutation(api.leagues.adminJoinOwnLeague);

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

  const handleAdminJoin = async () => {
    if (!leagueId || !teamName.trim()) return;

    try {
      await adminJoinOwnLeague({
        leagueId: leagueId as any,
        displayName: teamName.trim(),
      });
      toast.success("Successfully joined the league!");
      setShowJoinForm(false);
      setTeamName("");
    } catch (error) {
      toast.error(String(error));
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

        {/* Admin Join Section */}
        {league.isAdmin && !league.isParticipant && league.status === "setup" && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <UserPlus className="h-5 w-5" />
                Join as Participant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showJoinForm ? (
                <div className="space-y-4">
                  <p className="text-blue-700">
                    You're the admin of this league but not yet a participant. 
                    Join the league to participate in the draft!
                  </p>
                  <Button 
                    onClick={() => setShowJoinForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Join League as Participant
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="team-name" className="block text-sm font-medium text-blue-800 mb-2">
                      Enter your team name:
                    </label>
                    <Input
                      id="team-name"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Your team name"
                      className="max-w-md"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdminJoin();
                        if (e.key === "Escape") {
                          setShowJoinForm(false);
                          setTeamName("");
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAdminJoin}
                      disabled={!teamName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Join League
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowJoinForm(false);
                        setTeamName("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                            title="View Team"
                          >
                            <Link to={`/league/${leagueId}/team/${participant._id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {league.isAdmin && league.status === "setup" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveParticipant(participant._id)
                              }
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                              title="Remove Participant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
