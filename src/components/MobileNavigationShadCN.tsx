import { Link, useParams, useNavigate } from "react-router-dom";
import { SignOutButtonShadCN } from "../SignOutButtonShadCN";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  Menu,
  Users,
  Trophy,
  Calendar,
  Settings,
  Home,
  User,
  LogOut,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { DraftCountdown } from "./DraftCountdown";
import { NotificationSettings } from "./NotificationSettings";

interface NavigationProps {
  league: {
    _id: string;
    name?: string;
    status: string;
    isAdmin: boolean;
    isParticipant: boolean;
    isSpectator?: boolean;
    scheduledDraftDate?: number;
    participant?: {
      _id: string;
      displayName: string;
    };
    spectator?: {
      _id: string;
      displayName: string;
    };
  };
}

export function MobileNavigationShadCN({ league }: NavigationProps) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const removeParticipant = useMutation(api.leagues.removeParticipant);

  const handleLeaveLeague = async () => {
    if (!league?.participant || !leagueId) return;
    if (
      !confirm(
        "Are you sure you want to leave this league? This action cannot be undone.",
      )
    )
      return;

    try {
      await removeParticipant({
        leagueId: leagueId as any,
        participantId: league.participant._id as any,
      });
      toast.success("Successfully left the league");
      // Navigation will be handled by the context
    } catch (error) {
      toast.error(String(error));
    }
  };

  const getNavItems = () => {
    const items = [];

    // Show different tabs based on league status
    if (league.status === "setup") {
      // Setup phase - show participants tab
      items.push({
        name: "Participants",
        href: `/league/${leagueId}/participants`,
        current: location.pathname.includes("/participants"),
        icon: Users,
      });
    } else if (league.status === "draft") {
      items.unshift({
        name: "Draft",
        href: `/league/${leagueId}/draft`,
        current: location.pathname.includes("/draft"),
        icon: Trophy,
      });
    } else if (league.status === "live" || league.status === "completed") {
      items.unshift({
        name: "Leaderboard",
        href: `/league/${leagueId}/leaderboard`,
        current: location.pathname.includes("/leaderboard"),
        icon: Trophy,
      });
      items.push({
        name: "Schedule",
        href: `/league/${leagueId}/schedule`,
        current: location.pathname.includes("/schedule"),
        icon: Calendar,
      });
    }

    // My Team tab (only available for participants)
    if (league.isParticipant && league.participant) {
      items.push({
        name: "My Team",
        href: `/league/${leagueId}/team/${league.participant._id}`,
        current: location.pathname.includes("/team/"),
        icon: User,
      });
    }

    // Admin tab (always last if user is admin)
    if (league.isAdmin) {
      items.push({
        name: "Admin",
        href: `/league/${leagueId}/admin`,
        current: location.pathname.includes("/admin"),
        icon: Settings,
      });
    }

    return items;
  };

  const navItems = getNavItems();
  
  const getBottomNavItems = () => {
    // First filter out chat route (if it exists)
    const filteredItems = navItems.filter(item => 
      !item.href.includes('/chat')
    );
    
    // Then map to replace "My Team" with personalized name using safe fallback
    return filteredItems.map(item => {
      if (item.name === "My Team" && league.participant) {
        return {
          ...item,
          name: league.participant.displayName?.trim() || "My Team"
        };
      }
      return item;
    });
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-background border-b md:block hidden sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="text-xl font-bold text-foreground hover:text-muted-foreground transition-colors flex items-center gap-2"
              >
                <img src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"} alt="LowEffort.bet" className="h-6 w-6" />
                LowEffort.bet
              </Link>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">›</span>
                  <span className="text-foreground font-medium">
                    {league.name || "Unnamed League"}
                  </span>
                </div>
                {league.status === "setup" && league.scheduledDraftDate && (
                  <DraftCountdown
                    scheduledDraftDate={league.scheduledDraftDate}
                    className="text-xs ml-4"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.name}
                    asChild
                    variant={item.current ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Link to={item.href}>
                      <IconComponent className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                );
              })}

              {league.isParticipant && league.status === "setup" && (
                <Button
                  onClick={handleLeaveLeague}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Leave League
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotificationSettings(true)}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Button>

              <ThemeToggle />
              <SignOutButtonShadCN />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-background border-b sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Link
                to="/"
                className="text-xl font-bold text-foreground flex items-center gap-2"
              >
                <img src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"} alt="LowEffort.bet" className="h-6 w-6" />
                LowEffort.bet
              </Link>
              <div className="text-sm text-muted-foreground truncate mt-0.5">
                {league.name || "Unnamed League"}
              </div>
              {league.status === "setup" && league.scheduledDraftDate && (
                <DraftCountdown
                  scheduledDraftDate={league.scheduledDraftDate}
                  className="text-xs mt-1"
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Button
                        key={item.name}
                        asChild
                        variant={item.current ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to={item.href}>
                          <IconComponent className="h-4 w-4" />
                          {item.name}
                          {item.current && (
                            <Badge variant="secondary" className="ml-auto">
                              Active
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    );
                  })}

                  {league.isParticipant && league.status === "setup" && (
                    <Button
                      onClick={() => {
                        handleLeaveLeague();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full justify-start gap-3 h-12"
                    >
                      <LogOut className="h-4 w-4" />
                      Leave League
                    </Button>
                  )}

                  <Separator className="my-4" />

                  <Button
                    onClick={() => {
                      setShowNotificationSettings(true);
                      setIsMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                  >
                    <Bell className="h-4 w-4" />
                    Notification Settings
                  </Button>

                  <SignOutButtonShadCN />

                  {/* Footer Section */}
                  <div className="mt-8 pt-4 border-t space-y-3">
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <button
                        onClick={() => {
                          navigate("/terms");
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-primary hover:underline text-left"
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
              </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Bottom Tab Navigation for Main Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-2 py-2 z-50">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {bottomNavItems.slice(0, 4).map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.name}
                  asChild
                  variant={item.current ? "secondary" : "ghost"}
                  size="sm"
                  className="flex flex-col h-12 px-2 py-1 gap-1 min-w-0 flex-1"
                >
                  <Link to={item.href}>
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </span>
                  </Link>
                </Button>
              );
            })}

            {bottomNavItems.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col h-12 px-2 py-1 gap-1 min-w-0 flex-1"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
                <span className="text-xs font-medium">More</span>
              </Button>
            )}
          </div>
        </div>

        {/* Add bottom padding to prevent content from being hidden behind bottom tabs */}
        <div className="h-16"></div>
      </div>

      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>League Notification Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <NotificationSettings leagueId={leagueId as any} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
