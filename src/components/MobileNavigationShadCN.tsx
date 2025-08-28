import { Link, useParams } from "react-router-dom";
import { SignOutButtonShadCN } from "../SignOutButtonShadCN";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  Menu,
  Users,
  Trophy,
  Calendar,
  MessageCircle,
  Settings,
  Home,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { DraftCountdown } from "./DraftCountdown";

interface NavigationProps {
  league: {
    _id: string;
    name?: string;
    status: string;
    isAdmin: boolean;
    isParticipant: boolean;
    scheduledDraftDate?: number;
  };
}

export function MobileNavigationShadCN({ league }: NavigationProps) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    const items = [];

    // Show different tabs based on league status
    if (league.status === "setup") {
      // Setup phase - no additional tabs
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

    // Chat tab (always available for participants and admins)
    if (league.isParticipant || league.isAdmin) {
      items.push({
        name: "Chat",
        href: `/league/${leagueId}/chat`,
        current: location.pathname.includes("/chat"),
        icon: MessageCircle,
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

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-background border-b md:block hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="text-xl font-bold text-foreground hover:text-muted-foreground transition-colors flex items-center gap-2"
              >
                <img src="/lowEffortLogo.png" alt="LowEffort.bet" className="h-6 w-6" />
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

              <ThemeToggle />
              <SignOutButtonShadCN />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-background border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Link
                to="/"
                className="text-xl font-bold text-foreground flex items-center gap-2"
              >
                <img src="/lowEffortLogo.png" alt="LowEffort.bet" className="h-6 w-6" />
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

                  <Separator className="my-4" />

                  <SignOutButtonShadCN />
                </div>
              </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Bottom Tab Navigation for Main Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-2 py-2 z-50">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {navItems.slice(0, 4).map((item) => {
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
                    <span className="text-xs font-medium truncate">
                      {item.name}
                    </span>
                  </Link>
                </Button>
              );
            })}

            {navItems.length > 4 && (
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
    </>
  );
}
