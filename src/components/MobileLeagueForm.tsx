import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface MobileLeagueFormProps {
  onLeagueSelected: (leagueId: string) => void;
}

export function MobileLeagueForm({ onLeagueSelected }: MobileLeagueFormProps) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create League State
  const [leagueName, setLeagueName] = useState("");
  const [seasonYear, setSeasonYear] = useState(2025);
  const [isCreating, setIsCreating] = useState(false);

  // Join League State
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
      setLeagueName("");
      onLeagueSelected(leagueId);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsCreating(false);
    }
  };

  const onCreateClick = () => {
    void handleCreateLeague();
  };

  const onJoinClick = () => {
    void handleJoinLeague();
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
      setJoinCode("");
      setDisplayName("");
      onLeagueSelected(result.leagueId);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-3 px-4 rounded-md font-medium text-base transition-colors min-h-[44px] ${
            activeTab === "create"
              ? "bg-background text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          🏈 Create League
        </button>
        <button
          onClick={() => setActiveTab("join")}
          className={`flex-1 py-3 px-4 rounded-md font-medium text-base transition-colors min-h-[44px] ${
            activeTab === "join"
              ? "bg-background text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          🎯 Join League
        </button>
      </div>

      {/* Create League Form */}
      {activeTab === "create" && (
        <div className="bg-blue-50 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Create New League
            </h2>
            <p className="text-blue-700 text-base">
              Start a new NFL pool league and invite your friends to join.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-base font-medium text-blue-900 mb-2">
                League Name
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="e.g., Office Pool 2025"
                className="w-full px-4 py-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-blue-900 mb-2">
                Season Year
              </label>
              <select
                value={seasonYear}
                onChange={(e) => setSeasonYear(parseInt(e.target.value))}
                className="w-full px-4 py-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <button
              onClick={onCreateClick}
              disabled={isCreating || !leagueName.trim()}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                  Creating League...
                </div>
              ) : (
                "Create League"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Join League Form */}
      {activeTab === "join" && (
        <div className="bg-green-50 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Join Existing League
            </h2>
            <p className="text-green-700 text-base">
              Join a league using a 6-character join code from the league admin.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-base font-medium text-green-900 mb-2">
                Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-4 border border-green-200 dark:border-green-800 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-center text-xl tracking-widest min-h-[44px]"
                inputMode="text"
                autoCapitalize="characters"
              />
            </div>

            {leagueByJoinCode && (
              <div className="p-4 bg-background rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {leagueByJoinCode.name}
                </h4>
                <p className="text-base text-gray-600">
                  Season {leagueByJoinCode.seasonYear} •{" "}
                  {leagueByJoinCode.participantCount}/8 participants
                </p>
                {!leagueByJoinCode.canJoin && (
                  <p className="text-base text-red-600 mt-2">
                    {leagueByJoinCode.participantCount >= 8
                      ? "League is full"
                      : "Draft has already started"}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-base font-medium text-green-900 mb-2">
                Your Team Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., John's Team"
                className="w-full px-4 py-4 border border-green-200 dark:border-green-800 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base min-h-[44px]"
                maxLength={30}
                autoComplete="off"
              />
            </div>

            <button
              onClick={onJoinClick}
              disabled={
                isJoining ||
                !joinCode.trim() ||
                !displayName.trim() ||
                (leagueByJoinCode !== null &&
                  leagueByJoinCode !== undefined &&
                  !leagueByJoinCode.canJoin)
              }
              className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
            >
              {isJoining ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                  Joining League...
                </div>
              ) : (
                "Join League"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
