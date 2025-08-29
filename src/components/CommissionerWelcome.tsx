import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Share, Calendar, Users, Crown, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface League {
  _id: string;
  name: string;
  joinCode: string;
  scheduledDraftDate?: number;
  adminUserId: string;
  isAdmin: boolean;
}

interface User {
  username: string;
}

interface CommissionerWelcomeProps {
  league: League;
  currentUser: User | null;
}

export function CommissionerWelcome({ league, currentUser }: CommissionerWelcomeProps) {
  const [showDraftDateInput, setShowDraftDateInput] = useState(false);
  const [scheduledDraftDate, setScheduledDraftDate] = useState("");
  
  const updateLeague = useMutation(api.leagues.updateLeague);
  
  // Calculate minimum local datetime for datetime-local input (client-only to avoid SSR mismatch)
  const [minLocalDatetime, setMinLocalDatetime] = useState<string>();
  useEffect(() => {
    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setMinLocalDatetime(localTime.toISOString().slice(0, 16));
  }, []);
  
  // Default to September 4, 2025 8:00 PM ET (first regular season game)
  const defaultDraftDate = useMemo(() => {
    const septDate = new Date(2025, 8, 4, 20, 0); // September 4, 2025, 8:00 PM
    const localTime = new Date(septDate.getTime() - (septDate.getTimezoneOffset() * 60000));
    return localTime.toISOString().slice(0, 16);
  }, []);

  const handleShareJoinCode = () => {
    navigator.clipboard.writeText(league.joinCode);
    toast.success("Join code copied to clipboard!");
  };

  const handleShareLeagueLink = () => {
    const url = `${window.location.origin}/leagues?joinCode=${league.joinCode}`;
    navigator.clipboard.writeText(url);
    toast.success("League invitation link copied to clipboard!");
  };
  
  const handleSetDraftDate = () => {
    if (!showDraftDateInput) {
      setScheduledDraftDate(league.scheduledDraftDate 
        ? (() => {
            const date = new Date(league.scheduledDraftDate);
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return localDate.toISOString().slice(0, 16);
          })()
        : defaultDraftDate
      );
      setShowDraftDateInput(true);
    } else {
      saveDraftDate();
    }
  };
  
  const saveDraftDate = async () => {
    if (!scheduledDraftDate) {
      toast.error("Please select a draft date");
      return;
    }
    
    const draftMs = new Date(scheduledDraftDate).getTime();
    if (draftMs <= Date.now()) {
      toast.error("Please select a future date for the draft");
      return;
    }
    
    try {
      await updateLeague({
        leagueId: league._id as any,
        name: league.name,
        scheduledDraftDate: draftMs,
      });
      toast.success("Draft date set successfully!");
      setShowDraftDateInput(false);
    } catch (error) {
      toast.error(String(error));
    }
  };
  
  const cancelDraftDate = () => {
    setShowDraftDateInput(false);
    setScheduledDraftDate("");
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {/* Hero Section with Image and Headlines */}
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-8 md:gap-12 items-center mb-12">
        {/* Content Column */}
        <div className="text-left order-2 md:order-1">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Congratulations, Commissioner!
          </h1>
          <h2 className="text-2xl text-muted-foreground mb-6">
            You Did It. You're Now In Charge of... Something.
          </h2>
          
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Welcome to the exclusive club of "people who clicked the create league button." 
              Population: you, sitting alone in your digital kingdom, staring at an empty league 
              like a newly elected mayor of a ghost town.
            </p>
            <p>
              <strong>But hey,</strong> at least you have a fancy title now. Commissioner{" "}
              {currentUser?.username}. Has a nice ring to it, right? Like you actually know 
              what you're doing.
            </p>
          </div>
        </div>

        {/* Image Column */}
        <div className="flex justify-center md:justify-center order-1 md:order-2">
          <img
            src="/league-images/Commisioner_football.png"
            alt="Commissioner Football"
            className="w-48 h-48 md:w-64 md:h-64 object-contain"
          />
        </div>
      </div>

      {/* Commissioner Superpowers Section */}
      <div className="mb-12 text-left">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Your Commissioner Superpowers
          </h2>
          <p className="text-muted-foreground italic">
            Use them wisely (or don't, we're not your boss)
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground text-lg">⚡ You Control Draft Day</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                That's right, YOU get to pick when everyone has to show up and panic-draft 
                NFL teams. Choose wisely - pick a Sunday and watch your friends complain they 
                have "plans." Pick a Tuesday and they'll whine about work. There's no winning, 
                but at least you're in control of the losing.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground text-lg">⚡ You Set the Draft Order</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                When draft day arrives, you decide who picks first and who gets stuck with 
                whatever teams are left after everyone else makes their questionable choices. 
                Power corrupts, use it accordingly.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground text-lg">⚡ You're the Final Authority</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                Disputes? Drama? Someone crying about the scoring system? That's your problem 
                now. Congratulations, you're basically a referee for grown adults arguing 
                about football.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Mission Section */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Your Mission (Should You Choose to Accept It)
        </h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Rally the Troops</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              You need 7 friends to join your league. SEVEN. If you can't find 7 people 
              willing to waste time on this with you, that might be a "you" problem, not 
              a "them" problem.
            </p>
            
            {/* Join Code Card */}
            <Card className="bg-muted/50 mb-6">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Your Join Code:</span>
                  <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
                    {league.joinCode}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleShareJoinCode} variant="outline" size="sm" className="gap-2">
                    <Share className="h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button onClick={handleShareLeagueLink} variant="outline" size="sm" className="gap-2">
                    <Share className="h-4 w-4" />
                    Copy Invite Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">The Recruitment Strategy</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Text the join code</strong> to your group chat and watch it get ignored for 3 days</li>
              <li><strong>Follow up individually</strong> because apparently group accountability is dead</li>
              <li><strong>Guilt them</strong> with phrases like "it'll be fun" and "it's literally free"</li>
              <li><strong>Accept</strong> that at least one person will join 5 minutes before the draft starts</li>
            </ol>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Pro Tips for New Commissioners</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Don't abuse your power</strong> (immediately) - wait until someone really deserves it</li>
              <li><strong>Set realistic expectations</strong> - this is supposed to be low effort, remember?</li>
              <li><strong>Prepare for complaints</strong> - someone will hate the draft time no matter when you pick it</li>
              <li><strong>Have backup friends</strong> - because Dave will definitely bail at the last minute</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What Happens Next Section */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          What Happens Next
        </h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Once you've successfully herded 7 friends into your digital football cage:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
          <li><strong>Set your draft date</strong> (and field the inevitable complaints)</li>
          <li><strong>Send gentle reminders</strong> that turn into increasingly desperate pleas</li>
          <li><strong>Watch the magic happen</strong> on draft day when everyone suddenly cares</li>
          <li><strong>Enjoy your season</strong> of telling people their teams suck</li>
        </ol>
      </div>

      {/* Still Flying Solo Section */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Still Flying Solo?
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Look, we get it. Sometimes recruiting friends is harder than expected. Maybe 
            start with your most gullible friend and work your way up. Or just create a 
            group chat called "FREE MONEY" and post the join code - that usually gets attention.
          </p>
          <p>
            <strong>Remember:</strong> If you can't convince 7 people to join a free app 
            where they pick 4 NFL teams and talk trash for 4 months, you might need to 
            reassess either your friend group or your sales pitch.
          </p>
        </div>
      </div>

      {/* Bottom Line Section */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          The Bottom Line
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          You're the commissioner now. Act like it. Or don't. We're not your mom. But 
          definitely get some friends in here before you start talking to yourself in 
          the league chat.
        </p>
        
        {/* Action Buttons Card */}
        <Card className="text-center">
          <CardContent className="pt-6">
            {showDraftDateInput ? (
              <div className="space-y-4 mb-6">
                <div className="text-left max-w-md mx-auto">
                  <Label htmlFor="draftDate">Draft Date & Time</Label>
                  <Input
                    id="draftDate"
                    type="datetime-local"
                    value={scheduledDraftDate}
                    onChange={(e) => setScheduledDraftDate(e.target.value)}
                    min={minLocalDatetime ?? undefined}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Defaults to Sept 4, 2025 (first regular season game)
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={saveDraftDate} size="sm">
                    Save Draft Date
                  </Button>
                  <Button variant="outline" onClick={cancelDraftDate} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                <Button onClick={handleShareJoinCode} className="gap-2">
                  <Share className="h-4 w-4" />
                  Share Join Code
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleSetDraftDate}>
                  <Calendar className="h-4 w-4" />
                  {league.scheduledDraftDate ? "Update Draft Date" : "Set Draft Date"}
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleShareLeagueLink}>
                  <Users className="h-4 w-4" />
                  Invite Friends
                </Button>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>
                Your league: <strong>{league.name}</strong> | Your code: <Badge variant="outline">{league.joinCode}</Badge> | Your subjects: <strong>0/7</strong>
                {league.scheduledDraftDate && (
                  <span className="block mt-2">
                    Draft: <strong>{new Date(league.scheduledDraftDate).toLocaleString()}</strong>
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}