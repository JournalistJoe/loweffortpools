import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Edit, Save, X } from "lucide-react";

export function TeamPage() {
  const { leagueId, participantId } = useParams<{
    leagueId: string;
    participantId: string;
  }>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const teamData = useQuery(
    api.scoring.getParticipantTeams,
    participantId ? { participantId: participantId as any } : "skip",
  );
  const updateDisplayName = useMutation(api.leagues.updateParticipantDisplayName);
  const currentUser = useQuery(api.auth.loggedInUser);

  const handleEditName = () => {
    setNewTeamName(teamData?.participant.displayName || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!leagueId || !participantId || !newTeamName.trim()) return;
    
    try {
      await updateDisplayName({
        leagueId: leagueId as any,
        participantId: participantId as any,
        newDisplayName: newTeamName.trim(),
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update team name:", error);
      alert("Failed to update team name. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewTeamName("");
  };

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

  // Check if current user can edit this participant
  const canEditParticipant = currentUser && teamData && (
    currentUser._id === teamData.participant.userId || 
    currentUser._id === league.adminUserId
  );

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-6xl mx-auto p-4 pb-20">
        {/* Team Settings Section for Setup Phase */}
        {league.status === "setup" && canEditParticipant && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Team Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                {isEditingName ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <Button size="sm" onClick={handleSaveName}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">
                      {teamData.participant.displayName}
                    </span>
                    <Button size="sm" variant="outline" onClick={handleEditName}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Draft Position: {teamData.participant.draftPosition}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Team Data Section for Post-Draft */}
        {league.status !== "setup" && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              {teamData.participant.displayName}'s Teams
            </h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-lg text-muted-foreground">
                Draft Position: {teamData.participant.draftPosition}
              </span>
              <span className="text-lg font-semibold text-blue-600">
                Total Wins: {totalWins}
              </span>
            </div>
          </div>
        )}

        {/* Teams Grid - Only show after draft */}
        {league.status !== "setup" && teamData.teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamData.teams.map((teamInfo) => (
            <div key={teamInfo.team._id} className="bg-card rounded-lg border border-border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {teamInfo.team.fullName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Round {teamInfo.pick.round}, Pick #
                      {teamInfo.pick.pickNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {teamInfo.wins}-{teamInfo.losses}-{teamInfo.ties}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {teamInfo.wins + teamInfo.ties * 0.5} points
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">Schedule</h3>
                  <div className="max-h-64 overflow-y-auto">
                    {teamInfo.games.map((game) => {
                      const opponent = game.isHome ? "vs" : "@";

                      let result = "";
                      let resultClass = "text-muted-foreground";

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
                            <span className="text-muted-foreground">
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
        )}
        
        {/* Setup phase message */}
        {league.status === "setup" && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Your teams will appear here after the draft is completed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
