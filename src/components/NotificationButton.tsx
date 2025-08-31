import { Bell, BellOff } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useUserMenu } from "../hooks/useUserMenu";

interface NotificationButtonProps {
  onClick: () => void;
  variant?: "ghost" | "default" | "destructive" | "outline" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function NotificationButton({ 
  onClick, 
  variant = "ghost", 
  size = "sm",
  className = "gap-2" 
}: NotificationButtonProps) {
  const { unreadCount, getNotificationIconType } = useUserMenu();
  
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

  if (size === "icon") {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        className={`relative ${className}`}
      >
        {getNotificationIcon()}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={className}
    >
      <Bell className="h-4 w-4" />
      Notifications
    </Button>
  );
}