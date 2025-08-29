import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Share, Calendar, Users, Crown, Trophy, Clock, CheckCircle, AlertCircle } from "lucide-react";
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

interface Participant {
  _id: string;
  displayName: string;
  userId: string;
}

interface PartialLeagueWelcomeProps {
  league: League;
  currentUser: User | null;
  participants: Participant[];
}

export function PartialLeagueWelcome({ league, currentUser, participants }: PartialLeagueWelcomeProps) {
  const [showDraftDateInput, setShowDraftDateInput] = useState(false);
  const [scheduledDraftDate, setScheduledDraftDate] = useState("");
  
  const updateLeague = useMutation(api.leagues.updateLeague);
  
  const numParticipants = participants.length;
  const participantsNeeded = 8 - numParticipants;
  
  // Calculate minimum local datetime for datetime-local input
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

  const copyMessage = `"${league.name}" NFL draft league - it's free, takes 5 seconds to join, and I promise it's not as nerdy as regular fantasy football. Just pick 4 NFL teams and talk trash for 4 months. Draft is ${league.scheduledDraftDate ? new Date(league.scheduledDraftDate).toLocaleDateString() + " at " + new Date(league.scheduledDraftDate).toLocaleTimeString() : "[Date] at [Time]"}.

Join here: ${window.location.origin}/leagues?joinCode=${league.joinCode}

Don't make me be the guy who couldn't get 8 people together for something this stupid simple.`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(copyMessage);
    toast.success("Recruitment message copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-8 md:gap-12 items-center mb-12">
        <div className="text-left order-2 md:order-1">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            We're Getting Somewhere...
          </h1>
          <h2 className="text-2xl text-muted-foreground mb-6">
            Progress! You've Got Some Friends (Not Enough, But Some)
          </h2>
          
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Look at that - actual human beings have joined your league! It's like watching a sad 
              house party slowly turn into something that might not completely suck. You're at{" "}
              <strong className="text-primary">{numParticipants} out of 8</strong> participants, which 
              means you're either halfway there or dangerously close to having to draft with a bunch 
              of empty slots.
            </p>
          </div>
        </div>

        <div className="flex justify-center md:justify-center order-1 md:order-2">
          <img
            src="/league-images/commisioner_andPlayers.png"
            alt="Commissioner and Players"
            className="w-48 h-48 md:w-64 md:h-64 object-contain"
          />
        </div>
      </div>

      {/* Current League Status */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Current League Status: "Cautiously Optimistic"
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                The Good News
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>• People actually showed up (shocking)</p>
              <p>• Your join code works (technology is amazing)</p>
              <p>• You have enough people for some decent trash talk</p>
              <p>• At least it's not just you talking to yourself anymore</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                The Less Good News
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>• You still need <strong>{participantsNeeded} more people</strong> to make this thing actually work</p>
              <p>• Every day that passes is another day someone might lose interest</p>
              <p>• Draft day is approaching and incomplete leagues are just sad</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Current Participants */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Your Fellow Degenerates So Far:
        </h2>
        <p className="text-muted-foreground mb-6 italic">
          The brave souls who actually clicked your link
        </p>
        
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {participants.map((participant, index) => (
                <div key={participant._id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{participant.displayName}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-center text-muted-foreground">
                <strong>Missing:</strong> {participantsNeeded} more people who apparently have "better things to do"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What Happens If We Don't Fill Up */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          What Happens If We Don't Fill Up?
        </h2>
        
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <strong>Honest answer:</strong> It gets weird. Empty draft slots, uneven competition, 
            and that awkward feeling like you threw a party and only half the people showed up. 
            It's technically playable, but it's like playing poker with 4 people - sure, it works, 
            but everyone knows something's missing.
          </p>
          <p>
            <strong className="text-primary">The fix:</strong> Get more friends. Revolutionary concept, we know.
          </p>
        </div>
      </div>

      {/* Commissioner Call to Action */}
      <div className="mb-12 text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Commissioner: Time to Step Up
        </h1>
        <h2 className="text-2xl text-muted-foreground mb-8">
          Your League Needs You (Again)
        </h2>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Alright, Commissioner {currentUser?.username}, time to earn that fancy title. You've 
            done the hard part - you got people to actually join. But now comes the even harder 
            part: getting the REST of your friends to stop making excuses and commit to 3 minutes 
            of their lives once a week.
          </p>
        </div>

        {/* Ammunition Section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Your Ammunition:</h3>
          <Card className="bg-muted/50 mb-6">
            <CardContent className="pt-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Join Code:</span>
                  <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
                    {league.joinCode}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Join Link:</span>
                  <Badge variant="outline" className="text-sm font-mono px-2 py-1 max-w-xs truncate">
                    loweffort.bet/join/{league.joinCode}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Draft Date:</span>
                  <Badge variant="outline">
                    {league.scheduledDraftDate 
                      ? new Date(league.scheduledDraftDate).toLocaleString()
                      : "Not set yet"
                    }
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={handleShareJoinCode} variant="outline" size="sm" className="gap-2">
                  <Share className="h-4 w-4" />
                  Copy Code
                </Button>
                <Button onClick={handleShareLeagueLink} variant="outline" size="sm" className="gap-2">
                  <Share className="h-4 w-4" />
                  Copy Link
                </Button>
                <Button onClick={handleCopyMessage} variant="outline" size="sm" className="gap-2">
                  <Share className="h-4 w-4" />
                  Copy Recruitment Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* The Commissioner's Methods */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">The Commissioner's Call to Action</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">The Guilt Trip Method:</h4>
              <p className="text-sm text-muted-foreground italic">
                "Come on, it's literally free and takes 5 minutes to set up. If you can't spare 5 
                minutes for friendship, what are we even doing here?"
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">The FOMO Method:</h4>
              <p className="text-sm text-muted-foreground italic">
                "Everyone's joining and you're going to be the only one not in on the trash talk. 
                Don't be that person."
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">The Brutally Honest Method:</h4>
              <p className="text-sm text-muted-foreground italic">
                "Look, I need {participantsNeeded} more people or this whole thing falls apart and I look like an idiot. 
                Help me not look like an idiot."
              </p>
            </div>
          </div>
        </div>

        {/* Last Resort Options */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Last Resort Options:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong>Your coworkers</strong> (desperate times)</li>
            <li><strong>That one friend from high school</strong> you only talk to on birthdays</li>
            <li><strong>Your sibling</strong> (they legally have to participate)</li>
            <li><strong>Your neighbor</strong> (might as well get weird with it)</li>
          </ul>
        </div>

        {/* What NOT to Do */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">What NOT to Do:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Don't threaten people (much)</li>
            <li>Don't promise prizes you can't deliver</li>
            <li>Don't make it sound more complicated than it is</li>
            <li>Don't give up and let your league die a sad, incomplete death</li>
          </ul>
        </div>
      </div>

      {/* Bottom Line Section */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          The Bottom Line
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            You started this thing, now finish it. Your league is counting on you, and by "counting 
            on you," we mean they're probably not thinking about it at all, which is why you need 
            to make them think about it.
          </p>
          <p>
            Get out there and recruit like your digital reputation depends on it. Because it kind of does.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
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
              {league.isAdmin && (
                <Button variant="outline" className="gap-2" onClick={handleSetDraftDate}>
                  <Calendar className="h-4 w-4" />
                  {league.scheduledDraftDate ? "Update Draft Date" : "Set Draft Date"}
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={handleShareLeagueLink}>
                <Users className="h-4 w-4" />
                Invite Friends
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleCopyMessage}>
                <Share className="h-4 w-4" />
                Send Reminder
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              Your league: <strong>{league.name}</strong> | Members: <Badge variant="outline">{numParticipants}/8</Badge>
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
  );
}