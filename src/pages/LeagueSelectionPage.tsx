import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { useLeagueContext } from "../contexts/LeagueContext";
import { JOIN_CODE_LENGTH } from "../utils/joinCodeUtils";

export function LeagueSelectionPage() {
  const leagues = useQuery(api.leagues.getUserLeagues);
  const { setSelectedLeagueId } = useLeagueContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [seasonYear, setSeasonYear] = useState(2025);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const createLeague = useMutation(api.leagues.createLeague);
  const joinLeague = useMutation(api.leagues.joinLeague);
  const leagueByJoinCode = useQuery(
    api.leagues.getLeagueByJoinCode,
    joinCode.length === 6 ? { joinCode } : "skip",
  );

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error("Please enter a league name");
      return;
    }

    setIsCreating(true);
    try {
      const leagueId = await createLeague({
        name: leagueName.trim(),
        seasonYear,
      });
      toast.success("League created successfully!");
      setShowCreateForm(false);
      setLeagueName("");
      setSelectedLeagueId(leagueId);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLeague = async () => {
    if (!joinCode.trim() || !displayName.trim()) {
      toast.error("Please enter both join code and team name");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinLeague({
        joinCode: joinCode.trim().toUpperCase(),
        displayName: displayName.trim(),
      });
      toast.success("Successfully joined league!");
      setShowJoinForm(false);
      setJoinCode("");
      setDisplayName("");
      setSelectedLeagueId(result.leagueId);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectLeague = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
  };

  if (leagues === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Leagues</h1>
        <p className="text-muted-foreground">
          Select a league to manage or participate in
        </p>
      </div>

      {leagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {leagues.map((league) => (
            <div
              key={league._id}
              className="bg-card rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-border"
              onClick={() => handleSelectLeague(league._id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {league.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Season {league.seasonYear}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        league.status === "setup"
                          ? "bg-yellow-100 text-yellow-800"
                          : league.status === "draft"
                            ? "bg-blue-100 text-blue-800"
                            : league.status === "live"
                              ? "bg-green-100 text-green-800"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {league.status.toUpperCase()}
                    </span>
                    {league.isAdmin && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {league.isParticipant && league.participant && (
                    <p>Team: {league.participant.displayName}</p>
                  )}
                  {!league.isParticipant && !league.isAdmin && <p>Spectator</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No leagues found
          </h2>
          <p className="text-muted-foreground mb-6">
            Create your first league or join an existing one with a join code.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create League Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            Create New League
          </h2>

          {!showCreateForm ? (
            <div>
              <p className="text-sm text-blue-800 mb-4">
                Start a new NFL pool league and invite your friends to join.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create League
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  League Name
                </label>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="e.g., Office Pool 2025"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Season Year
                </label>
                <select
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateLeague}
                  disabled={isCreating || !leagueName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create League"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setLeagueName("");
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Join League Section */}
        <div className="bg-green-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            Join Existing League
          </h2>

          {!showJoinForm ? (
            <div>
              <p className="text-sm text-green-800 mb-4">
                Join a league using a 6-character join code from the league
                admin.
              </p>
              <button
                onClick={() => setShowJoinForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Join League
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-900 mb-1">
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={JOIN_CODE_LENGTH}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 font-mono text-center text-lg"
                />
              </div>

              {leagueByJoinCode && (
                <div className="p-3 bg-card rounded border border-border">
                  <h4 className="font-medium text-foreground">
                    {leagueByJoinCode.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Season {leagueByJoinCode.seasonYear} •{" "}
                    {leagueByJoinCode.participantCount}/8 participants
                  </p>
                  {!leagueByJoinCode.canJoin && (
                    <p className="text-sm text-red-600 mt-1">
                      {leagueByJoinCode.participantCount >= 8
                        ? "League is full"
                        : "Draft has already started"}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-green-900 mb-1">
                  Your Team Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., John's Team"
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleJoinLeague}
                  disabled={
                    isJoining ||
                    !joinCode.trim() ||
                    !displayName.trim() ||
                    (leagueByJoinCode && !leagueByJoinCode.canJoin) ||
                    false
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? "Joining..." : "Join League"}
                </button>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinCode("");
                    setDisplayName("");
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
