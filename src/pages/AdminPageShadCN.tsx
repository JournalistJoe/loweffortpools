import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
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
  UserPlus,
  Edit,
  Save,
  X,
  Trash2,
  Play,
  Code2,
  Users,
  Trophy,
  Shield,
  Shuffle,
  Bot,
} from "lucide-react";

function formatLocalForDateTimeLocal(d: Date) {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

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
  const spectators = useQuery(
    api.spectators.getSpectators,
    leagueId ? { leagueId: leagueId as any } : "skip",
  );
  const [draftPosition, setDraftPosition] = useState("1");
  const [editingParticipant, setEditingParticipant] = useState<string | null>(
    null,
  );
  const [newPosition, setNewPosition] = useState("1");
  const [editingTeamName, setEditingTeamName] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [showAdminJoinForm, setShowAdminJoinForm] = useState(false);
  const [adminTeamName, setAdminTeamName] = useState("");
  const [editingLeague, setEditingLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [scheduledDraftDate, setScheduledDraftDate] = useState("");
  const [draftPickTimeLimit, setDraftPickTimeLimit] = useState("180");
  const [showAddAdminTeam, setShowAddAdminTeam] = useState(false);
  const [adminManagedTeamName, setAdminManagedTeamName] = useState("");
  const [adminManagedDraftPosition, setAdminManagedDraftPosition] = useState("1");

  const startDraft = useMutation(api.leagues.startDraft);
  const removeParticipant = useMutation(api.leagues.removeParticipant);
  const updateParticipantPosition = useMutation(
    api.leagues.updateParticipantPosition,
  );
  const updateParticipantDisplayName = useMutation(
    api.leagues.updateParticipantDisplayName,
  );
  const randomizeParticipantOrder = useMutation(
    api.leagues.randomizeParticipantOrder,
  );
  const adminJoinOwnLeague = useMutation(api.leagues.adminJoinOwnLeague);
  const resetDraft = useMutation(api.leagues.resetDraft);
  const updateLeague = useMutation(api.leagues.updateLeague);
  const deleteLeague = useMutation(api.leagues.deleteLeague);
  const regenerateJoinCode = useMutation(api.leagues.regenerateJoinCode);
  const removeSpectator = useMutation(api.spectators.removeSpectator);
  const addAdminManagedTeam = useMutation(api.leagues.addAdminManagedTeam);


  const handleStartDraft = async () => {
    if (!leagueId) return;
    try {
      await startDraft({ leagueId: leagueId as any });
      toast.success("Draft started!");
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

  const handleUpdateTeamName = async (participantId: string) => {
    if (!leagueId || !newTeamName.trim()) return;
    try {
      await updateParticipantDisplayName({
        leagueId: leagueId as any,
        participantId: participantId as any,
        newDisplayName: newTeamName.trim(),
      });
      toast.success("Team name updated successfully");
      setEditingTeamName(null);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleRandomizeOrder = async () => {
    if (!leagueId) return;
    if (
      !confirm(
        "Are you sure you want to randomize the draft order? This will reassign all participant positions randomly.",
      )
    )
      return;
    
    try {
      await randomizeParticipantOrder({
        leagueId: leagueId as any,
      });
      toast.success("Draft order randomized successfully");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleAddAdminManagedTeam = async () => {
    if (!leagueId || !adminManagedTeamName.trim()) return;
    try {
      await addAdminManagedTeam({
        leagueId: leagueId as any,
        displayName: adminManagedTeamName.trim(),
        draftPosition: parseInt(adminManagedDraftPosition),
      });
      toast.success("Admin-managed team added successfully");
      setShowAddAdminTeam(false);
      setAdminManagedTeamName("");
      setAdminManagedDraftPosition("1");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleAdminJoinLeague = async () => {
    if (!leagueId || !adminTeamName.trim()) return;

    try {
      await adminJoinOwnLeague({
        leagueId: leagueId as any,
        displayName: adminTeamName.trim(),
      });
      toast.success("Successfully joined the league!");
      setShowAdminJoinForm(false);
      setAdminTeamName("");
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
        draftPickTimeLimit: parseInt(draftPickTimeLimit) * 1000, // Convert seconds to milliseconds
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
                      min={formatLocalForDateTimeLocal(new Date())}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Draft Pick Time Limit</Label>
                  {editingLeague ? (
                    <Select value={draftPickTimeLimit} onValueChange={setDraftPickTimeLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="180">3 minutes (default)</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 text-sm text-foreground">
                      {(() => {
                        const totalSeconds = (league.draftPickTimeLimit || 180000) / 1000;
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                        
                        if (minutes > 0 && seconds > 0) {
                          return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
                        } else if (minutes > 0) {
                          return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                        } else {
                          return `${seconds} second${seconds !== 1 ? 's' : ''}`;
                        }
                      })()}
                    </p>
                  )}
                </div>
                <div></div>
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
                        setDraftPickTimeLimit(String((league.draftPickTimeLimit || 180000) / 1000));
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


          {/* Participant Management */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({participants?.length || 0}/8)
                </CardTitle>
                {participants && participants.length > 1 && league.status === "setup" && (
                  <Button
                    onClick={handleRandomizeOrder}
                    size="sm"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Shuffle className="h-4 w-4" />
                    Randomize Draft Order
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Admin Join Section */}
              {!league.isParticipant && league.status === "setup" && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Join as Participant</span>
                  </div>
                  {!showAdminJoinForm ? (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        You're not yet a participant in your own league. Join to participate in the draft!
                      </p>
                      <Button 
                        onClick={() => setShowAdminJoinForm(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Join League as Participant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        value={adminTeamName}
                        onChange={(e) => setAdminTeamName(e.target.value)}
                        placeholder="Enter your team name"
                        className="max-w-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAdminJoinLeague();
                          if (e.key === "Escape") {
                            setShowAdminJoinForm(false);
                            setAdminTeamName("");
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAdminJoinLeague}
                          disabled={!adminTeamName.trim()}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Join League
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowAdminJoinForm(false);
                            setAdminTeamName("");
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {participants && participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant._id}
                      className="group flex flex-col sm:flex-row sm:justify-between gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {editingTeamName === participant._id ? (
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Input
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                              placeholder="Team name"
                              className="font-medium"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateTeamName(participant._id);
                                if (e.key === "Escape") setEditingTeamName(null);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">
                              {participant.displayName}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingTeamName(participant._id);
                                setNewTeamName(participant.displayName);
                              }}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {editingParticipant === participant._id ? (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Position:</Label>
                            <Select
                              value={newPosition}
                              onValueChange={setNewPosition}
                            >
                              <SelectTrigger className="w-16 sm:w-20">
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Position {participant.draftPosition}
                            </Badge>
                            {participant.isAdminManaged && (
                              <Badge variant="secondary" className="gap-1">
                                <Bot className="h-3 w-3" />
                                Admin Managed
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {league.status === "setup" && (
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          {editingTeamName === participant._id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTeamName(participant._id)}
                                className="gap-1 flex-1 sm:flex-initial"
                              >
                                <Save className="h-3 w-3" />
                                Save Team Name
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingTeamName(null)}
                                className="gap-1 flex-1 sm:flex-initial"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </>
                          ) : editingParticipant === participant._id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdatePosition(participant._id)
                                }
                                className="gap-1 flex-1 sm:flex-initial"
                              >
                                <Save className="h-3 w-3" />
                                Save Position
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingParticipant(null)}
                                className="gap-1 flex-1 sm:flex-initial"
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
                                className="gap-1 flex-1 sm:flex-initial"
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
                                className="gap-1 flex-1 sm:flex-initial"
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


              {/* Add Admin-Managed Team Form */}
              {showAddAdminTeam && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Add Admin-Managed Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Team Name</Label>
                      <Input
                        value={adminManagedTeamName}
                        onChange={(e) => setAdminManagedTeamName(e.target.value)}
                        placeholder="Admin team name (e.g., CPU Team 1)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAdminManagedTeam();
                          if (e.key === "Escape") {
                            setShowAddAdminTeam(false);
                            setAdminManagedTeamName("");
                            setAdminManagedDraftPosition("1");
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Label>Draft Position</Label>
                      <Select
                        value={adminManagedDraftPosition}
                        onValueChange={setAdminManagedDraftPosition}
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
                        onClick={handleAddAdminManagedTeam}
                        disabled={!adminManagedTeamName.trim()}
                        className="gap-2"
                      >
                        <Bot className="h-4 w-4" />
                        Add Team
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddAdminTeam(false);
                          setAdminManagedTeamName("");
                          setAdminManagedDraftPosition("1");
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

              {/* Add Admin-Managed Team Action */}
              {league.status === "setup" && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowAddAdminTeam(true)}
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Bot className="h-4 w-4" />
                    Add Admin-Managed Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spectators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Spectators ({spectators?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spectators && spectators.length > 0 ? (
                <div className="space-y-3">
                  {spectators.map((spectator) => (
                    <div key={spectator._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium">{spectator.displayName}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Remove ${spectator.displayName} as spectator?`)) {
                            try {
                              await removeSpectator({ 
                                leagueId: leagueId as any,
                                spectatorId: spectator._id as any
                              });
                              toast.success("Spectator removed");
                            } catch (error) {
                              toast.error(String(error));
                            }
                          }
                        }}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No spectators yet. Users can join as spectators when the league is full.
                </p>
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
