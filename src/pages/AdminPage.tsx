import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";

export function AdminPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const league = useQuery(
    api.leagues.getLeague,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const participants = useQuery(
    api.leagues.getParticipants,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const allUsers = useQuery(api.leagues.getAllUsers);
  const [isImporting, setIsImporting] = useState(false);
  const [syncWeek, setSyncWeek] = useState(1);
  const [isResyncing, setIsResyncing] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [draftPosition, setDraftPosition] = useState(1);
  const [editingParticipant, setEditingParticipant] = useState<string | null>(
    null,
  );
  const [newPosition, setNewPosition] = useState(1);
  const [editingLeague, setEditingLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");

  const importTeams = useMutation(api.nflData.importTeams);
  const startDraft = useMutation(api.leagues.startDraft);
  const manualResync = useMutation(api.nflData.manualResync);
  const addParticipant = useMutation(api.leagues.addParticipant);
  const removeParticipant = useMutation(api.leagues.removeParticipant);
  const updateParticipantPosition = useMutation(
    api.leagues.updateParticipantPosition,
  );
  const resetDraft = useMutation(api.leagues.resetDraft);
  const updateLeague = useMutation(api.leagues.updateLeague);
  const deleteLeague = useMutation(api.leagues.deleteLeague);
  const regenerateJoinCode = useMutation(api.leagues.regenerateJoinCode);

  const handleImportTeams = async () => {
    setIsImporting(true);
    try {
      const result = await importTeams({
        seasonYear: league?.seasonYear || 2025,
      });
      toast.success(`Imported ${result.imported} NFL teams`);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsImporting(false);
    }
  };

  const handleStartDraft = async () => {
    if (!leagueId) return;
    try {
      await startDraft({ leagueId: leagueId as any });
      toast.success("Draft started!");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleManualResync = async () => {
    setIsResyncing(true);
    try {
      await manualResync({ week: syncWeek });
      toast.success(`Resynced week ${syncWeek} successfully`);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsResyncing(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!leagueId || !selectedUserId || !displayName) return;
    try {
      await addParticipant({
        leagueId: leagueId as any,
        userId: selectedUserId as any,
        displayName,
        draftPosition,
      });
      toast.success("Participant added successfully");
      setShowAddParticipant(false);
      setSelectedUserId("");
      setDisplayName("");
      setDraftPosition(1);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!leagueId) return;
    if (!confirm("Are you sure you want to remove this participant?")) return;
    try {
      await removeParticipant({
        leagueId: leagueId as any,
        participantId: participantId as any,
      });
      toast.success("Participant removed successfully");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleUpdatePosition = async (participantId: string) => {
    if (!leagueId) return;
    try {
      await updateParticipantPosition({
        leagueId: leagueId as any,
        participantId: participantId as any,
        newDraftPosition: newPosition,
      });
      toast.success("Position updated successfully");
      setEditingParticipant(null);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleResetDraft = async () => {
    if (!leagueId) return;
    if (
      !confirm(
        "Are you sure you want to reset the draft? This will delete all picks and return to setup mode.",
      )
    )
      return;
    try {
      await resetDraft({ leagueId: leagueId as any });
      toast.success("Draft reset successfully!");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleUpdateLeague = async () => {
    if (!leagueId || !newLeagueName.trim()) return;
    try {
      await updateLeague({
        leagueId: leagueId as any,
        name: newLeagueName.trim(),
      });
      toast.success("League updated successfully");
      setEditingLeague(false);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleDeleteLeague = async () => {
    if (!leagueId) return;
    if (
      !confirm(
        "Are you sure you want to delete this league? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteLeague({ leagueId: leagueId as any });
      toast.success("League deleted successfully");
      // Navigate back to leagues page will be handled by the context
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleRegenerateJoinCode = async () => {
    if (!leagueId) return;
    if (
      !confirm(
        "Are you sure you want to regenerate the join code? The old code will no longer work.",
      )
    )
      return;
    try {
      const newCode = await regenerateJoinCode({ leagueId: leagueId as any });
      toast.success(`New join code generated: ${newCode}`);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const copyJoinCode = () => {
    if (league?.joinCode) {
      navigator.clipboard.writeText(league.joinCode);
      toast.success("Join code copied to clipboard!");
    }
  };

  const getAvailablePositions = () => {
    if (!participants) return [1, 2, 3, 4, 5, 6, 7, 8];
    const takenPositions = participants.map((p) => p.draftPosition);
    return [1, 2, 3, 4, 5, 6, 7, 8].filter(
      (pos) => !takenPositions.includes(pos),
    );
  };

  if (!league?.isAdmin) {
    return (
      <div>
        {league && <Navigation league={league} />}
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You must be an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation league={league} />
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">
                Manage the {league.name || "Unnamed League"} league
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* League Management */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">League Settings</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                {editingLeague ? (
                  <input
                    type="text"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {league.name || "Unnamed League"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    league.status === "setup"
                      ? "bg-yellow-100 text-yellow-800"
                      : league.status === "draft"
                        ? "bg-blue-100 text-blue-800"
                        : league.status === "live"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {league.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Join Code Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Code
              </label>
              <div className="flex items-center space-x-3">
                <code className="px-3 py-2 bg-gray-100 rounded font-mono text-lg">
                  {league.joinCode}
                </code>
                <button
                  onClick={copyJoinCode}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Copy
                </button>
                <button
                  onClick={handleRegenerateJoinCode}
                  className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Share this code with players so they can join your league
              </p>
            </div>

            <div className="flex space-x-3">
              {editingLeague ? (
                <>
                  <button
                    onClick={handleUpdateLeague}
                    disabled={!newLeagueName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingLeague(false);
                      setNewLeagueName("");
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingLeague(true);
                      setNewLeagueName(league.name || "");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Edit League
                  </button>
                  {league.status === "setup" && (
                    <button
                      onClick={handleDeleteLeague}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Delete League
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <div className="space-y-4">
              <div>
                <button
                  onClick={handleImportTeams}
                  disabled={isImporting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import NFL Teams (${league.seasonYear})`}
                </button>
                <p className="text-sm text-gray-600 mt-1">
                  Import all 32 NFL teams for the {league.seasonYear} season
                </p>
              </div>

              <div className="flex items-end space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week to Resync
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={syncWeek}
                    onChange={(e) => setSyncWeek(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleManualResync}
                  disabled={isResyncing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResyncing ? "Resyncing..." : "Manual Resync"}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Manually sync game results for a specific week
              </p>
            </div>
          </div>

          {/* Participant Management */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Participants ({participants?.length || 0}/8)
              </h2>
              {(participants?.length || 0) < 8 && league.status === "setup" && (
                <button
                  onClick={() => setShowAddParticipant(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Participant
                </button>
              )}
            </div>

            {participants && participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant._id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">
                        {participant.displayName}
                      </span>
                      {editingParticipant === participant._id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Position:
                          </span>
                          <select
                            value={newPosition}
                            onChange={(e) =>
                              setNewPosition(parseInt(e.target.value))
                            }
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value={participant.draftPosition}>
                              {participant.draftPosition}
                            </option>
                            {getAvailablePositions().map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">
                          Position {participant.draftPosition}
                        </span>
                      )}
                    </div>

                    {league.status === "setup" && (
                      <div className="flex items-center space-x-2">
                        {editingParticipant === participant._id ? (
                          <>
                            <button
                              onClick={() =>
                                handleUpdatePosition(participant._id)
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingParticipant(null)}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingParticipant(participant._id);
                                setNewPosition(participant.draftPosition);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Edit Position
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveParticipant(participant._id)
                              }
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No participants yet.</p>
                <p className="text-sm text-gray-500">
                  Share the join code{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                    {league.joinCode}
                  </code>{" "}
                  with players so they can join!
                </p>
              </div>
            )}

            {/* Add Participant Form */}
            {showAddParticipant && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h3 className="font-medium mb-3">Add Participant (Admin)</h3>
                <div className="space-y-3">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Choose user...</option>
                    {allUsers?.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Team name"
                    className="w-full p-2 border rounded"
                  />
                  <select
                    value={draftPosition}
                    onChange={(e) => setDraftPosition(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  >
                    {getAvailablePositions().map((pos) => (
                      <option key={pos} value={pos}>
                        Position {pos}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddParticipant}
                      disabled={!selectedUserId || !displayName}
                      className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddParticipant(false);
                        setSelectedUserId("");
                        setDisplayName("");
                        setDraftPosition(1);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Draft Management */}
          {league?.status === "setup" && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Draft Management</h2>
              <div className="space-y-4">
                <button
                  onClick={handleStartDraft}
                  disabled={(participants?.length || 0) !== 8}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Draft
                </button>
                <p className="text-sm text-gray-600">
                  Start the draft once all 8 participants are added with their
                  draft positions set.
                  {(participants?.length || 0) !== 8 && (
                    <span className="text-red-600 block">
                      Need {8 - (participants?.length || 0)} more participants
                      to start.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Reset Draft */}
          {(league?.status === "draft" || league?.status === "live") && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Reset Draft (Testing)
              </h2>
              <div className="space-y-4">
                <button
                  onClick={handleResetDraft}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  Reset Draft
                </button>
                <p className="text-sm text-gray-600">
                  Reset the draft back to setup mode. This will delete all picks
                  and allow you to start over.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
