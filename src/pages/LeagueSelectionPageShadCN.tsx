import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { normalizeJoinCode, JOIN_CODE_LENGTH } from "../utils/joinCodeUtils";
import { toast } from "sonner";
import { useLeagueContext } from "../contexts/LeagueContext";
import { useTheme } from "../contexts/ThemeContext";
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
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { DraftCountdown } from "../components/DraftCountdown";
import { EmptyLeaguesState } from "../components/EmptyLeaguesState";
import { SignOutButton } from "../SignOutButton";
import { UserMenu } from "../components/UserMenu";

export function LeagueSelectionPageShadCN() {
  const leagues = useQuery(api.leagues.getUserLeagues);
  const currentUser = useQuery(api.users.getCurrentUser);
  const { setSelectedLeagueId } = useLeagueContext();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [seasonYear, setSeasonYear] = useState("2025");
  const [scheduledDraftDate, setScheduledDraftDate] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const createLeague = useMutation(api.leagues.createLeague);
  const joinLeague = useMutation(api.leagues.joinLeague);
  const autoJoinLeague = useMutation(api.leagues.autoJoinLeague);
  const joinAsSpectator = useMutation(api.spectators.joinAsSpectator);
  const leagueByJoinCode = useQuery(
    api.leagues.getLeagueByJoinCode,
    joinCode.length === 6 ? { joinCode } : "skip",
  );

  // Calculate minimum local datetime for datetime-local input (client-only to avoid SSR mismatch)
  const [minLocalDatetime, setMinLocalDatetime] = useState<string>();
  useEffect(() => {
    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setMinLocalDatetime(localTime.toISOString().slice(0, 16));
  }, []);

  // Handle joinCode from URL or sessionStorage after authentication
  useEffect(() => {
    // Check URL parameters first
    const searchParams = new URLSearchParams(location.search);
    const urlJoinCode = searchParams.get("joinCode");
    
    // Check sessionStorage as fallback
    const storedJoinCode = sessionStorage.getItem("pendingJoinCode");
    
    // Use URL joinCode if present, otherwise use stored joinCode
    const pendingJoinCode = normalizeJoinCode(urlJoinCode) || normalizeJoinCode(storedJoinCode);
    
    if (pendingJoinCode) {
      // Clear from sessionStorage and URL immediately to avoid reusing
      sessionStorage.removeItem("pendingJoinCode");
      if (urlJoinCode) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("joinCode");
        window.history.replaceState({}, "", newUrl.toString());
      }
      
      // Automatically join the league with default team name
      handleAutoJoin(pendingJoinCode);
    }
  }, [location.search]);

  const handleAutoJoin = async (joinCode: string) => {
    setIsJoining(true);
    toast.info(`Joining league with code: ${joinCode}...`, {
      duration: 2000,
    });
    
    try {
      const result = await autoJoinLeague({ joinCode });
      
      if (result.success) {
        if (result.alreadyJoined) {
          toast.info("You're already a member of this league!");
        } else {
          toast.success(`Successfully joined the league as "${result.displayName}"! You can edit your team name later.`, {
            duration: 4000,
          });
        }
        
        // Navigate to the league page
        setSelectedLeagueId(result.leagueId);
      } else {
        toast.error("Failed to join league automatically. Please try again manually.");
        // Fallback: show join form
        setJoinCode(joinCode);
        setShowJoinForm(true);
      }
    } catch (error) {
      console.error("Auto-join error:", error);
      toast.error(String(error));
      // Fallback: show join form with pre-filled code
      setJoinCode(joinCode);
      setShowJoinForm(true);
      toast.info("Please enter your team name to complete joining the league.");
    } finally {
      setIsJoining(false);
    }
  };

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
        teamName: teamName.trim() || undefined,
      });
      toast.success("League created successfully!");
      setShowCreateForm(false);
      setLeagueName("");
      setScheduledDraftDate("");
      setTeamName("");
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

  const handleJoinAsSpectator = async () => {
    if (!joinCode.trim() || !displayName.trim()) {
      toast.error("Please enter both join code and display name");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinAsSpectator({
        joinCode: joinCode.trim().toUpperCase(),
        displayName: displayName.trim(),
      });
      toast.success("Successfully joined league as spectator!");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"}
              alt="LowEffort.bet Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">LowEffort.bet</span>
          </div>
          <div className="flex items-center space-x-2">
            {currentUser?.isSuperuser && (
              <Button
                onClick={() => navigate("/system-admin")}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                System Admin
              </Button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 pb-20">

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
        <EmptyLeaguesState 
          onCreateLeague={() => setShowCreateForm(true)}
          onJoinLeague={() => setShowJoinForm(true)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create League Section */}
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Plus className="h-5 w-5" />
              Create New League
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showCreateForm ? (
              <div className="space-y-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Start a new NFL pool league and invite your friends to join.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
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
                  <Label htmlFor="team-name">Your Team Name (Optional)</Label>
                  <Input
                    id="team-name"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g., The Champions"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If left blank, your email will be used as your team name.
                  </p>
                </div>

                <div>
                  <Label htmlFor="draft-date">Scheduled Draft Date (Optional)</Label>
                  <Input
                    id="draft-date"
                    type="datetime-local"
                    value={scheduledDraftDate}
                    onChange={(e) => setScheduledDraftDate(e.target.value)}
                    min={minLocalDatetime ?? undefined}
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
                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    {isCreating ? "Creating..." : "Create League"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setLeagueName("");
                      setScheduledDraftDate("");
                      setTeamName("");
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
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              Join Existing League
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showJoinForm ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Join a league using a 6-character join code from the league
                  admin.
                </p>
                <Button
                  onClick={() => setShowJoinForm(true)}
                  variant="default"
                  className="w-full"
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
                    maxLength={JOIN_CODE_LENGTH}
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {leagueByJoinCode.participantCount >= 8
                            ? "League is full - you can join as a spectator"
                            : "Draft has already started - you can join as a spectator"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label htmlFor="team-name">
                    {leagueByJoinCode && !leagueByJoinCode.canJoin ? "Your Display Name" : "Your Team Name"}
                  </Label>
                  <Input
                    id="team-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={leagueByJoinCode && !leagueByJoinCode.canJoin ? "e.g., John" : "e.g., John's Team"}
                  />
                </div>

                <Separator />

                <div className="flex gap-3">
                  {leagueByJoinCode && !leagueByJoinCode.canJoin ? (
                    <Button
                      onClick={handleJoinAsSpectator}
                      disabled={
                        isJoining ||
                        !joinCode.trim() ||
                        !displayName.trim()
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {isJoining ? "Joining..." : "Join as Spectator"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinLeague}
                      disabled={
                        isJoining ||
                        !joinCode.trim() ||
                        !displayName.trim() ||
                        (leagueByJoinCode && !leagueByJoinCode.canJoin)
                      }
                      className="flex-1"
                    >
                      {isJoining ? "Joining..." : "Join League"}
                    </Button>
                  )}
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
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container text-left md:text-center">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-start sm:items-center text-sm text-muted-foreground">
              <button
                onClick={() => navigate("/terms")}
                className="text-primary hover:underline"
              >
                Terms of Service & Privacy Policy
              </button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Created & Maintained by{" "}
                <a 
                  href="https://LongHairedFreakyPeople.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Long Haired Freaky People
                </a>
              </p>
              <p>
                Contact:{" "}
                <a 
                  href="mailto:Joey@LHFP.help"
                  className="text-primary hover:underline"
                >
                  Joey@LHFP.help
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
