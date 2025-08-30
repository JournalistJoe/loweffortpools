import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../contexts/ThemeContext";
import { useNotification } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  User,
  Bell,
  BellOff,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { SignOutButton } from "../SignOutButton";
import { PushNotificationManager } from "./PushNotificationManager";
import { NotificationSettings } from "./NotificationSettings";

export function UserMenu() {
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUser = useQuery(api.auth.loggedInUser);
  const { theme, toggleTheme } = useTheme();
  const { subscriptionStatus, unreadCount, permission } = useNotification();
  const navigate = useNavigate();

  const getNotificationIcon = () => {
    if (permission === "denied" || permission === "unsupported") {
      return <BellOff className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (subscriptionStatus === "subscribed") {
      return <Bell className="w-4 h-4 text-green-600" />;
    }
    
    return <Bell className="w-4 h-4 text-muted-foreground" />;
  };

  const getNotificationStatus = () => {
    if (permission === "denied") return "Denied";
    if (permission === "unsupported") return "Not Supported";
    if (subscriptionStatus === "subscribed") return "Active";
    return "Inactive";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <User className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
            <span className="sr-only">User menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentUser?.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowNotifications(true)}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                {getNotificationIcon()}
                <span className="ml-2">Notifications</span>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {getNotificationStatus()}
                </span>
              </div>
            </div>
          </DropdownMenuItem>


          <DropdownMenuItem onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            <span>
              {theme === "dark" ? "Light" : "Dark"} Theme
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <SignOutButton>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Notification Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <PushNotificationManager />
            <NotificationSettings showGlobalSettings={true} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}