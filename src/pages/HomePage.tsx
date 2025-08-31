import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { normalizeJoinCode, isValidJoinCode, JOIN_CODE_LENGTH, JOIN_CODE_PLACEHOLDER, formatJoinCodeInput } from "../utils/joinCodeUtils";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useState } from "react";
import { Users, Clock, Trophy, MessageCircle, Sun, Moon } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [joinCode, setJoinCode] = useState("");

  const handleStartLeague = () => {
    navigate("/signin");
  };

  const handleJoinLeague = () => {
    const normalized = normalizeJoinCode(joinCode.trim());
    if (normalized && isValidJoinCode(normalized)) {
      navigate(`/signin?joinCode=${encodeURIComponent(normalized)}`);
    } else {
      navigate("/signin");
    }
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

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
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" onClick={handleSignIn}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-12 md:pt-20 pb-6 md:pb-10">
        <div className="container max-w-6xl mx-auto">
          {/* Mobile Title */}
          <div className="text-left md:hidden mb-8">
            <h1 className="text-4xl font-bold mb-6 text-foreground">
              Because Fantasy Football is Too Much Work
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-8 md:gap-12 items-center mb-8 md:mb-12">
            {/* Content Column */}
            <div className="text-left md:text-left order-2 md:order-1">
              {/* Desktop Title */}
              <h1 className="hidden md:block text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                Because Fantasy Football is Too Much Work
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-0 leading-relaxed">
                Look, we get it. You want to talk trash with your buddies about football, but you don't want to spend three hours researching waiver wire pickups or memorizing injury reports like some kind of nerd.
              </p>
              
              {/* Mobile only tagline */}
              <p className="text-xl font-semibold mb-8 text-primary md:hidden mt-8">
                <span className="font-bold">Enter LowEffort.bet</span> - the most beautifully lazy way to gamble your dignity with friends.
              </p>

              {/* Mobile CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-start items-start md:hidden">
                <Button size="lg" onClick={handleStartLeague} className="w-full sm:w-auto text-lg px-8 py-3">
                  Start a League
                </Button>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <Input
                    placeholder={JOIN_CODE_PLACEHOLDER}
                    value={joinCode}
                    onChange={(e) => setJoinCode(formatJoinCodeInput(e.target.value))}
                    className="text-center uppercase tracking-wider"
                    maxLength={JOIN_CODE_LENGTH}
                  />
                  <Button variant="outline" onClick={handleJoinLeague} className="whitespace-nowrap">
                    Join League
                  </Button>
                </div>
              </div>
            </div>

            {/* Image Column */}
            <div className="flex justify-center md:justify-center order-1 md:order-2">
              <img 
                src="/home-images/home-image.png"
                alt="LowEffort.bet Hero"
                className="w-full max-w-md md:max-w-full h-auto"
              />
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" onClick={handleStartLeague} className="text-lg px-8 py-3">
              Start a League
            </Button>
            
            <div className="flex gap-2">
              <Input
                placeholder={JOIN_CODE_PLACEHOLDER}
                value={joinCode}
                onChange={(e) => setJoinCode(formatJoinCodeInput(e.target.value))}
                className="text-center uppercase tracking-wider"
                maxLength={JOIN_CODE_LENGTH}
              />
              <Button variant="outline" onClick={handleJoinLeague} className="whitespace-nowrap">
                Join League
              </Button>
            </div>
          </div>

          {/* Desktop tagline below CTAs */}
          <div className="hidden md:block text-center">
            <p className="text-xl md:text-2xl font-semibold text-primary">
              <span className="font-bold">Enter LowEffort.bet</span> - the most beautifully lazy way to gamble your dignity with friends.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 pt-6 md:pt-8 pb-12 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-left md:text-center mb-12">
            How It Works (It's Not Rocket Science)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Make a League</h3>
                <p className="text-sm text-muted-foreground">
                  You and 7 friends. That's it. We're not running the UN here.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Draft 4 NFL Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Not players. <em>Teams.</em> Each person gets 3 minutes to pick. If you can't decide in 3 minutes, you shouldn't be betting anyway.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Watch Football</h3>
                <p className="text-sm text-muted-foreground">
                  Your teams win? You get a point. They lose? Nothing happens because we're not monsters. Tie? Half a point.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">4. Talk Trash</h3>
                <p className="text-sm text-muted-foreground">
                  Built-in league chat so you can properly roast your friend Dave when his Broncos inevitably disappoint him again.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why LowEffort.bet Section */}
      <section className="px-4 py-12">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-left md:text-center mb-12">
            Why LowEffort.bet?
          </h2>
          
          <div className="space-y-8">
            <div className="text-left md:text-left">
              <h3 className="text-xl font-semibold mb-2">💰 Free</h3>
              <p className="text-muted-foreground">
                Unlike your gambling problem, this won't cost you anything
              </p>
            </div>

            <Separator />

            <div className="text-left md:text-left">
              <h3 className="text-xl font-semibold mb-2">✨ Actually Simple</h3>
              <p className="text-muted-foreground">
                No waivers, no trades, no "should I start this random backup running back?" Just pick teams and watch
              </p>
            </div>

            <Separator />

            <div className="text-left md:text-left">
              <h3 className="text-xl font-semibold mb-2">🏈 Multiple Leagues</h3>
              <p className="text-muted-foreground">
                Run as many as you want. Be the commissioner of chaos across multiple friend groups
              </p>
            </div>

            <Separator />

            <div className="text-left md:text-left">
              <h3 className="text-xl font-semibold mb-2">⚡ Draft Day Magic</h3>
              <p className="text-muted-foreground">
                Set your order, start the clock, and watch everyone panic-pick teams like they're ordering at a drive-through
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Line Section */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-left md:text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            The Bottom Line
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground mb-12">
            <p>
              This is fantasy football for people who think fantasy football is too much work.
            </p>
            <p>
              It's betting for people who are too lazy to actually bet.
            </p>
            <p>
              It's competition for people who want to compete but, you know, not <em>that</em> hard.
            </p>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-foreground">
            Ready to disappoint your friends in the most effortless way possible?
          </h3>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" onClick={handleStartLeague} className="w-full md:w-auto text-lg px-8 py-3">
              Sign Up to Start a League
            </Button>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder={JOIN_CODE_PLACEHOLDER}
                value={joinCode}
                onChange={(e) => setJoinCode(formatJoinCodeInput(e.target.value))}
                className="text-center uppercase tracking-wider"
                maxLength={JOIN_CODE_LENGTH}
              />
              <Button variant="outline" size="lg" onClick={handleJoinLeague}>
                Join by Code
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground italic">
            <span className="font-semibold">LowEffort.bet</span> - Where caring less means winning more... or at least losing with style.
          </p>
        </div>
      </section>

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
            
            <div className="flex justify-center py-4">
              <a 
                href="https://www.producthunt.com/products/loweffort-bet?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-loweffort-bet" 
                target="_blank"
                rel="noopener noreferrer"
              >
                <img 
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1011152&theme=neutral&t=1756667284548" 
                  alt="LowEffort.bet - Because Fantasy Football is Too Much Work | Product Hunt" 
                  style={{ width: '250px', height: '54px' }}
                  width="250" 
                  height="54" 
                />
              </a>
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