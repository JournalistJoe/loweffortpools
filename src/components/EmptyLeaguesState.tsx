import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trophy, Users } from "lucide-react";

interface EmptyLeaguesStateProps {
  onCreateLeague: () => void;
  onJoinLeague: () => void;
}

export function EmptyLeaguesState({ onCreateLeague, onJoinLeague }: EmptyLeaguesStateProps) {
  return (
    <div className="max-w-6xl mx-auto py-12">
      {/* Hero Section with Image and Headlines */}
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-8 md:gap-12 items-center mb-12">
        {/* Content Column */}
        <div className="text-left order-2 md:order-1">
          {/* Main Headlines */}
          <div className="mb-8 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Well, This is Awkward...
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              It's crickets in here. Like, really quiet. Uncomfortably quiet.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              You've successfully logged into LowEffort.bet, but there's literally nothing happening because you're not in any leagues yet. It's like showing up to a party and realizing you're three hours early and nobody else is coming.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Don't panic. This is totally normal. Everyone starts somewhere, and that somewhere is this exact moment of "now what?"
            </p>
          </div>
        </div>

        {/* Image Column */}
        <div className="flex justify-center md:justify-center order-1 md:order-2">
          <img 
            src="/home-images/Awkward_football.png"
            alt="Awkward Football surrounded by ants"
            className="w-48 h-48 md:w-64 md:h-64 object-contain"
          />
        </div>
      </div>

      {/* Your Next Move Section */}
      <div className="mb-12 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Your Next Move (Pick One, We're Not Your Mom)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Create League Card */}
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xl">
                <Trophy className="h-6 w-6" />
                🏈 Create a League
              </CardTitle>
              <p className="text-sm text-green-600 dark:text-green-400 italic">
                Translation: Be the boss of your own little football fiefdom
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-left text-green-700 dark:text-green-300 leading-relaxed">
                Start your own league and become the commissioner (fancy title for "person who has to deal with everyone's complaints"). You'll get a join code to send to your friends, who will then proceed to ignore it for three days before joining at the last minute.
              </p>
              
              <div className="text-left">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Perfect if:</p>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1 list-disc list-inside">
                  <li>You like being in charge of things</li>
                  <li>Your friends need someone to make decisions for them</li>
                  <li>You want to pick the draft date and watch everyone else complain about it</li>
                </ul>
              </div>
              
              <Button 
                onClick={onCreateLeague}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                size="lg"
              >
                Create a League
              </Button>
            </CardContent>
          </Card>

          {/* Join League Card */}
          <Card className="border-primary/20 bg-primary/5 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary text-xl">
                <Users className="h-6 w-6" />
                🤝 Join a League
              </CardTitle>
              <p className="text-sm text-muted-foreground italic">
                Translation: Let someone else do the work while you reap the benefits
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-left text-muted-foreground leading-relaxed">
                Someone already created a league and gave you a join code. Smart move - why create when you can just show up? It's like being invited to a potluck but only bringing napkins.
              </p>
              
              <div className="text-left">
                <p className="text-sm font-medium text-foreground mb-2">Perfect if:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Someone else is handling the logistics (bless them)</li>
                  <li>You just want to draft teams and talk trash</li>
                  <li>You're here because Dave wouldn't stop texting you about it</li>
                </ul>
              </div>
              
              <Button 
                onClick={onJoinLeague}
                className="w-full mt-4"
                size="lg"
              >
                Join a League
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Still Confused Section */}
      <div className="mb-12 space-y-4 text-left">
        <h3 className="text-xl font-bold text-foreground">
          Still Confused?
        </h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Look, we get it. New apps can be weird. Here's the deal:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>If someone told you about LowEffort.bet</strong> → They probably have a league going. Ask them for the join code and hit "Join a League"</li>
            <li><strong>If you just stumbled across this</strong> → Either create your own league or find someone who knows what they're doing</li>
            <li><strong>If you're still lost</strong> → Just pick one. Worst case scenario, you learn how this whole thing works. Best case, you dominate your friends and never let them forget it.</li>
          </ul>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t pt-8 space-y-4 text-left">
        <h3 className="text-lg font-bold text-foreground">
          The Bottom Line
        </h3>
        <p className="text-sm text-muted-foreground italic">
          You can't do much of anything until you're actually in a league. It's like trying to play football without other people - technically possible, but pretty pointless and kind of sad.
        </p>
        <p className="text-base font-medium text-foreground">
          So go ahead, pick your adventure. Your future trash talk depends on it.
        </p>
      </div>
    </div>
  );
}