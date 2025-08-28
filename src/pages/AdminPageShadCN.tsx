import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { MobileNavigationShadCN as Navigation } from "../components/MobileNavigationShadCN";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import {
  Settings,
  Copy,
  RotateCcw,
  Download,
  RefreshCw,
  UserPlus,
  Edit,
  Save,
  X,
  Trash2,
  Play,
  Code2,
  Users,
  Database,
  Trophy,
  Shield,
  TestTube,
} from "lucide-react";

export function AdminPageShadCN() {
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
  const [syncWeek, setSyncWeek] = useState("1");
  const [isResyncing, setIsResyncing] = useState(false);
  const [isCreatingTestLeague, setIsCreatingTestLeague] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [draftPosition, setDraftPosition] = useState("1");
  const [editingParticipant, setEditingParticipant] = useState<string | null>(
    null,
  );
  const [newPosition, setNewPosition] = useState("1");
  const [editingLeague, setEditingLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [scheduledDraftDate, setScheduledDraftDate] = useState("");

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
  const createTestLeague = useMutation(api.testLeague.createTestLeague);

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
      await manualResync({ week: parseInt(syncWeek) });
      toast.success(`Resynced week ${syncWeek} successfully`);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsResyncing(false);
    }
  };

  const handleCreateTestLeague = async () => {
    setIsCreatingTestLeague(true);
    try {
      const result = await createTestLeague({});
      toast.success(result.message);
      // Navigate to the new test league (optional)
      // window.location.href = `/leagues/${result.leagueId}`;
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsCreatingTestLeague(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!leagueId || !selectedUserId || !displayName) return;
    try {
      await addParticipant({
        leagueId: leagueId as any,
        userId: selectedUserId as any,
        displayName,
        draftPosition: parseInt(draftPosition),
      });
      toast.success("Participant added successfully");
      setShowAddParticipant(false);
      setSelectedUserId("");
      setDisplayName("");
      setDraftPosition("1");
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
        newDraftPosition: parseInt(newPosition),
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
        scheduledDraftDate: scheduledDraftDate ? new Date(scheduledDraftDate).getTime() : undefined,
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "setup":
        return "secondary";
      case "draft":
        return "default";
      case "live":
        return "default";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (!league?.isAdmin) {
    return (
      <div>
        {league && <Navigation league={league} />}
        <div className="max-w-2xl mx-auto text-center py-12">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
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
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage the {league.name || "Unnamed League"} league
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* League Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                League Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  {editingLeague ? (
                    <Input
                      value={newLeagueName}
                      onChange={(e) => setNewLeagueName(e.target.value)}
                      placeholder="League name"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-foreground">
                      {league.name || "Unnamed League"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant={getStatusVariant(league.status)}>
                      {league.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Draft Date</Label>
                  {editingLeague ? (
                    <Input
                      type="datetime-local"
                      value={scheduledDraftDate}
                      onChange={(e) => setScheduledDraftDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  ) : (
                    <p className="mt-2 text-sm text-foreground">
                      {league.scheduledDraftDate
                        ? new Date(league.scheduledDraftDate).toLocaleString()
                        : "Not scheduled"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Season Year</Label>
                  <p className="mt-2 text-sm text-foreground">
                    {league.seasonYear}
                  </p>
                </div>
              </div>

              {/* Join Code Section */}
              <div>
                <Label>Join Code</Label>
                <div className="flex items-center gap-3 mt-2">
                  <code className="px-3 py-2 bg-muted rounded font-mono text-lg flex-1">
                    {league.joinCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyJoinCode}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateJoinCode}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Share this code with players so they can join your league
                </p>
              </div>

              <Separator />

              <div className="flex gap-3">
                {editingLeague ? (
                  <>
                    <Button
                      onClick={handleUpdateLeague}
                      disabled={!newLeagueName.trim()}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingLeague(false);
                        setNewLeagueName("");
                        setScheduledDraftDate("");
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setEditingLeague(true);
                        setNewLeagueName(league.name || "");
                        setScheduledDraftDate(
                          league.scheduledDraftDate
                            ? new Date(league.scheduledDraftDate).toISOString().slice(0, 16)
                            : ""
                        );
                      }}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit League
                    </Button>
                    {league.status === "setup" && (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteLeague}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete League
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button
                  onClick={handleImportTeams}
                  disabled={isImporting}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isImporting
                    ? "Importing..."
                    : `Import NFL Teams (${league.seasonYear})`}
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  Import all 32 NFL teams for the {league.seasonYear} season
                </p>
              </div>

              <Separator />

              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-week">Week to Resync</Label>
                  <Select value={syncWeek} onValueChange={setSyncWeek}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 18 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleManualResync}
                  disabled={isResyncing}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isResyncing ? "Resyncing..." : "Manual Resync"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Manually sync game results for a specific week
              </p>

              <Separator />

              <div>
                <Button
                  onClick={handleCreateTestLeague}
                  disabled={isCreatingTestLeague}
                  variant="outline"
                  className="gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {isCreatingTestLeague ? "Creating..." : "Create Test League"}
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate a complete test league with 8 participants and
                  finished draft for testing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Participant Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({participants?.length || 0}/8)
                </CardTitle>
                {(participants?.length || 0) < 8 &&
                  league.status === "setup" && (
                    <Button
                      onClick={() => setShowAddParticipant(true)}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Participant
                    </Button>
                  )}
              </div>
            </CardHeader>
            <CardContent>
              {participants && participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant._id}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          {participant.displayName}
                        </span>
                        {editingParticipant === participant._id ? (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Position:</Label>
                            <Select
                              value={newPosition}
                              onValueChange={setNewPosition}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value={participant.draftPosition.toString()}
                                >
                                  {participant.draftPosition}
                                </SelectItem>
                                {getAvailablePositions().map((pos) => (
                                  <SelectItem key={pos} value={pos.toString()}>
                                    {pos}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge variant="outline">
                            Position {participant.draftPosition}
                          </Badge>
                        )}
                      </div>

                      {league.status === "setup" && (
                        <div className="flex items-center gap-2">
                          {editingParticipant === participant._id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdatePosition(participant._id)
                                }
                                className="gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingParticipant(null)}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingParticipant(participant._id);
                                  setNewPosition(
                                    participant.draftPosition.toString(),
                                  );
                                }}
                                className="gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit Position
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleRemoveParticipant(participant._id)
                                }
                                className="gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No participants yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Share the join code{" "}
                    <code className="bg-muted px-2 py-1 rounded font-mono">
                      {league.joinCode}
                    </code>{" "}
                    with players so they can join!
                  </p>
                </div>
              )}

              {/* Add Participant Form */}
              {showAddParticipant && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Add Participant (Admin)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Choose User</Label>
                      <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers?.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Team Name</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Team name"
                      />
                    </div>

                    <div>
                      <Label>Draft Position</Label>
                      <Select
                        value={draftPosition}
                        onValueChange={setDraftPosition}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailablePositions().map((pos) => (
                            <SelectItem key={pos} value={pos.toString()}>
                              Position {pos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddParticipant}
                        disabled={!selectedUserId || !displayName}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddParticipant(false);
                          setSelectedUserId("");
                          setDisplayName("");
                          setDraftPosition("1");
                        }}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Draft Management */}
          {league?.status === "setup" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Draft Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleStartDraft}
                  disabled={(participants?.length || 0) !== 8}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Draft
                </Button>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Start the draft once all 8 participants are added with their
                    draft positions set.
                  </p>
                  {(participants?.length || 0) !== 8 && (
                    <p className="text-sm text-destructive">
                      Need {8 - (participants?.length || 0)} more participants
                      to start.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reset Draft */}
          {(league?.status === "draft" || league?.status === "live") && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <RotateCcw className="h-5 w-5" />
                  Reset Draft (Testing)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleResetDraft}
                  variant="outline"
                  className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Draft
                </Button>
                <p className="text-sm text-muted-foreground">
                  Reset the draft back to setup mode. This will delete all picks
                  and allow you to start over.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
