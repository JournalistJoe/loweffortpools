import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, Sun, Moon } from "lucide-react";

export function TermsOfServicePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
            >
              <img 
                src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"}
                alt="LowEffort.bet Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">LowEffort.bet</span>
            </button>
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
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8">
        <div className="container max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-left space-y-8">
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    LowEffort.bet Terms of Service & Privacy Policy
                  </h1>
                  <p className="text-sm text-muted-foreground italic">
                    *Last Updated: Because lawyers made us put a date*
                  </p>
                </div>

                <Separator />

                {/* Terms of Service */}
                <section id="terms">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Terms of Service
                      </h2>
                      <h3 className="text-lg text-muted-foreground mb-4 italic">
                        Or: "The Fine Print Nobody Reads But We Have to Write Anyway"
                      </h3>
                    </div>

                    <p className="text-foreground">
                      <strong>Welcome to LowEffort.bet!</strong> By using our app, you agree to these terms. If you don't agree, well, there's always actual fantasy football with its 47-page rulebooks.
                    </p>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">What We Do</h4>
                      <p className="text-muted-foreground">
                        We run a simple NFL team draft app. You pick teams, they win or lose, you get points or don't. It's like fantasy football's chill cousin who doesn't stress about everything.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">What You Do</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li><strong>Be 18+</strong> - If you're not, go ask your parents or something</li>
                        <li><strong>Don't be a jerk</strong> - Trash talk is encouraged, harassment isn't. There's a difference between "your team sucks" and actual mean stuff</li>
                        <li><strong>No real money gambling</strong> - This is for bragging rights and group chat supremacy only. If you're betting actual cash on the side, that's between you and your questionable life choices</li>
                        <li><strong>Create one account</strong> - We're not running a witness protection program here</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">The Rules (Such As They Are)</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>8 people per league max - we're not managing your entire extended family</li>
                        <li>Draft happens when the admin says it happens - democracy is overrated</li>
                        <li>3 minutes per pick - if you need longer to choose between NFL teams, maybe this isn't for you</li>
                        <li>Our scoring system is final - wins = 1 point, losses = 0, ties = 0.5 because ties are weird</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">What We're Not Responsible For</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Your friend Dave always picking terrible teams</li>
                        <li>The NFL making bizarre scheduling decisions</li>
                        <li>Your inability to handle losing to someone who "doesn't even watch football"</li>
                        <li>Any actual gambling you do based on our completely arbitrary point system</li>
                        <li>Technical issues that occur because you're using Internet Explorer from 2003</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Accounts and Data</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>We can suspend accounts for being genuinely awful people</li>
                        <li>We'll try to keep your data safe but we're not the Pentagon</li>
                        <li>If you delete your account, your legendary trash talk disappears forever (tragic, really)</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Changes to Terms</h4>
                      <p className="text-muted-foreground">
                        We might update these occasionally. We'll let you know, probably. If you keep using the app after changes, you're cool with them.
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Privacy Policy */}
                <section id="privacy">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Privacy Policy
                      </h2>
                      <h3 className="text-lg text-muted-foreground mb-4 italic">
                        Or: "What We Do With Your Info (Spoiler: Not Much)"
                      </h3>
                    </div>

                    <p className="text-foreground">
                      <strong>The Short Version:</strong> We collect the bare minimum to make the app work and we're not selling your data to anyone. We're too lazy for elaborate data schemes.
                    </p>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">What We Collect</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-foreground mb-1">Account Stuff:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Email address (for login and occasional "hey, your draft is starting" notifications)</li>
                            <li>Username (for maximum trash talk identification)</li>
                            <li>League participation (so we know which friends are crushing your dreams)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Usage Stuff:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>When you use the app (fascinating, we know)</li>
                            <li>Which features you click (riveting data)</li>
                            <li>Basic device info (phone, tablet, that laptop from 2015)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Chat Messages:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Your legendary trash talk is stored so everyone can relive your greatest roasts</li>
                            <li>We don't read your messages unless someone reports something actually problematic</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">What We Don't Collect</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Your real name (unless you put it in your username, genius)</li>
                        <li>Location data (we don't need to know you're drafting from your mom's basement)</li>
                        <li>Financial information (because this is FREE, remember?)</li>
                        <li>Your browsing history (we don't care what else you do online)</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">How We Use Your Info</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Make the app work (revolutionary concept)</li>
                        <li>Send draft reminders (because forgetting would be peak low effort, even for us)</li>
                        <li>Fix bugs (when we feel like it)</li>
                        <li>Absolutely nothing else because we're not running a surveillance operation</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Who We Share With</h4>
                      <p className="text-muted-foreground">
                        <strong>Nobody.</strong> Seriously. We're not selling your email to spam companies or your draft picks to Vegas bookies. The most we might do is aggregate anonymous stats like "47% of users inexplicably keep drafting the Jets."
                      </p>
                      <div className="mt-2">
                        <p className="font-medium text-foreground mb-1">Exceptions:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                          <li>If legally required (like if the FBI really wants to know about your fantasy football habits)</li>
                          <li>If you're doing something genuinely illegal through our chat (don't)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Your Rights</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Delete your account anytime (we'll miss your terrible takes)</li>
                        <li>Ask what data we have (spoiler: not much)</li>
                        <li>Request corrections (if we somehow got your username wrong)</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Security</h4>
                      <p className="text-muted-foreground">
                        We use reasonable security measures. We're not Fort Knox, but we're not storing your data on a sticky note either.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Kids</h4>
                      <p className="text-muted-foreground">
                        Don't use this if you're under 18. Go play actual sports or something.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Changes</h4>
                      <p className="text-muted-foreground">
                        We might update this policy. If we do, we'll let you know. Probably.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-foreground">Contact Us</h4>
                      <p className="text-muted-foreground">
                        Got questions? Complaints? Want to argue about our scoring system? Email us at{" "}
                        <a 
                          href="mailto:support@loweffort.bet"
                          className="text-primary hover:underline"
                        >
                          support@loweffort.bet
                        </a>
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                <div className="bg-muted/30 p-6 rounded-lg">
                  <p className="text-muted-foreground italic text-center mb-4">
                    Remember: This is a free app for messing around with friends. If you're taking any of this too seriously, you're probably missing the point.
                  </p>
                  <p className="font-semibold text-foreground text-center">
                    TL;DR: We collect basic info to make the app work, we don't sell your data, don't be awful to people, and yes, the Jets still suck.
                  </p>
                </div>

                <div className="text-center">
                  <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}