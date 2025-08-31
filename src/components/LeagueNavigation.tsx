import { Link, useParams, useNavigate } from "react-router-dom";
import { SignOutButtonShadCN } from "../SignOutButtonShadCN";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useFont } from "../contexts/FontContext";
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  Menu,
  LogOut,
  Bell,
  BellOff,
  Sun,
  Moon,
  User,
  Type,
  AlignLeft,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { DraftCountdown } from "./DraftCountdown";
import { NotificationSettings } from "./NotificationSettings";
import { PushNotificationManager } from "./PushNotificationManager";
import { AppHeader } from "./AppHeader";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useUserMenu } from "../hooks/useUserMenu";

interface LeagueNavigationProps {
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

export function LeagueNavigation({ league }: LeagueNavigationProps) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { theme } = useTheme();
  const { font, toggleFont } = useFont();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const removeParticipant = useMutation(api.leagues.removeParticipant);
  const { leagueNavItems, bottomNavItems } = useAppNavigation(league);
  
  // Add UserMenu functionality
  const {
    currentUser,
    toggleTheme,
    unreadCount,
    getNotificationIconType,
  } = useUserMenu();

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

  // Create breadcrumb with draft countdown if applicable
  const breadcrumbContent = (
    <div className="flex flex-col space-y-1">
      <span>{league.name || "Unnamed League"}</span>
      {league.status === "setup" && league.scheduledDraftDate && (
        <DraftCountdown
          scheduledDraftDate={league.scheduledDraftDate}
          className="text-xs"
        />
      )}
    </div>
  );

  // Create breadcrumb - just the league name for AppHeader
  const breadcrumb = league.name || "Unnamed League";

  // Create notification icon based on status
  const getNotificationIcon = () => {
    const iconType = getNotificationIconType();
    
    if (iconType === "off") {
      return <BellOff className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (iconType === "active") {
      return <Bell className="h-4 w-4 text-green-600" />;
    }
    
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  // Create hamburger menu action with menu icon
  const hamburgerAction = (
    <div className="flex items-center space-x-2">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2">
            <Menu className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{league.name || "Unnamed League"}</SheetTitle>
          </SheetHeader>

          {/* Draft Countdown */}
          {league.status === "setup" && league.scheduledDraftDate && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <DraftCountdown
                scheduledDraftDate={league.scheduledDraftDate}
                className="text-sm"
              />
            </div>
          )}
          
          {/* Navigation Items */}
          <div className="mt-6 space-y-2">
            {leagueNavItems.map((item) => {
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
            
            {/* User Actions Section */}
            <div className="flex items-center justify-between px-2 mt-4">
              <h3 className="text-sm font-medium text-muted-foreground break-words">
                User Settings - {currentUser?.email}
              </h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <Button
              onClick={() => {
                setShowNotificationSettings(true);
                setIsMobileMenuOpen(false);
              }}
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
            >
              {getNotificationIcon()}
              Notifications
            </Button>

            <Button
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light" : "Dark"} Theme
            </Button>

            <Button
              onClick={() => {
                toggleFont();
                setIsMobileMenuOpen(false);
              }}
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
            >
              {font === "custom" ? (
                <Type className="h-4 w-4" />
              ) : (
                <AlignLeft className="h-4 w-4" />
              )}
              {font === "custom" ? "Eli Mode" : "LowEffort Mode"}
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
  );

  return (
    <>
      {/* Use AppHeader with user icon for all screen sizes */}
      <AppHeader breadcrumb={breadcrumb} actions={hamburgerAction} showUserMenu={false} />

      {/* Bottom Tab Navigation for Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t px-2 py-2 z-50">
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

      {/* Add bottom padding for mobile only to prevent content from being hidden behind bottom tabs */}
      <div className="h-16 md:hidden"></div>

      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle>Notification Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto flex-1 w-full min-h-0">
            {/* Push Notifications (device-level, applies to all) */}
            <PushNotificationManager />
            
            <Tabs defaultValue="league" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="league" className="truncate">This League</TabsTrigger>
                <TabsTrigger value="global" className="truncate">All Leagues</TabsTrigger>
              </TabsList>
              
              <TabsContent value="league" className="mt-4 space-y-4 w-full">
                <div className="text-sm text-muted-foreground break-words">
                  Settings specific to <strong>{league.name || "this league"}</strong>. These will override your global defaults.
                </div>
                <NotificationSettings leagueId={leagueId as any} />
              </TabsContent>
              
              <TabsContent value="global" className="mt-4 space-y-4 w-full">
                <div className="text-sm text-muted-foreground break-words">
                  Default notification settings that apply to all leagues unless overridden.
                </div>
                <NotificationSettings showGlobalSettings={true} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}