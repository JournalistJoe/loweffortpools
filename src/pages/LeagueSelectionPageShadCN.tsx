import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLeagueContext } from "../contexts/LeagueContext";
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
  Plus,
  Users,
  Crown,
  Trophy,
  Calendar,
  UserCheck,
  Eye,
} from "lucide-react";
import { DraftCountdown } from "../components/DraftCountdown";

export function LeagueSelectionPageShadCN() {
  const leagues = useQuery(api.leagues.getUserLeagues);
  const { setSelectedLeagueId } = useLeagueContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [seasonYear, setSeasonYear] = useState("2025");
  const [scheduledDraftDate, setScheduledDraftDate] = useState("");
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

  // Calculate minimum local datetime for datetime-local input
  const minLocalDatetime = useMemo(() => {
    const now = new Date();
    const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return localTime.toISOString().slice(0, 16);
  }, []);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error("Please enter a league name");
      return;
    }

    // Parse and validate scheduledDraftDate
    let scheduledDraftMs: number | undefined = undefined;
    if (scheduledDraftDate) {
      scheduledDraftMs = new Date(scheduledDraftDate).getTime();
      if (!isFinite(scheduledDraftMs) || scheduledDraftMs <= Date.now()) {
        toast.error("Please enter a valid future date for the draft");
        setIsCreating(false);
        return;
      }
    }

    setIsCreating(true);
    try {
      const leagueId = await createLeague({
        name: leagueName.trim(),
        seasonYear: parseInt(seasonYear),
        scheduledDraftDate: scheduledDraftMs,
      });
      toast.success("League created successfully!");
      setShowCreateForm(false);
      setLeagueName("");
      setScheduledDraftDate("");
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

  if (leagues === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <div className="mb-8 text-center">
        <img 
          src="/lowEffortLogo.png" 
          alt="LowEffort.bet Logo" 
          className="h-12 w-12 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-foreground mb-2">
          LowEffort.bet
        </h1>
        <p className="text-muted-foreground">
          Select a league to manage or participate in
        </p>
      </div>

      {leagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {leagues.map((league) => (
            <Card
              key={league._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectLeague(league._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{league.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Season {league.seasonYear}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={getStatusVariant(league.status)}>
                      {league.status.toUpperCase()}
                    </Badge>
                    {league.isAdmin && (
                      <Badge variant="outline" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {league.isParticipant && league.participant ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        <span>Team: {league.participant.displayName}</span>
                      </>
                    ) : league.isAdmin ? (
                      <>
                        <Crown className="h-4 w-4" />
                        <span>League Administrator</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Spectator</span>
                      </>
                    )}
                  </div>
                  {league.status === "setup" && league.scheduledDraftDate && (
                    <DraftCountdown
                      scheduledDraftDate={league.scheduledDraftDate}
                      className="text-xs"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-8">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5" />
              Create New League
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showCreateForm ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start a new NFL pool league and invite your friends to join.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full"
                >
                  Create League
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="league-name">League Name</Label>
                  <Input
                    id="league-name"
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="e.g., Office Pool 2025"
                  />
                </div>

                <div>
                  <Label htmlFor="season-year">Season Year</Label>
                  <Select value={seasonYear} onValueChange={setSeasonYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="draft-date">Scheduled Draft Date (Optional)</Label>
                  <Input
                    id="draft-date"
                    type="datetime-local"
                    value={scheduledDraftDate}
                    onChange={(e) => setScheduledDraftDate(e.target.value)}
                    min={minLocalDatetime}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set when you want the draft to begin. You can change this later.
                  </p>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateLeague}
                    disabled={isCreating || !leagueName.trim()}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create League"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setLeagueName("");
                      setScheduledDraftDate("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join League Section */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Users className="h-5 w-5" />
              Join Existing League
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showJoinForm ? (
              <div className="space-y-4">
                <p className="text-sm text-green-700">
                  Join a league using a 6-character join code from the league
                  admin.
                </p>
                <Button
                  onClick={() => setShowJoinForm(true)}
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Join League
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="join-code">Join Code</Label>
                  <Input
                    id="join-code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="font-mono text-center text-lg"
                  />
                </div>

                {leagueByJoinCode && (
                  <Card className="bg-background">
                    <CardContent className="pt-4">
                      <h4 className="font-medium text-foreground">
                        {leagueByJoinCode.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Season {leagueByJoinCode.seasonYear} •{" "}
                        {leagueByJoinCode.participantCount}/8 participants
                      </p>
                      {!leagueByJoinCode.canJoin && (
                        <p className="text-sm text-destructive mt-1">
                          {leagueByJoinCode.participantCount >= 8
                            ? "League is full"
                            : "Draft has already started"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label htmlFor="team-name">Your Team Name</Label>
                  <Input
                    id="team-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., John's Team"
                  />
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={handleJoinLeague}
                    disabled={
                      isJoining ||
                      !joinCode.trim() ||
                      !displayName.trim() ||
                      (leagueByJoinCode && !leagueByJoinCode.canJoin) ||
                      false
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isJoining ? "Joining..." : "Join League"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowJoinForm(false);
                      setJoinCode("");
                      setDisplayName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
